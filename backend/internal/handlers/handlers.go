package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"moonbug/internal/auth"
	"moonbug/internal/lunar"
	"moonbug/internal/middleware"
	"moonbug/internal/store"
)

// Router builds the API mux with auth middleware applied.
func Router() *http.ServeMux {
	mux := http.NewServeMux()
	mux.Handle("GET /api/health", healthHandler())
	mux.Handle("GET /api/lunar/now", lunarNowHandler())

	mux.Handle("POST /api/auth/request-otp", otpRequestHandler())
	mux.Handle("POST /api/auth/verify-otp", otpVerifyHandler())
	mux.Handle("POST /api/auth/signup", passwordSignupHandler())
	mux.Handle("POST /api/auth/login", passwordLoginHandler())
	mux.Handle("POST /api/auth/logout", middleware.RequireAuth(logoutHandler()))
	mux.Handle("GET /api/auth/me", middleware.RequireAuth(meHandler()))
	mux.Handle("PUT /api/auth/settings", middleware.RequireAuth(settingsHandler()))

	mux.Handle("GET /api/challenges", middleware.RequireAuth(listChallengesHandler()))
	mux.Handle("GET /api/challenges/{slug}", middleware.RequireAuth(challengeDetailHandler()))
	mux.Handle("PUT /api/challenges/{slug}", middleware.RequireAuth(saveChallengeHandler()))

	mux.Handle("GET /api/calendar", calendarHandler())
	mux.Handle("GET /api/profile", middleware.RequireAuth(profileHandler()))
	return mux
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request, v interface{}) error {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	return dec.Decode(v)
}

func setSessionCookie(w http.ResponseWriter, token string) {
	secure := isProduction()
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookie,
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   secure,
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(30 * 24 * time.Hour),
		MaxAge:   60 * 60 * 24 * 30,
	})
}

func clearSessionCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     middleware.SessionCookie,
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		Secure:   isProduction(),
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
	})
}

func isProduction() bool {
	return os.Getenv("APP_ENV") == "production"
}

func healthHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"status": "ok",
			"time":   time.Now().UTC().Format(time.RFC3339),
		})
	}
}

func lunarNowHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		now := time.Now().UTC()
		age := lunar.Age(now)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"age":                age,
			"illumination":       lunar.Illumination(age),
			"phase":             lunar.PhaseName(age),
			"phaseCode":         lunar.PhaseCode(age),
			"phaseEmoji":        lunar.PhaseEmoji(age),
			"daysUntilFull":     lunar.DaysUntilNext(age, 0.5),
			"daysUntilNew":      lunar.DaysUntilNext(age, 0),
		})
	}
}

func otpRequestHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
		}
		if err := readJSON(r, &body); err != nil || !validEmail(body.Email) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "a valid email is required"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(body.Email))
		code := auth.GenerateOTP()
		hash := auth.HashOTP(code)
		expires := time.Now().Add(5 * time.Minute)
		if err := store.SaveOTP(r.Context(), email, hash, expires); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not store code"})
			return
		}
		if err := auth.SendOTPEmail(email, code); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not send code"})
			return
		}
		resp := map[string]interface{}{"ok": true}
		if !isProduction() {
			resp["devCode"] = code
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func otpVerifyHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email string `json:"email"`
			Code  string `json:"code"`
		}
		if err := readJSON(r, &body); err != nil || !validEmail(body.Email) || len(body.Code) != 6 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and code are required"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(body.Email))
		ok, err := store.VerifyOTP(r.Context(), email, auth.HashOTP(body.Code))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "verification failed"})
			return
		}
		if !ok {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid or expired code"})
			return
		}
		user, err := store.CreateUser(r.Context(), email, displayNameFromEmail(email), "otp", "")
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create session"})
			return
		}
		issueSession(w, r, user)
	}
}

func passwordSignupHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email       string `json:"email"`
			Password    string `json:"password"`
			DisplayName string `json:"displayName"`
		}
		if err := readJSON(r, &body); err != nil || !validEmail(body.Email) || len(body.Password) < 6 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password (min 6 chars) are required"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(body.Email))
		if _, err := store.GetUserByEmail(r.Context(), email); err == nil {
			writeJSON(w, http.StatusConflict, map[string]string{"error": "an account with this email already exists"})
			return
		}
		hash, err := auth.HashPassword(body.Password)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not secure password"})
			return
		}
		name := strings.TrimSpace(body.DisplayName)
		user, err := store.CreateUser(r.Context(), email, name, "password", hash)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not create account"})
			return
		}
		issueSession(w, r, user)
	}
}

func passwordLoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := readJSON(r, &body); err != nil || !validEmail(body.Email) {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "email and password are required"})
			return
		}
		email := strings.ToLower(strings.TrimSpace(body.Email))
		user, err := store.GetUserByEmail(r.Context(), email)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}
		hash, err := store.GetPasswordHash(r.Context(), user.ID)
		if err != nil || hash == "" || !auth.CheckPassword(hash, body.Password) {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
			return
		}
		issueSession(w, r, user)
	}
}

func logoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if sid := middleware.SessionID(r); sid != "" {
			_ = store.RevokeSession(r.Context(), sid)
		}
		clearSessionCookie(w)
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})
	}
}

func meHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := store.GetUserByID(r.Context(), middleware.UserID(r))
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": userResponse(user)})
	}
}

func settingsHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			NotificationsEnabled *bool   `json:"notificationsEnabled"`
			PreferredMethod      *string `json:"preferredMethod"`
		}
		if err := readJSON(r, &body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
			return
		}
		if body.PreferredMethod != nil {
			switch *body.PreferredMethod {
			case "otp", "password":
			default:
				writeJSON(w, http.StatusBadRequest, map[string]string{"error": "preferredMethod must be 'otp' or 'password'"})
				return
			}
		}
		user, err := store.UpdateUserSettings(r.Context(), middleware.UserID(r), body.NotificationsEnabled, body.PreferredMethod)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not update settings"})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"user": userResponse(user)})
	}
}

func listChallengesHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		uid := middleware.UserID(r)
		challenges, err := store.ListChallenges(ctx)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load challenges"})
			return
		}
		states, err := store.AllStatesForUser(ctx, uid)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load progress"})
			return
		}
		out := make([]map[string]interface{}, 0, len(challenges))
		for _, c := range challenges {
			item := challengePublic(c)
			if st, ok := states[c.Slug]; ok {
				item["userState"] = statePublic(st)
			} else {
				item["userState"] = nil
			}
			out = append(out, item)
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"challenges": out})
	}
}

func challengeDetailHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		ctx := r.Context()
		c, err := store.GetChallengeBySlug(ctx, slug)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "challenge not found"})
			return
		}
		st, err := store.GetLatestLog(ctx, middleware.UserID(r), c.ID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load state"})
			return
		}
		resp := map[string]interface{}{"challenge": challengePublic(*c)}
		if st != nil {
			resp["userState"] = statePublic(st)
		} else {
			resp["userState"] = nil
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func saveChallengeHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		slug := r.PathValue("slug")
		ctx := r.Context()
		c, err := store.GetChallengeBySlug(ctx, slug)
		if err != nil {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "challenge not found"})
			return
		}
		var body struct {
			Data      map[string]interface{} `json:"data"`
			Completed bool                   `json:"completed"`
		}
		if err := readJSON(r, &body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid body"})
			return
		}
		if body.Data == nil {
			body.Data = map[string]interface{}{}
		}
		logDate := time.Now().UTC().Format("2006-01-02")
		st, awarded, err := store.UpsertChallengeLog(ctx, middleware.UserID(r), c.ID, logDate, body.Data, body.Completed)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not save progress"})
			return
		}
		st.Slug = c.Slug
		if err := store.RecomputeStreak(ctx, middleware.UserID(r)); err != nil {
			// non-fatal
			_ = err
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"ok":            true,
			"userState":     statePublic(st),
			"badgeAwarded":  awarded,
		})
	}
}

func calendarHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		year, _ := strconv.Atoi(q.Get("year"))
		month, _ := strconv.Atoi(q.Get("month"))
		now := time.Now().UTC()
		if year == 0 {
			year = now.Year()
		}
		if month == 0 {
			month = int(now.Month())
		}
		if month < 1 || month > 12 {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid month"})
			return
		}
		start := time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
		end := start.AddDate(0, 1, 0).Add(-time.Second)
		states, err := store.CompletedSlugsForRange(r.Context(), middleware.UserID(r),
			start.Format("2006-01-02"), end.Format("2006-01-02"))
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load calendar"})
			return
		}
		daysInMonth := daysIn(start.Year(), start.Month())
		days := make([]map[string]interface{}, 0, daysInMonth)
		for d := 1; d <= daysInMonth; d++ {
			day := time.Date(year, time.Month(month), d, 12, 0, 0, 0, time.UTC)
			age := lunar.Age(day)
			key := day.Format("2006-01-02")
			days = append(days, map[string]interface{}{
				"date":               key,
				"day":                d,
				"phase":             lunar.PhaseName(age),
				"phaseCode":         lunar.PhaseCode(age),
				"phaseEmoji":        lunar.PhaseEmoji(age),
				"illumination":      lunar.Illumination(age),
				"completedChallenges": states[key],
			})
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"year":  year,
			"month": month,
			"days":  days,
		})
	}
}

func profileHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		uid := middleware.UserID(r)
		user, err := store.GetUserByID(ctx, uid)
		if err != nil {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}
		badges, err := store.GetBadges(ctx, uid)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load badges"})
			return
		}
		activity, err := store.RecentActivity(ctx, uid, 20)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load activity"})
			return
		}
		total, err := store.CountCompletedLogs(ctx, uid)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not load stats"})
			return
		}
		actOut := make([]map[string]interface{}, 0, len(activity))
		for _, a := range activity {
			actOut = append(actOut, map[string]interface{}{
				"slug":      a.Slug,
				"logDate":   a.LogDate,
				"completed": a.Completed,
				"data":      a.Data,
			})
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"user":            userResponse(user),
			"badges":          badges,
			"streak":          user.Streak,
			"longestStreak":   user.LongestStreak,
			"totalCompleted":  total,
			"recentActivity":  actOut,
		})
	}
}

// ---- helpers ----

func issueSession(w http.ResponseWriter, r *http.Request, user *store.User) {
	sid, err := store.CreateSession(r.Context(), user.ID, clientIP(r), r.UserAgent())
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not start session"})
		return
	}
	token, err := auth.GenerateToken(user.ID, sid)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "could not issue token"})
		return
	}
	setSessionCookie(w, token)
	writeJSON(w, http.StatusOK, map[string]interface{}{"ok": true, "user": userResponse(user)})
}

func userResponse(u *store.User) map[string]interface{} {
	return map[string]interface{}{
		"id":                   u.ID,
		"email":                u.Email,
		"displayName":          u.DisplayName,
		"authMethod":           u.AuthMethod,
		"preferredMethod":      u.PreferredMethod,
		"notificationsEnabled": u.NotificationsEnabled,
		"streak":               u.Streak,
		"longestStreak":        u.LongestStreak,
		"createdAt":            u.CreatedAt.Format(time.RFC3339),
	}
}

func challengePublic(c store.Challenge) map[string]interface{} {
	return map[string]interface{}{
		"id":          c.ID,
		"slug":        c.Slug,
		"title":       c.Title,
		"description": c.Description,
		"prompt":      c.Prompt,
		"moonPhase":   c.MoonPhase,
		"icon":        c.Icon,
		"sortOrder":   c.SortOrder,
	}
}

func statePublic(st *store.ChallengeState) map[string]interface{} {
	return map[string]interface{}{
		"challengeId": st.ChallengeID,
		"slug":        st.Slug,
		"logDate":     st.LogDate,
		"data":        st.Data,
		"completed":   st.Completed,
		"updatedAt":   st.UpdatedAt.Format(time.RFC3339),
	}
}

func validEmail(email string) bool {
	email = strings.TrimSpace(email)
	if email == "" || !strings.Contains(email, "@") || !strings.Contains(email, ".") {
		return false
	}
	return len(email) <= 254
}

func displayNameFromEmail(email string) string {
	parts := strings.SplitN(email, "@", 2)
	if len(parts) == 0 {
		return "Moonbug"
	}
	local := parts[0]
	local = strings.ReplaceAll(local, ".", " ")
	local = strings.ReplaceAll(local, "_", " ")
	if local == "" {
		return "Moonbug"
	}
	runes := []rune(local)
	runes[0] = []rune(strings.ToUpper(string(runes[0])))[0]
	return string(runes)
}

func clientIP(r *http.Request) string {
	if fwd := r.Header.Get("X-Forwarded-For"); fwd != "" {
		return strings.SplitN(fwd, ",", 2)[0]
	}
	return strings.SplitN(r.RemoteAddr, ":", 2)[0]
}

func daysIn(year int, month time.Month) int {
	return time.Date(year, month+1, 0, 0, 0, 0, 0, time.UTC).Day()
}
