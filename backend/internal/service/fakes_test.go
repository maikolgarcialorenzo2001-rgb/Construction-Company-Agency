package service_test

import (
	"context"
	"errors"
	"strings"
	"sync"

	"cca/backend/internal/auth"
	"cca/backend/internal/domain"
	"cca/backend/internal/store"
)

// fakeStore is an in-memory store.UserStore used to keep service tests at the
// unit boundary.
type fakeStore struct {
	mu      sync.Mutex
	byEmail map[string]domain.User
	byID    map[string]domain.User
}

func newFakeStore() *fakeStore {
	return &fakeStore{byEmail: map[string]domain.User{}, byID: map[string]domain.User{}}
}

func (f *fakeStore) seed(users ...domain.User) {
	f.mu.Lock()
	defer f.mu.Unlock()
	for _, u := range users {
		f.byEmail[u.Email], f.byID[u.ID] = u, u
	}
}

func (f *fakeStore) Create(_ context.Context, u domain.User) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if _, ok := f.byEmail[u.Email]; ok {
		return store.ErrEmailExists
	}
	f.byEmail[u.Email], f.byID[u.ID] = u, u
	return nil
}

func (f *fakeStore) ByEmail(_ context.Context, email string) (domain.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byEmail[email]
	if !ok {
		return domain.User{}, store.ErrUserNotFound
	}
	return u, nil
}

func (f *fakeStore) ByID(_ context.Context, id string) (domain.User, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byID[id]
	if !ok {
		return domain.User{}, store.ErrUserNotFound
	}
	return u, nil
}

func (f *fakeStore) stored(email string) (domain.User, bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	u, ok := f.byEmail[email]
	return u, ok
}

func (f *fakeStore) len() int {
	f.mu.Lock()
	defer f.mu.Unlock()
	return len(f.byEmail)
}

// fakeHasher hashes with a deterministic "hashed:" prefix so tests can prove
// the plaintext password is never what gets stored.
type fakeHasher struct {
	compareErr error
}

func (f *fakeHasher) Hash(password string) (string, error) { return hashOf(password), nil }

func (f *fakeHasher) Compare(hash, password string) error {
	if f.compareErr != nil {
		return f.compareErr
	}
	if hash == hashOf(password) {
		return nil
	}
	return errors.New("fakeHasher: password mismatch")
}

func hashOf(password string) string { return "hashed:" + password }

// fakeIssuer records the tokens it mints and can be forced to fail.
type fakeIssuer struct {
	issueErr error
	issued   []issueCall
}

type issueCall struct {
	userID string
	role   domain.Role
}

func (f *fakeIssuer) Issue(userID string, role domain.Role) (string, error) {
	if f.issueErr != nil {
		return "", f.issueErr
	}
	f.issued = append(f.issued, issueCall{userID: userID, role: role})
	return "token:" + userID, nil
}

func (f *fakeIssuer) Verify(token string) (auth.Claims, error) {
	const prefix = "token:"
	if !strings.HasPrefix(token, prefix) || len(token) == len(prefix) {
		return auth.Claims{}, errors.New("fakeIssuer: bad token")
	}
	return auth.Claims{UserID: token[len(prefix):]}, nil
}

var (
	_ store.UserStore = (*fakeStore)(nil)
	_ auth.Hasher     = (*fakeHasher)(nil)
	_ auth.Issuer     = (*fakeIssuer)(nil)
)
