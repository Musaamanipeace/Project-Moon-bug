package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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

// ComputeStreaks returns the current and longest consecutive-day streaks.
func ComputeStreaks(ctx context.Context, userID string) (int, int, error) {
	dates, err := CompletedDates(ctx, userID)
	if err != nil {
		return 0, 0, err
	}
	if len(dates) == 0 {
		return 0, 0, nil
	}
	parsed := make([]time.Time, 0, len(dates))
	for d := range dates {
		t, e := time.Parse("2006-01-02", d)
		if e == nil {
			parsed = append(parsed, t)
		}
	}
	// Build a set of date-only keys.
	set := map[string]bool{}
	for _, t := range parsed {
		set[t.Format("2006-01-02")] = true
	}
	longest := 1
	cur := 1
	// Sort parsed dates.
	sortTimes(parsed)
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
	// Current streak counts back from today (or yesterday if today not done yet).
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
	return current, longest, nil
}

func parseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func sortTimes(ts []time.Time) {
	for i := 1; i < len(ts); i++ {
		for j := i; j > 0 && ts[j].Before(ts[j-1]); j-- {
			ts[j], ts[j-1] = ts[j-1], ts[j]
		}
	}
}
