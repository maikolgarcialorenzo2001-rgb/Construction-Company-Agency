// Package store defines the persistence ports for the backend. Services depend
// on these interfaces only; swapping an adapter is a composition-root change.
package store

import (
	"context"
	"errors"

	"cca/backend/internal/domain"
)

// Sentinel errors returned by UserStore adapters. Callers compare with
// errors.Is.
var (
	// ErrEmailExists is returned by Create when the email is already stored.
	ErrEmailExists = errors.New("store: email already exists")
	// ErrUserNotFound is returned when no user matches the lookup.
	ErrUserNotFound = errors.New("store: user not found")
)

// UserStore is the persistence port for user accounts.
type UserStore interface {
	// Create stores a new user, returning ErrEmailExists on a duplicate email.
	Create(ctx context.Context, u domain.User) error
	// ByEmail returns the user with the given email, or ErrUserNotFound.
	ByEmail(ctx context.Context, email string) (domain.User, error)
	// ByID returns the user with the given id, or ErrUserNotFound.
	ByID(ctx context.Context, id string) (domain.User, error)
}
