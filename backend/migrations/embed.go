// Package migrations embeds the goose SQL migrations and applies them to a
// pgx pool. Migrations are up-only at runtime; Down exists for the gated
// up/down integration test.
package migrations

import (
	"context"
	"embed"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
)

// FS holds the embedded goose migration files.
//
//go:embed *.sql
var FS embed.FS

// Up applies all pending migrations. It is idempotent: already-applied
// migrations are a no-op.
func Up(ctx context.Context, pool *pgxpool.Pool) error {
	return run(ctx, pool, func(p *goose.Provider) error {
		_, err := p.Up(ctx)
		return err
	})
}

// Down rolls back the applied migrations. It is used only by the gated
// migration test and is never invoked at runtime.
func Down(ctx context.Context, pool *pgxpool.Pool) error {
	return run(ctx, pool, func(p *goose.Provider) error {
		_, err := p.Down(ctx)
		return err
	})
}

// run wraps pool in a database/sql handle (without owning the pool), builds a
// goose provider over the embedded FS and executes apply. Closing the wrapper
// does not close the pool.
func run(ctx context.Context, pool *pgxpool.Pool, apply func(*goose.Provider) error) error {
	db := stdlib.OpenDBFromPool(pool)
	defer db.Close()

	provider, err := goose.NewProvider(goose.DialectPostgres, db, FS)
	if err != nil {
		return err
	}
	return apply(provider)
}
