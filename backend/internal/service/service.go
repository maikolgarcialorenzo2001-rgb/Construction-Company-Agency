// Package service implements the backend application services. Services depend
// on the store and auth ports only, never on concrete adapters or HTTP.
package service

import (
	"errors"

	"cca/backend/internal/auth"
	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// Sentinel errors returned by Auth methods. Handlers map them to the contract
// error envelope (design D9 / WU2–WU4 error map).
var (
	// ErrRoleNotAllowed is returned when a self-registration asks for a role
	// that cannot be self-assigned (admin or anything outside worker/company).
	ErrRoleNotAllowed = errors.New("service: role not allowed")
	// ErrEmailAlreadyExists is returned when registering an email that is stored.
	ErrEmailAlreadyExists = errors.New("service: email already exists")
	// ErrInvalidCredentials is returned for an unknown email or a bad password.
	ErrInvalidCredentials = errors.New("service: invalid credentials")
	// ErrNotAuthenticated is returned when the current user cannot be resolved.
	ErrNotAuthenticated = errors.New("service: not authenticated")
)

// Auth is the authentication application service.
type Auth struct {
	users  store.UserStore
	tokens auth.Issuer
	hasher auth.Hasher
	newID  func() string
}

// Option customizes an Auth service.
type Option func(*Auth)

// WithIDGenerator overrides the user-id generator (used by tests).
func WithIDGenerator(newID func() string) Option {
	return func(a *Auth) { a.newID = newID }
}

// NewAuth wires the authentication service over the given ports.
func NewAuth(users store.UserStore, tokens auth.Issuer, hasher auth.Hasher, opts ...Option) *Auth {
	a := &Auth{
		users:  users,
		tokens: tokens,
		hasher: hasher,
		newID:  domain.NewID,
	}
	for _, opt := range opts {
		opt(a)
	}
	return a
}

// RegisterResult is the outcome of a successful registration.
type RegisterResult struct {
	UserID string
	Token  string
}

// LoginResult is the outcome of a successful login.
type LoginResult struct {
	Token string
	Role  domain.Role
}

// MeResult is the current user's profile.
type MeResult struct {
	UserID string
	Email  string
	Role   domain.Role
}
