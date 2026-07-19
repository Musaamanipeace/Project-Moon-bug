package test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"moonbug/internal/handlers"
)

// TestHttp_RoutesRegisteredRegression guards against the regression where
// GET /api/profile and GET /api/calendar returned 404 because the handlers
// were never registered on the router.
//
// These routes sit behind middleware.RequireAuth, so an unauthenticated
// request must yield 401 (Unauthorized) — proof the route exists and is
// wired through the auth middleware. A 404 would prove the route is missing
// and re-trigger the regression.
//
// NOTE: Full 200-level coverage (returning real profile/calendar payloads)
// requires a database-backed session and a valid JWT cookie. That is out of
// scope for this lightweight guard, which intentionally needs NO database.
func TestHttp_RoutesRegisteredRegression(t *testing.T) {
	router := handlers.Router()

	// (a) Routes that must be registered behind auth: expect 401, never 404.
	require401Not404(t, router, "/api/profile")
	require401Not404(t, router, "/api/calendar")

	// (b) Sanity: a genuinely unregistered path must still return 404,
	// proving our 404 detection is meaningful and not masking bugs.
	assertStatus(t, router, "/api/does-not-exist", http.StatusNotFound)
}

// require401Not404 issues an unauthenticated GET to target and fails if the
// response is 404 (the regression) — it expects 401 instead.
func require401Not404(t *testing.T, router http.Handler, target string) {
	t.Helper()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	router.ServeHTTP(rec, req)

	if rec.Code == http.StatusNotFound {
		t.Fatalf("%s returned 404 (Not Found) — route is not registered; "+
			"this is the regression being guarded against", target)
	}
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("%s expected status %d (Unauthorized) for an unauthenticated "+
			"request, got %d", target, http.StatusUnauthorized, rec.Code)
	}
}

// assertStatus issues an unauthenticated GET to target and asserts the exact
// status code.
func assertStatus(t *testing.T, router http.Handler, target string, want int) {
	t.Helper()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, target, nil)
	router.ServeHTTP(rec, req)
	if rec.Code != want {
		t.Errorf("%s expected status %d, got %d", target, want, rec.Code)
	}
}
