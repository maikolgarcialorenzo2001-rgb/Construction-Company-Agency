// Command server is the backend composition root. It loads configuration,
// selects and wires the user store (PostgreSQL or in-memory) and serves the
// HTTP API.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"cca/backend/internal/auth"
	"cca/backend/internal/config"
	"cca/backend/internal/httpapi"
	"cca/backend/internal/service"
	"cca/backend/internal/store"
	"cca/backend/internal/store/memory"
	"cca/backend/internal/store/postgres"
	"cca/backend/migrations"
)

func main() {
	migrateOnly := flag.Bool("migrate", false, "apply database migrations and exit")
	flag.Parse()

	ctx := context.Background()

	if *migrateOnly {
		if err := runMigrate(ctx, os.Getenv("DATABASE_URL")); err != nil {
			log.Fatalf("startup: %v", err)
		}
		return
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("startup: %v", err)
	}

	users, cleanup, err := buildStore(ctx, cfg)
	if err != nil {
		log.Fatalf("startup: %v", err)
	}
	defer cleanup()

	issuer := auth.NewJWT(cfg.JWTSecret, cfg.TokenTTL)
	authService := service.NewAuth(users, issuer, auth.Bcrypt{})

	router := httpapi.NewRouter(httpapi.Deps{Auth: authService, Tokens: issuer})

	addr := ":" + strconv.Itoa(cfg.Port)
	log.Printf("cca/backend listening on %s", addr)

	if err := http.ListenAndServe(addr, router); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("server: %v", err)
	}
}

// buildStore selects the user store from cfg.DatabaseURL and returns it along
// with a cleanup function that releases the resources the store owns.
//
// An empty DATABASE_URL selects the in-memory store — the zero-config default.
// A set DATABASE_URL opens a pgx pool, applies the embedded migrations
// idempotently and returns the PostgreSQL adapter. The cleanup is always
// non-nil so the composition root can defer it unconditionally.
func buildStore(ctx context.Context, cfg config.Config) (store.UserStore, func(), error) {
	if cfg.DatabaseURL == "" {
		log.Printf("store: DATABASE_URL is not set, using the in-memory store")
		return memory.NewUserStore(), func() {}, nil
	}

	pool, err := postgres.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return nil, nil, fmt.Errorf("store: open database: %w", err)
	}

	if err := migrations.Up(ctx, pool); err != nil {
		pool.Close()
		return nil, nil, fmt.Errorf("store: apply migrations: %w", err)
	}

	log.Printf("store: DATABASE_URL is set, using the PostgreSQL store")
	return postgres.NewUserStore(pool), pool.Close, nil
}

// runMigrate applies the embedded migrations against dsn and returns without
// opening a listener. It reuses buildStore so the startup path and the migrate
// path share one Open + Up implementation. A missing DSN is a clear error.
func runMigrate(ctx context.Context, dsn string) error {
	if dsn == "" {
		return errors.New("migrate: DATABASE_URL is required to run migrations")
	}
	_, cleanup, err := buildStore(ctx, config.Config{DatabaseURL: dsn})
	if err != nil {
		return err
	}
	defer cleanup()

	log.Printf("migrate: database migrations applied")
	return nil
}
