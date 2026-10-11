// Package postgres provides a pgx (pgxpool) implementation of the
// store.UserStore port. It is the only package that imports pgx; the pure-Go
// pgx v5 stack keeps CGO_ENABLED=0 builds working.
package postgres

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// uniqueViolation is the PostgreSQL SQLSTATE for a unique-constraint violation
// (duplicate email).
const uniqueViolation = "23505"

// UserStore is a PostgreSQL-backed store.UserStore.
type UserStore struct {
	pool *pgxpool.Pool
}

// Compile-time proof that the adapter satisfies the unchanged port.
var _ store.UserStore = (*UserStore)(nil)

// Open validates the DSN, dials the database and verifies connectivity with a
// ping. The returned pool is owned by the caller, which must Close it on
// shutdown. A malformed DSN fails here, before any connection is attempted.
func Open(ctx context.Context, dsn string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("postgres: parse dsn: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("postgres: connect: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("postgres: ping: %w", err)
	}
	return pool, nil
}

// NewUserStore returns a store.UserStore backed by pool.
func NewUserStore(pool *pgxpool.Pool) *UserStore {
	return &UserStore{pool: pool}
}

// Create inserts u, mapping a unique-constraint violation to
// store.ErrEmailExists so a duplicate email stays an HTTP 400.
func (s *UserStore) Create(ctx context.Context, u domain.User) error {
	_, err := s.pool.Exec(ctx,
		`INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)`,
		u.ID, u.Email, u.PasswordHash, string(u.Role))
	if err != nil {
		if isUniqueViolation(err) {
			return store.ErrEmailExists
		}
		return fmt.Errorf("postgres: create user: %w", err)
	}
	return nil
}

// ByEmail returns the user with the given email, or store.ErrUserNotFound.
func (s *UserStore) ByEmail(ctx context.Context, email string) (domain.User, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, role FROM users WHERE email = $1`, email)
	return scanUser(row)
}

// ByID returns the user with the given id, or store.ErrUserNotFound.
func (s *UserStore) ByID(ctx context.Context, id string) (domain.User, error) {
	row := s.pool.QueryRow(ctx,
		`SELECT id, email, password_hash, role FROM users WHERE id = $1`, id)
	return scanUser(row)
}

// rowScanner is the subset of pgx.Row that scanUser needs, so the scan helper
// is testable without a live connection.
type rowScanner interface {
	Scan(dest ...any) error
}

// scanUser scans one user row, mapping pgx.ErrNoRows to store.ErrUserNotFound.
func scanUser(row rowScanner) (domain.User, error) {
	var (
		u    domain.User
		role string
	)
	if err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &role); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, store.ErrUserNotFound
		}
		return domain.User{}, fmt.Errorf("postgres: scan user: %w", err)
	}
	u.Role = domain.Role(role)
	return u, nil
}

// isUniqueViolation reports whether err is a PostgreSQL unique-constraint
// violation.
func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == uniqueViolation
}
