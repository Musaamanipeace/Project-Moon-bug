package main

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"moonbug/internal/db"
	"moonbug/internal/handlers"
	"moonbug/internal/middleware"
)

func main() {
	loadDotEnv()

	port := getenv("PORT", "3000")
	staticDir := getenv("STATIC_DIR", "dist")

	if err := db.Connect(); err != nil {
		fmt.Fprintf(os.Stderr, "database connection failed: %v\n", err)
		fmt.Fprintln(os.Stderr, "set DATABASE_URL to a valid PostgreSQL connection string")
		os.Exit(1)
	}
	defer db.Close()

	if err := db.RunMigrations(); err != nil {
		fmt.Fprintf(os.Stderr, "migrations failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("[moonbug] schema migrated and challenges seeded")

	api := middleware.Auth(handlers.Router())

	root := http.NewServeMux()
	root.Handle("/api/", api)
	root.Handle("/healthz", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	}))
	root.Handle("/", spaHandler(staticDir))

	addr := "0.0.0.0:" + port
	fmt.Printf("[moonbug] listening on http://%s\n", addr)
	if err := http.ListenAndServe(addr, root); err != nil {
		fmt.Fprintf(os.Stderr, "server error: %v\n", err)
		os.Exit(1)
	}
}

// spaHandler serves the built single-page app with client-side routing fallback.
func spaHandler(dir string) http.Handler {
	if _, err := os.Stat(filepath.Join(dir, "index.html")); err != nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "frontend not built; run `npm run build`", http.StatusNotFound)
		})
	}
	fsys := os.DirFS(dir)
	fileServer := http.FileServer(http.FS(fsys))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}
		if _, err := fs.Stat(fsys, path); err != nil {
			data, err := fs.ReadFile(fsys, "index.html")
			if err != nil {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Write(data)
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

// loadDotEnv loads a local .env file if present (no external dependency).
func loadDotEnv() {
	data, err := os.ReadFile(".env")
	if err != nil {
		return
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.Trim(strings.TrimSpace(parts[1]), `"'`)
		if os.Getenv(key) == "" {
			os.Setenv(key, val)
		}
	}
}
