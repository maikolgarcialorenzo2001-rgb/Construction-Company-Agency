package service

import (
	"context"
	"errors"
	"fmt"

	"cca/backend/internal/store"
)

// Me returns the current user's profile, fetching the email from the store by
// user id (design D5: the JWT carries only sub/role/exp; the store stays the
// authoritative source of identity). A user that no longer exists is reported
// as ErrNotAuthenticated.
func (s *Auth) Me(ctx context.Context, userID string) (MeResult, error) {
	user, err := s.users.ByID(ctx, userID)
	if err != nil {
		if errors.Is(err, store.ErrUserNotFound) {
			return MeResult{}, ErrNotAuthenticated
		}
		return MeResult{}, fmt.Errorf("service: find user: %w", err)
	}

	return MeResult{UserID: user.ID, Email: user.Email, Role: user.Role}, nil
}
