package middleware

import (
	"context"
	"net/http"

	"moonbug/internal/auth"
	"moonbug/internal/store"
)

type ctxKey string

const userIDKey ctxKey = "userID"
const sessionIDKey ctxKey = "sessionID"

// SessionCookie is the name of the auth cookie.
const SessionCookie = "moonbug_session"

// Auth validates the session cookie and populates the request context.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie(SessionCookie)
		if err != nil || cookie.Value == "" {
			next.ServeHTTP(w, r)
			return
		}
		claims, err := auth.ParseToken(cookie.Value)
		if err != nil {
			next.ServeHTTP(w, r)
			return
		}
		userID, ok := store.SessionValid(r.Context(), claims.SessionID)
		if !ok {
			next.ServeHTTP(w, r)
			return
		}
		ctx := context.WithValue(r.Context(), userIDKey, userID)
		ctx = context.WithValue(ctx, sessionIDKey, claims.SessionID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// UserID returns the authenticated user ID from the context, or "".
func UserID(r *http.Request) string {
	if v, ok := r.Context().Value(userIDKey).(string); ok {
		return v
	}
	return ""
}

// SessionID returns the active session ID from the context, or "".
func SessionID(r *http.Request) string {
	if v, ok := r.Context().Value(sessionIDKey).(string); ok {
		return v
	}
	return ""
}

// IsAuthed reports whether the request carries a valid session.
func IsAuthed(r *http.Request) bool {
	return UserID(r) != ""
}

// RequireAuth wraps a handler, rejecting unauthenticated requests with 401.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !IsAuthed(r) {
			writeUnauthorized(w)
			return
		}
		next(w, r)
	}
}

func writeUnauthorized(w http.ResponseWriter) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusUnauthorized)
	w.Write([]byte(`{"error":"unauthorized"}`))
}
