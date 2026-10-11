package memory_test

import (
	"testing"

	"cca/backend/internal/store"
	"cca/backend/internal/store/memory"
	"cca/backend/internal/store/storetest"
)

func TestUserStore_Conformance(t *testing.T) {
	storetest.RunUserStore(t, func(*testing.T) store.UserStore {
		return memory.NewUserStore()
	})
}

// Compile-time proof that the in-memory adapter satisfies the port.
var _ store.UserStore = (*memory.UserStore)(nil)
