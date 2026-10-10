package service_test

import (
	"context"
	"errors"
	"testing"

	"cca/backend/internal/domain"
	"cca/backend/internal/service"
)

func TestMe_ReturnsProfile(t *testing.T) {
	stored := domain.User{
		ID:           "u1",
		Email:        "ana@demo.test",
		PasswordHash: "hashed:whatever",
		Role:         domain.RoleWorker,
	}

	users := newFakeStore()
	users.seed(stored)
	svc := service.NewAuth(users, &fakeIssuer{}, &fakeHasher{})

	got, err := svc.Me(context.Background(), "u1")
	if err != nil {
		t.Fatalf("Me() error = %v, want nil", err)
	}
	if got.UserID != stored.ID {
		t.Errorf("Me() UserID = %q, want %q", got.UserID, stored.ID)
	}
	if got.Email != stored.Email {
		t.Errorf("Me() Email = %q, want %q (from the store)", got.Email, stored.Email)
	}
	if got.Role != stored.Role {
		t.Errorf("Me() Role = %q, want %q", got.Role, stored.Role)
	}
}

func TestMe_UnknownUserIsNotAuthenticated(t *testing.T) {
	svc := service.NewAuth(newFakeStore(), &fakeIssuer{}, &fakeHasher{})

	if _, err := svc.Me(context.Background(), "missing"); !errors.Is(err, service.ErrNotAuthenticated) {
		t.Fatalf("Me() error = %v, want service.ErrNotAuthenticated", err)
	}
}
