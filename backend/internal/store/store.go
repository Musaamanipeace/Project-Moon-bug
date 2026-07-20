package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"moonbug/internal/db"
)

// User is a registered Moonbug account.
type User struct {
	ID                   string
	Email                string
	DisplayName          string
	AuthMethod           string
	PreferredMethod      string
	NotificationsEnabled bool
	Streak               int
	LongestStreak        int
	CreatedAt            time.Time
}

// Challenge is one of the five lunar challenges.
type Challenge struct {
	ID          string
	Slug        string
	Title       string
	Description string
	Prompt      string
	MoonPhase   string
	Icon        string
	SortOrder   int
}

// ChallengeState is a user's saved data + completion for a challenge on a date.
type ChallengeState struct {
	ChallengeID string
	Slug        string
	LogDate     string
	Data        map[string]interface{}
	Completed   bool
	CompletedAt *time.Time
	UpdatedAt   time.Time
}

// Badge is an earned challenge badge.
type Badge struct {
	ChallengeID string
	Title       string
	Icon        string
	AwardedAt   time.Time
}

var ErrNotFound = errors.New("not found")

func GetUserByEmail(ctx context.Context, email string) (*User, error) {
	return scanUser(ctx, `SELECT id, email, display_name, auth_method, preferred_method, notifications_enabled, streak, longest_streak, created_at FROM users WHERE email = $1`, email)
}

func GetUserByID(ctx context.Context, id string) (*User, error) {
	return scanUser(ctx, `SELECT id, email, display_name, auth_method, preferred_method, notifications_enabled, streak, longest_streak, created_at FROM users WHERE id = $1`, id)
}

func scanUser(ctx context.Context, query string, args ...interface{}) (*User, error) {
	var u User
	err := db.Pool.QueryRow(ctx, query, args...).Scan(
		&u.ID, &u.Email, &u.DisplayName, &u.AuthMethod, &u.PreferredMethod,
		&u.NotificationsEnabled, &u.Streak, &u.LongestStreak, &u.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &u, nil
}

// CreateUser gets an existing user by email or creates a new one.
func CreateUser(ctx context.Context, email, displayName, authMethod, passwordHash string) (*User, error) {
	if existing, err := GetUserByEmail(ctx, email); err == nil {
		return existing, nil
	}
	if displayName == "" {
		displayName = "Moonbug"
	}
	var u User
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO users (email, display_name, auth_method, password_hash)
		VALUES ($1, $2, $3, $4)
		RETURNING id, email, display_name, auth_method, preferred_method, notifications_enabled, streak, longest_streak, created_at
	`, email, displayName, authMethod, passwordHash).Scan(
		&u.ID, &u.Email, &u.DisplayName, &u.AuthMethod, &u.PreferredMethod,
		&u.NotificationsEnabled, &u.Streak, &u.LongestStreak, &u.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetPasswordHash returns the stored bcrypt hash for a user (may be empty).
func GetPasswordHash(ctx context.Context, userID string) (string, error) {
	var hash sql.NullString
	err := db.Pool.QueryRow(ctx, `SELECT password_hash FROM users WHERE id = $1`, userID).Scan(&hash)
	if err != nil {
		return "", err
	}
	if hash.Valid {
		return hash.String, nil
	}
	return "", nil
}

// CountCompletedLogs returns the total number of completed challenge logs.
func CountCompletedLogs(ctx context.Context, userID string) (int, error) {
	var n int
	err := db.Pool.QueryRow(ctx,
		`SELECT count(*) FROM challenge_logs WHERE user_id = $1 AND completed = TRUE`, userID).Scan(&n)
	return n, err
}

// RecomputeStreak updates the stored streak and longest streak for a user.
func RecomputeStreak(ctx context.Context, userID string) error {
	cur, longest, err := ComputeStreaks(ctx, userID)
	if err != nil {
		return err
	}
	_, err = db.Pool.Exec(ctx,
		`UPDATE users SET streak = $1, longest_streak = $2 WHERE id = $3`, cur, longest, userID)
	return err
}

func UpdateUserSettings(ctx context.Context, userID string, notificationsEnabled *bool, preferredMethod *string) (*User, error) {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	if notificationsEnabled != nil {
		if _, err := tx.Exec(ctx, `UPDATE users SET notifications_enabled = $1 WHERE id = $2`, *notificationsEnabled, userID); err != nil {
			return nil, err
		}
	}
	if preferredMethod != nil {
		if _, err := tx.Exec(ctx, `UPDATE users SET preferred_method = $1 WHERE id = $2`, *preferredMethod, userID); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return GetUserByID(ctx, userID)
}

func CreateSession(ctx context.Context, userID, ip, ua string) (string, error) {
	id := uuid.NewString()
	expires := time.Now().Add(30 * 24 * time.Hour)
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO sessions (id, user_id, expires_at, ip, user_agent) VALUES ($1,$2,$3,$4,$5)`,
		id, userID, expires, ip, ua)
	if err != nil {
		return "", err
	}
	return id, nil
}

func SessionValid(ctx context.Context, sessionID string) (string, bool) {
	var userID string
	var expires time.Time
	var revoked bool
	err := db.Pool.QueryRow(ctx,
		`SELECT user_id, expires_at, revoked FROM sessions WHERE id = $1`, sessionID).
		Scan(&userID, &expires, &revoked)
	if err != nil {
		return "", false
	}
	if revoked || expires.Before(time.Now()) {
		return "", false
	}
	return userID, true
}

func RevokeSession(ctx context.Context, sessionID string) error {
	_, err := db.Pool.Exec(ctx, `UPDATE sessions SET revoked = TRUE WHERE id = $1`, sessionID)
	return err
}

func SaveOTP(ctx context.Context, email, codeHash string, expiresAt time.Time) error {
	_, err := db.Pool.Exec(ctx,
		`INSERT INTO otp_codes (email, code_hash, expires_at) VALUES ($1,$2,$3)`,
		email, codeHash, expiresAt)
	return err
}

// VerifyOTP checks the latest unused, unexpired code for an email.
func VerifyOTP(ctx context.Context, email, codeHash string) (bool, error) {
	var id string
	var expires time.Time
	err := db.Pool.QueryRow(ctx, `
		SELECT id, expires_at FROM otp_codes
		WHERE email = $1 AND code_hash = $2 AND used = FALSE
		ORDER BY created_at DESC LIMIT 1
	`, email, codeHash).Scan(&id, &expires)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return false, nil
		}
		return false, err
	}
	if expires.Before(time.Now()) {
		return false, nil
	}
	if _, err := db.Pool.Exec(ctx, `UPDATE otp_codes SET used = TRUE WHERE id = $1`, id); err != nil {
		return false, err
	}
	return true, nil
}

func ListChallenges(ctx context.Context) ([]Challenge, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, slug, title, description, prompt, moon_phase, icon, sort_order
		FROM challenges ORDER BY sort_order
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Challenge
	for rows.Next() {
		var c Challenge
		if err := rows.Scan(&c.ID, &c.Slug, &c.Title, &c.Description, &c.Prompt, &c.MoonPhase, &c.Icon, &c.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, nil
}

func GetChallengeBySlug(ctx context.Context, slug string) (*Challenge, error) {
	var c Challenge
	err := db.Pool.QueryRow(ctx, `
		SELECT id, slug, title, description, prompt, moon_phase, icon, sort_order
		FROM challenges WHERE slug = $1
	`, slug).Scan(&c.ID, &c.Slug, &c.Title, &c.Description, &c.Prompt, &c.MoonPhase, &c.Icon, &c.SortOrder)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &c, nil
}

// UpsertChallengeLog saves a user's state for a challenge on a given date,
// awarding a badge automatically when marked complete.
func UpsertChallengeLog(ctx context.Context, userID, challengeID, logDate string, data map[string]interface{}, completed bool) (*ChallengeState, bool, error) {
	payload, err := json.Marshal(data)
	if err != nil {
		return nil, false, err
	}
	var completedAt *time.Time
	if completed {
		now := time.Now()
		completedAt = &now
	}
	var st ChallengeState
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO challenge_logs (user_id, challenge_id, log_date, data, completed, completed_at, updated_at)
		VALUES ($1,$2,$3,$4::jsonb,$5,$6,now())
		ON CONFLICT (user_id, challenge_id, log_date) DO UPDATE SET
			data = EXCLUDED.data,
			completed = EXCLUDED.completed,
			completed_at = EXCLUDED.completed_at,
			updated_at = now()
		RETURNING challenge_id, log_date::text, data, completed, completed_at, updated_at
	`, userID, challengeID, logDate, string(payload), completed, completedAt).Scan(
		&st.ChallengeID, &st.LogDate, &st.Data, &st.Completed, &st.CompletedAt, &st.UpdatedAt)
	if err != nil {
		return nil, false, err
	}
	awarded := false
	if completed {
		awarded, err = AwardBadge(ctx, userID, challengeID)
		if err != nil {
			return nil, false, err
		}
	}
	return &st, awarded, nil
}

// GetLatestLog returns the most recent completed-or-not log for a challenge.
func GetLatestLog(ctx context.Context, userID, challengeID string) (*ChallengeState, error) {
	var st ChallengeState
	var raw []byte
	err := db.Pool.QueryRow(ctx, `
		SELECT challenge_id, log_date::text, data, completed, completed_at, updated_at
		FROM challenge_logs WHERE user_id = $1 AND challenge_id = $2
		ORDER BY log_date DESC, updated_at DESC LIMIT 1
	`, userID, challengeID).Scan(&st.ChallengeID, &st.LogDate, &raw, &st.Completed, &st.CompletedAt, &st.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	_ = json.Unmarshal(raw, &st.Data)
	if st.Data == nil {
		st.Data = map[string]interface{}{}
	}
	return &st, nil
}

func AwardBadge(ctx context.Context, userID, challengeID string) (bool, error) {
	tag, err := db.Pool.Exec(ctx, `
		INSERT INTO badges (user_id, challenge_id) VALUES ($1,$2)
		ON CONFLICT (user_id, challenge_id) DO NOTHING
	`, userID, challengeID)
	if err != nil {
		return false, err
	}
	return tag.RowsAffected() > 0, nil
}

func GetBadges(ctx context.Context, userID string) ([]Badge, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT b.challenge_id, c.title, c.icon, b.awarded_at
		FROM badges b JOIN challenges c ON c.id = b.challenge_id
		WHERE b.user_id = $1 ORDER BY b.awarded_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []Badge
	for rows.Next() {
		var b Badge
		if err := rows.Scan(&b.ChallengeID, &b.Title, &b.Icon, &b.AwardedAt); err != nil {
			return nil, err
		}
		out = append(out, b)
	}
	return out, nil
}

// CompletedDates returns the set of distinct dates a user completed >=1 challenge.
func CompletedDates(ctx context.Context, userID string) (map[string]bool, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT DISTINCT log_date FROM challenge_logs
		WHERE user_id = $1 AND completed = TRUE
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		var d time.Time
		if err := rows.Scan(&d); err != nil {
			return nil, err
		}
		out[d.Format("2006-01-02")] = true
	}
	return out, nil
}

// CompletedSlugsForRange returns, per date, the challenge slugs completed.
func CompletedSlugsForRange(ctx context.Context, userID string, start, end string) (map[string][]string, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT cl.log_date, c.slug
		FROM challenge_logs cl JOIN challenges c ON c.id = cl.challenge_id
		WHERE cl.user_id = $1 AND cl.completed = TRUE AND cl.log_date BETWEEN $2 AND $3
	`, userID, start, end)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string][]string{}
	for rows.Next() {
		var d time.Time
		var slug string
		if err := rows.Scan(&d, &slug); err != nil {
			return nil, err
		}
		key := d.Format("2006-01-02")
		out[key] = append(out[key], slug)
	}
	return out, nil
}

// AllStatesForUser returns the latest log per challenge slug.
func AllStatesForUser(ctx context.Context, userID string) (map[string]*ChallengeState, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT cl.challenge_id, c.slug, cl.log_date::text, cl.data, cl.completed, cl.completed_at, cl.updated_at
		FROM challenge_logs cl JOIN challenges c ON c.id = cl.challenge_id
		WHERE cl.user_id = $1
		ORDER BY cl.log_date DESC, cl.updated_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	best := map[string]*ChallengeState{}
	for rows.Next() {
		var st ChallengeState
		var raw []byte
		if err := rows.Scan(&st.ChallengeID, &st.Slug, &st.LogDate, &raw, &st.Completed, &st.CompletedAt, &st.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(raw, &st.Data)
		if st.Data == nil {
			st.Data = map[string]interface{}{}
		}
		prev, ok := best[st.Slug]
		if !ok || st.LogDate > prev.LogDate {
			cp := st
			best[st.Slug] = &cp
		}
	}
	return best, nil
}

// ComputeStreaksFromDates returns the current and longest consecutive-day
// streaks for a set of completed date keys (YYYY-MM-DD). Pure and testable; the
// "current" streak counts back from today (or yesterday if today is incomplete).
func ComputeStreaksFromDates(dateKeys []string) (int, int) {
	set := map[string]bool{}
	parsed := make([]time.Time, 0, len(dateKeys))
	for _, d := range dateKeys {
		t, err := time.Parse("2006-01-02", d)
		if err != nil {
			continue
		}
		set[d] = true
		parsed = append(parsed, t)
	}
	if len(parsed) == 0 {
		return 0, 0
	}
	sortTimes(parsed)
	longest := 1
	cur := 1
	for i := 1; i < len(parsed); i++ {
		gap := int(parsed[i].Sub(parsed[i-1]).Hours() / 24)
		if gap == 1 {
			cur++
			if cur > longest {
				longest = cur
			}
		} else if gap > 1 {
			cur = 1
		}
	}
	today := time.Now().UTC().Format("2006-01-02")
	yesterday := time.Now().UTC().AddDate(0, 0, -1).Format("2006-01-02")
	current := 0
	check := today
	if !set[today] && set[yesterday] {
		check = yesterday
	}
	for set[check] {
		current++
		check = parseDate(check).AddDate(0, 0, -1).Format("2006-01-02")
	}
	return current, longest
}

// ComputeStreaks returns the current and longest consecutive-day streaks.
func ComputeStreaks(ctx context.Context, userID string) (int, int, error) {
	dates, err := CompletedDates(ctx, userID)
	if err != nil {
		return 0, 0, err
	}
	keys := make([]string, 0, len(dates))
	for d := range dates {
		keys = append(keys, d)
	}
	cur, longest := ComputeStreaksFromDates(keys)
	return cur, longest, nil
}

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

// ---- Notebook ----

// NotebookEntry is a single user notebook item (journal, dream, logbook, goal,
// schedule, or idea).
type NotebookEntry struct {
	ID        string
	UserID    string
	EntryType string
	Title     string
	Body      string
	DueDate   *time.Time
	CreatedAt time.Time
	UpdatedAt time.Time
}

func validEntryType(t string) bool {
	switch t {
	case "journal", "dream", "logbook", "goal", "schedule", "idea":
		return true
	}
	return false
}

// ListNotebook returns a user's notebook entries ordered newest-first.
func ListNotebook(ctx context.Context, userID string) ([]NotebookEntry, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, entry_type, title, body, due_date, created_at, updated_at
		FROM notebook_entries WHERE user_id = $1 ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []NotebookEntry{}
	for rows.Next() {
		var e NotebookEntry
		var due sql.NullTime
		if err := rows.Scan(&e.ID, &e.UserID, &e.EntryType, &e.Title, &e.Body, &due, &e.CreatedAt, &e.UpdatedAt); err != nil {
			return nil, err
		}
		if due.Valid {
			e.DueDate = &due.Time
		}
		out = append(out, e)
	}
	return out, nil
}

// CreateNotebook inserts a notebook entry.
func CreateNotebook(ctx context.Context, userID, entryType, title, body string, dueDate *time.Time) (*NotebookEntry, error) {
	if !validEntryType(entryType) {
		return nil, errors.New("invalid entry_type")
	}
	var e NotebookEntry
	var due sql.NullTime
	if dueDate != nil {
		due = sql.NullTime{Time: *dueDate, Valid: true}
	}
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO notebook_entries (user_id, entry_type, title, body, due_date)
		VALUES ($1,$2,$3,$4,$5)
		RETURNING id, user_id, entry_type, title, body, due_date, created_at, updated_at
	`, userID, entryType, title, body, due).Scan(
		&e.ID, &e.UserID, &e.EntryType, &e.Title, &e.Body, &due, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if due.Valid {
		e.DueDate = &due.Time
	}
	return &e, nil
}

// UpdateNotebook updates an existing entry owned by the user.
func UpdateNotebook(ctx context.Context, userID, id, entryType, title, body string, dueDate *time.Time) (*NotebookEntry, error) {
	if !validEntryType(entryType) {
		return nil, errors.New("invalid entry_type")
	}
	var e NotebookEntry
	var due sql.NullTime
	if dueDate != nil {
		due = sql.NullTime{Time: *dueDate, Valid: true}
	}
	err := db.Pool.QueryRow(ctx, `
		UPDATE notebook_entries
		SET entry_type = $3, title = $4, body = $5, due_date = $6, updated_at = now()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, entry_type, title, body, due_date, created_at, updated_at
	`, id, userID, entryType, title, body, due).Scan(
		&e.ID, &e.UserID, &e.EntryType, &e.Title, &e.Body, &due, &e.CreatedAt, &e.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	if due.Valid {
		e.DueDate = &due.Time
	}
	return &e, nil
}

// DeleteNotebook removes an entry owned by the user.
func DeleteNotebook(ctx context.Context, userID, id string) error {
	tag, err := db.Pool.Exec(ctx, `DELETE FROM notebook_entries WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ---- Events (Tier 1 catalogue, public) ----

// Event is a catalogue entry (astronomical or community).
type Event struct {
	ID        string
	Title     string
	EventDate time.Time
	Rarity    string
	Synopsis  string
	Category  string
	Source    string
	Tier      string
	AuthorID  *string
	Approved  bool
}

// ListEvents returns upcoming events at or after the given date (offline catalogue).
// tier filters by catalogue tier: "astronomical" returns only astronomical events,
// "community" returns only approved community events, and "" returns astronomical
// events plus any approved community events.
func ListEvents(ctx context.Context, fromDate, tier string, includeCommunity bool) ([]Event, error) {
	if fromDate == "" {
		fromDate = time.Now().UTC().Format("2006-01-02")
	}
	var where string
	var args []interface{}
	args = append(args, fromDate)
	switch tier {
	case "community":
		where = "tier = 'community' AND approved = TRUE"
	case "astronomical":
		where = "tier = 'astronomical'"
	default:
		if includeCommunity {
			where = "(tier = 'astronomical' OR (tier = 'community' AND approved = TRUE))"
		} else {
			where = "tier = 'astronomical'"
		}
	}
	rows, err := db.Pool.Query(ctx, `
		SELECT id, title, event_date, rarity, synopsis, category, source, tier, author_id, approved
		FROM events WHERE event_date >= $1 AND `+where+` ORDER BY event_date ASC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Event{}
	for rows.Next() {
		var e Event
		var author sql.NullString
		if err := rows.Scan(&e.ID, &e.Title, &e.EventDate, &e.Rarity, &e.Synopsis, &e.Category, &e.Source, &e.Tier, &author, &e.Approved); err != nil {
			return nil, err
		}
		if author.Valid {
			a := author.String
			e.AuthorID = &a
		}
		out = append(out, e)
	}
	return out, nil
}

// CreateEvent inserts a Tier 2 community event authored by the given user. It is
// created unapproved and must be moderated before appearing to other users.
func CreateEvent(ctx context.Context, userID, title, eventDate, rarity, synopsis, category, source string) (*Event, error) {
	if title == "" {
		return nil, errors.New("title is required")
	}
	t, err := time.Parse("2006-01-02", eventDate)
	if err != nil {
		return nil, errors.New("eventDate must be a valid date (YYYY-MM-DD)")
	}
	if rarity == "" {
		rarity = "common"
	}
	if category == "" {
		category = "community"
	}
	var e Event
	var author sql.NullString
	err = db.Pool.QueryRow(ctx, `
		INSERT INTO events (title, event_date, rarity, synopsis, category, source, tier, author_id, approved)
		VALUES ($1,$2,$3,$4,$5,$6,'community',$7,FALSE)
		RETURNING id, title, event_date, rarity, synopsis, category, source, tier, author_id, approved
	`, title, t, rarity, synopsis, category, source, userID).Scan(
		&e.ID, &e.Title, &e.EventDate, &e.Rarity, &e.Synopsis, &e.Category, &e.Source, &e.Tier, &author, &e.Approved)
	if err != nil {
		return nil, err
	}
	if author.Valid {
		a := author.String
		e.AuthorID = &a
	}
	return &e, nil
}

// ListCalendarEvents returns the events a user has saved to their personal calendar,
// joined with event details, ordered by event date.
func ListCalendarEvents(ctx context.Context, userID string) ([]Event, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT e.id, e.title, e.event_date, e.rarity, e.synopsis, e.category, e.source, e.tier, e.author_id, e.approved
		FROM user_calendar_events ce
		JOIN events e ON e.id = ce.event_id
		WHERE ce.user_id = $1
		ORDER BY e.event_date ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Event{}
	for rows.Next() {
		var e Event
		var author sql.NullString
		if err := rows.Scan(&e.ID, &e.Title, &e.EventDate, &e.Rarity, &e.Synopsis, &e.Category, &e.Source, &e.Tier, &author, &e.Approved); err != nil {
			return nil, err
		}
		if author.Valid {
			a := author.String
			e.AuthorID = &a
		}
		out = append(out, e)
	}
	return out, nil
}

// SaveCalendarEvent adds an event to a user's personal calendar (idempotent).
func SaveCalendarEvent(ctx context.Context, userID, eventID string) error {
	if _, err := uuid.Parse(eventID); err != nil {
		return errors.New("invalid event id")
	}
	_, err := db.Pool.Exec(ctx, `
		INSERT INTO user_calendar_events (user_id, event_id)
		VALUES ($1,$2)
		ON CONFLICT (user_id, event_id) DO NOTHING
	`, userID, eventID)
	return err
}

// RemoveCalendarEvent removes an event from a user's personal calendar.
func RemoveCalendarEvent(ctx context.Context, userID, eventID string) error {
	if _, err := uuid.Parse(eventID); err != nil {
		return errors.New("invalid event id")
	}
	tag, err := db.Pool.Exec(ctx, `
		DELETE FROM user_calendar_events WHERE user_id = $1 AND event_id = $2
	`, userID, eventID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func sortTimes(ts []time.Time) {
	for i := 1; i < len(ts); i++ {
		for j := i; j > 0 && ts[j].Before(ts[j-1]); j-- {
			ts[j], ts[j-1] = ts[j-1], ts[j]
		}
	}
}

// ---- Advertisers, Watchers & crypto payouts ----

// AdCampaign is an active or inactive advertising campaign.
type AdCampaign struct {
	ID               string
	AdvertiserID     string
	Format           string
	Title            string
	PayloadURL       string
	RewardPerAction  float64
	RewardCurrency   string
	TargetCategories []string
	NSFW             bool
	Status           string
	CreatedAt        time.Time
	Survey           *Survey
}

// Survey is the set of questions attached to a survey-format campaign.
type Survey struct {
	ID         string
	CampaignID string
	Questions  []map[string]interface{}
	MinPayout  float64
}

// UserWallet is a user's crypto payout address on a given chain.
type UserWallet struct {
	ID        string
	UserID    string
	Chain     string
	Address   string
	CreatedAt time.Time
}

// CompletionToken is a Moonbug-signed proof that a user completed an ad action.
type CompletionToken struct {
	ID         string
	UserID     string
	CampaignID string
	Nonce      string
	Signature  string
	Claimed    bool
	CreatedAt  time.Time
}

const adCampaignColumns = `
	id, advertiser_id, format, title, payload_url,
	reward_per_action, reward_currency, target_categories, nsfw, status, created_at
`

func scanCampaign(c *AdCampaign) []interface{} {
	var cats []byte
	return []interface{}{
		&c.ID, &c.AdvertiserID, &c.Format, &c.Title, &c.PayloadURL,
		&c.RewardPerAction, &c.RewardCurrency, &cats, &c.NSFW, &c.Status, &c.CreatedAt,
	}
}

func decodeCampaignCategories(c *AdCampaign, raw []byte) {
	c.TargetCategories = []string{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &c.TargetCategories)
	}
	if c.TargetCategories == nil {
		c.TargetCategories = []string{}
	}
}

// ListActiveCampaigns returns active campaigns, excluding NSFW unless requested.
// When categories is non-empty the result is further filtered to campaigns whose
// target_categories overlap at least one of the given categories.
func ListActiveCampaigns(ctx context.Context, includeNSFW bool, categories []string) ([]AdCampaign, error) {
	var where strings.Builder
	args := []interface{}{}
	where.WriteString("status = 'active'")
	if !includeNSFW {
		where.WriteString(" AND nsfw = FALSE")
	}
	if len(categories) > 0 {
		arr := pgtype.Array[string]{Elements: categories, Valid: true}
		args = append(args, arr)
		where.WriteString(" AND target_categories ?| $1")
	}
	rows, err := db.Pool.Query(ctx, `
		SELECT `+adCampaignColumns+`
		FROM ad_campaigns WHERE `+where.String()+`
		ORDER BY created_at DESC
	`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AdCampaign{}
	for rows.Next() {
		var c AdCampaign
		var raw []byte
		if err := rows.Scan(scanCampaign(&c)[:10]..., &raw); err != nil {
			return nil, err
		}
		decodeCampaignCategories(&c, raw)
		out = append(out, c)
	}
	return out, nil
}

// GetCampaign returns a single campaign by id, attaching its Survey when the
// campaign format is 'survey'.
func GetCampaign(ctx context.Context, id string) (*AdCampaign, error) {
	var c AdCampaign
	var raw []byte
	err := db.Pool.QueryRow(ctx, `
		SELECT `+adCampaignColumns+`
		FROM ad_campaigns WHERE id = $1
	`, id).Scan(scanCampaign(&c)[:10]..., &raw)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	decodeCampaignCategories(&c, raw)
	if c.Format == "survey" {
		s, err := getSurvey(ctx, c.ID)
		if err != nil && !errors.Is(err, ErrNotFound) {
			return nil, err
		}
		c.Survey = s
	}
	return &c, nil
}

// getSurvey loads the survey (if any) attached to a campaign.
func getSurvey(ctx context.Context, campaignID string) (*Survey, error) {
	var s Survey
	var raw []byte
	err := db.Pool.QueryRow(ctx, `
		SELECT id, campaign_id, questions, min_payout
		FROM surveys WHERE campaign_id = $1
	`, campaignID).Scan(&s.ID, &s.CampaignID, &raw, &s.MinPayout)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	s.Questions = []map[string]interface{}{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &s.Questions)
	}
	if s.Questions == nil {
		s.Questions = []map[string]interface{}{}
	}
	return &s, nil
}

// GetUserWallet returns a user's wallet for a specific chain.
func GetUserWallet(ctx context.Context, userID, chain string) (*UserWallet, error) {
	var w UserWallet
	err := db.Pool.QueryRow(ctx, `
		SELECT id, user_id, chain, address, created_at
		FROM user_wallets WHERE user_id = $1 AND chain = $2
	`, userID, chain).Scan(&w.ID, &w.UserID, &w.Chain, &w.Address, &w.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &w, nil
}

// UpsertWallet inserts or updates a user's wallet for a given chain.
func UpsertWallet(ctx context.Context, userID, chain, address string) (*UserWallet, error) {
	switch chain {
	case "solana", "evm":
	default:
		return nil, errors.New("chain must be 'solana' or 'evm'")
	}
	address = strings.TrimSpace(address)
	if address == "" {
		return nil, errors.New("address is required")
	}
	if chain == "evm" && len(address) < 40 {
		return nil, errors.New("invalid evm address")
	}
	if chain == "solana" && len(address) < 32 {
		return nil, errors.New("invalid solana address")
	}
	var w UserWallet
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO user_wallets (id, user_id, chain, address)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (user_id, chain) DO UPDATE SET address = EXCLUDED.address
		RETURNING id, user_id, chain, address, created_at
	`, uuid.NewString(), userID, chain, address).Scan(&w.ID, &w.UserID, &w.Chain, &w.Address, &w.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &w, nil
}

// ListUserWallets returns all wallets for a user.
func ListUserWallets(ctx context.Context, userID string) ([]UserWallet, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, chain, address, created_at
		FROM user_wallets WHERE user_id = $1 ORDER BY chain
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserWallet{}
	for rows.Next() {
		var w UserWallet
		if err := rows.Scan(&w.ID, &w.UserID, &w.Chain, &w.Address, &w.CreatedAt); err != nil {
			return nil, err
		}
		out = append(out, w)
	}
	return out, nil
}

// CreateCompletionToken records a signed completion token. The (user_id,
// campaign_id, nonce) triple is unique; on conflict nothing is inserted and the
// existing row is returned.
func CreateCompletionToken(ctx context.Context, userID, campaignID, nonce, signature string) (*CompletionToken, error) {
	var t CompletionToken
	err := db.Pool.QueryRow(ctx, `
		INSERT INTO completion_tokens (id, user_id, campaign_id, nonce, signature)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (user_id, campaign_id, nonce) DO NOTHING
		RETURNING id, user_id, campaign_id, nonce, signature, claimed, created_at
	`, uuid.NewString(), userID, campaignID, nonce, signature).Scan(
		&t.ID, &t.UserID, &t.CampaignID, &t.Nonce, &t.Signature, &t.Claimed, &t.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Conflict: return the pre-existing token.
			return getCompletionToken(ctx, userID, campaignID, nonce)
		}
		return nil, err
	}
	return &t, nil
}

func getCompletionToken(ctx context.Context, userID, campaignID, nonce string) (*CompletionToken, error) {
	var t CompletionToken
	err := db.Pool.QueryRow(ctx, `
		SELECT id, user_id, campaign_id, nonce, signature, claimed, created_at
		FROM completion_tokens WHERE user_id = $1 AND campaign_id = $2 AND nonce = $3
	`, userID, campaignID, nonce).Scan(
		&t.ID, &t.UserID, &t.CampaignID, &t.Nonce, &t.Signature, &t.Claimed, &t.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, err
	}
	return &t, nil
}

// MarkTokenClaimed marks a completion token as claimed by the advertiser.
func MarkTokenClaimed(ctx context.Context, id string) error {
	tag, err := db.Pool.Exec(ctx, `UPDATE completion_tokens SET claimed = TRUE WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ---- Profile Portfolio ----

// ProfileField is a single field in a user's profile portfolio. It may be
// nested under another field via ParentID.
type ProfileField struct {
	ID        string
	UserID    string
	ParentID  *string
	Title     string
	ValueText string
	ValueInt  *int
	ValueJSON json.RawMessage
	FieldType string
	SortOrder int
	CreatedAt time.Time
	UpdatedAt time.Time
	Children  []ProfileField
}

// ProfileFieldInput is the payload used to (re)build a user's profile fields.
type ProfileFieldInput struct {
	Title     string           `json:"title"`
	ValueText string           `json:"valueText"`
	ValueInt  *int             `json:"valueInt"`
	ValueJSON json.RawMessage  `json:"valueJson"`
	FieldType string           `json:"fieldType"`
	SortOrder int              `json:"sortOrder"`
	Children  []ProfileFieldInput `json:"children"`
}

// UserAsset is a single user asset (car, bicycle, pets, jewelry, clothing).
type UserAsset struct {
	ID        string
	UserID    string
	Kind      string
	Title     string
	Detail    json.RawMessage
	SortOrder int
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UserAssetInput is the payload used to (re)build a user's assets.
type UserAssetInput struct {
	Kind      string          `json:"kind"`
	Title     string          `json:"title"`
	Detail    json.RawMessage `json:"detail"`
	SortOrder int             `json:"sortOrder"`
}

// UserFavorite is a single user favorite entry.
type UserFavorite struct {
	ID        string
	UserID    string
	Kind      string
	Label     string
	Value     string
	SortOrder int
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UserFavoriteInput is the payload used to (re)build a user's favorites.
type UserFavoriteInput struct {
	Kind      string `json:"kind"`
	Label     string `json:"label"`
	Value     string `json:"value"`
	SortOrder int    `json:"sortOrder"`
}

// UserLink is a single user link.
type UserLink struct {
	ID         string
	UserID     string
	URL        string
	Label      string
	IsLinktree bool
	SortOrder  int
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// UserLinkInput is the payload used to (re)build a user's links.
type UserLinkInput struct {
	URL        string `json:"url"`
	Label      string `json:"label"`
	IsLinktree bool   `json:"isLinktree"`
	SortOrder  int    `json:"sortOrder"`
}

func validAssetKind(k string) bool {
	switch k {
	case "car", "bicycle", "pets", "jewelry", "clothing":
		return true
	}
	return false
}

// GetProfileFields returns the user's profile fields assembled into a tree,
// ordered by sort_order at every level.
func GetProfileFields(ctx context.Context, userID string) ([]ProfileField, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, parent_id, title, value_text, value_int, value_json, field_type, sort_order, created_at, updated_at
		FROM profile_fields WHERE user_id = $1 ORDER BY sort_order, created_at
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	all := map[string]*ProfileField{}
	var roots []string
	byParent := map[string][]string{}

	for rows.Next() {
		var f ProfileField
		var parent sql.NullString
		var vi sql.NullInt64
		var vj []byte
		if err := rows.Scan(&f.ID, &f.UserID, &parent, &f.Title, &f.ValueText, &vi, &vj, &f.FieldType, &f.SortOrder, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		if parent.Valid {
			p := parent.String
			f.ParentID = &p
		}
		if vi.Valid {
			v := int(vi.Int64)
			f.ValueInt = &v
		}
		if len(vj) > 0 {
			f.ValueJSON = vj
		} else {
			f.ValueJSON = json.RawMessage("[]")
		}
		all[f.ID] = &f
		if f.ParentID != nil {
			byParent[*f.ParentID] = append(byParent[*f.ParentID], f.ID)
		} else {
			roots = append(roots, f.ID)
		}
	}

	out := make([]ProfileField, 0, len(roots))
	for _, rid := range roots {
		out = append(out, *attachChildren(all[rid], all, byParent))
	}
	return out, nil
}

func attachChildren(f *ProfileField, all map[string]*ProfileField, byParent map[string][]string) *ProfileField {
	children := byParent[f.ID]
	f.Children = make([]ProfileField, 0, len(children))
	for _, cid := range children {
		child := attachChildren(all[cid], all, byParent)
		f.Children = append(f.Children, *child)
	}
	return f
}

// UpsertProfileFields replaces a user's profile fields with the provided tree,
// preserving nesting via parent_id. Runs inside a single transaction.
func UpsertProfileFields(ctx context.Context, userID string, fields []ProfileFieldInput) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM profile_fields WHERE user_id = $1`, userID); err != nil {
		return err
	}
	if err := insertProfileFields(ctx, tx, userID, fields, nil); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func insertProfileFields(ctx context.Context, tx pgx.Tx, userID string, fields []ProfileFieldInput, parentID *string) error {
	for _, f := range fields {
		ft := f.FieldType
		if ft == "" {
			ft = "text"
		}
		vj := f.ValueJSON
		if len(vj) == 0 {
			vj = json.RawMessage("[]")
		}
		id := uuid.NewString()
		var vi sql.NullInt64
		if f.ValueInt != nil {
			vi = sql.NullInt64{Int64: int64(*f.ValueInt), Valid: true}
		}
		var pid interface{}
		if parentID != nil {
			pid = *parentID
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO profile_fields (id, user_id, parent_id, title, value_text, value_int, value_json, field_type, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9)
		`, id, userID, pid, f.Title, f.ValueText, vi, string(vj), ft, f.SortOrder); err != nil {
			return err
		}
		if len(f.Children) > 0 {
			if err := insertProfileFields(ctx, tx, userID, f.Children, &id); err != nil {
				return err
			}
		}
	}
	return nil
}

// ListAssets returns a user's assets ordered by sort_order.
func ListAssets(ctx context.Context, userID string) ([]UserAsset, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, kind, title, detail, sort_order, created_at, updated_at
		FROM user_assets WHERE user_id = $1 ORDER BY sort_order, created_at
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserAsset{}
	for rows.Next() {
		var a UserAsset
		var d []byte
		if err := rows.Scan(&a.ID, &a.UserID, &a.Kind, &a.Title, &d, &a.SortOrder, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, err
		}
		if len(d) > 0 {
			a.Detail = d
		} else {
			a.Detail = json.RawMessage("{}")
		}
		out = append(out, a)
	}
	return out, nil
}

// UpsertAssets replaces a user's assets with the provided list, validating the
// kind against the table CHECK set. Runs inside a single transaction.
func UpsertAssets(ctx context.Context, userID string, assets []UserAssetInput) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM user_assets WHERE user_id = $1`, userID); err != nil {
		return err
	}
	for _, a := range assets {
		if !validAssetKind(a.Kind) {
			return errors.New("invalid asset kind")
		}
		d := a.Detail
		if len(d) == 0 {
			d = json.RawMessage("{}")
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO user_assets (id, user_id, kind, title, detail, sort_order)
			VALUES ($1,$2,$3,$4,$5::jsonb,$6)
		`, uuid.NewString(), userID, a.Kind, a.Title, string(d), a.SortOrder); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ListFavorites returns a user's favorites ordered by sort_order.
func ListFavorites(ctx context.Context, userID string) ([]UserFavorite, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, kind, label, value, sort_order, created_at, updated_at
		FROM user_favorites WHERE user_id = $1 ORDER BY sort_order, created_at
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserFavorite{}
	for rows.Next() {
		var f UserFavorite
		if err := rows.Scan(&f.ID, &f.UserID, &f.Kind, &f.Label, &f.Value, &f.SortOrder, &f.CreatedAt, &f.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

// UpsertFavorites replaces a user's favorites with the provided list. Runs
// inside a single transaction.
func UpsertFavorites(ctx context.Context, userID string, favorites []UserFavoriteInput) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM user_favorites WHERE user_id = $1`, userID); err != nil {
		return err
	}
	for _, f := range favorites {
		if _, err := tx.Exec(ctx, `
			INSERT INTO user_favorites (id, user_id, kind, label, value, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, uuid.NewString(), userID, f.Kind, f.Label, f.Value, f.SortOrder); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}

// ListLinks returns a user's links ordered by sort_order.
func ListLinks(ctx context.Context, userID string) ([]UserLink, error) {
	rows, err := db.Pool.Query(ctx, `
		SELECT id, user_id, url, label, is_linktree, sort_order, created_at, updated_at
		FROM user_links WHERE user_id = $1 ORDER BY sort_order, created_at
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserLink{}
	for rows.Next() {
		var l UserLink
		if err := rows.Scan(&l.ID, &l.UserID, &l.URL, &l.Label, &l.IsLinktree, &l.SortOrder, &l.CreatedAt, &l.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, l)
	}
	return out, nil
}

// UpsertLinks replaces a user's links with the provided list. Runs inside a
// single transaction.
func UpsertLinks(ctx context.Context, userID string, links []UserLinkInput) error {
	tx, err := db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `DELETE FROM user_links WHERE user_id = $1`, userID); err != nil {
		return err
	}
	for _, l := range links {
		if _, err := tx.Exec(ctx, `
			INSERT INTO user_links (id, user_id, url, label, is_linktree, sort_order)
			VALUES ($1,$2,$3,$4,$5,$6)
		`, uuid.NewString(), userID, l.URL, l.Label, l.IsLinktree, l.SortOrder); err != nil {
			return err
		}
	}
	return tx.Commit(ctx)
}
