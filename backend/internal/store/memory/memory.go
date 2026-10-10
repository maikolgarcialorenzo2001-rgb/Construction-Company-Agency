// Package memory provides a concurrency-safe in-memory implementation of the
// store.UserStore port, used by unit and contract tests and the default server.
package memory

import (
	"context"
	"sync"

	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// UserStore is an in-memory store.UserStore.
type UserStore struct {
	mu      sync.RWMutex
	byID    map[string]domain.User
	byEmail map[string]domain.User
}

var _ store.UserStore = (*UserStore)(nil)

// NewUserStore returns an empty in-memory user store.
func NewUserStore() *UserStore {
	return &UserStore{
		byID:    make(map[string]domain.User),
		byEmail: make(map[string]domain.User),
	}
}

// Create stores a new user, returning store.ErrEmailExists on a duplicate.
func (s *UserStore) Create(_ context.Context, u domain.User) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, exists := s.byEmail[u.Email]; exists {
		return store.ErrEmailExists
	}
	s.byID[u.ID] = u
	s.byEmail[u.Email] = u
	return nil
}

// ByEmail returns the user with the given email, or store.ErrUserNotFound.
func (s *UserStore) ByEmail(_ context.Context, email string) (domain.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, ok := s.byEmail[email]
	if !ok {
		return domain.User{}, store.ErrUserNotFound
	}
	return u, nil
}

// ByID returns the user with the given id, or store.ErrUserNotFound.
func (s *UserStore) ByID(_ context.Context, id string) (domain.User, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	u, ok := s.byID[id]
	if !ok {
		return domain.User{}, store.ErrUserNotFound
	}
	return u, nil
}
