.PHONY: build test test-integration vet run migrate tidy

# Local test-database DSN for the gated integration suite. It is only a
# convenience default — override it to point elsewhere:
#   make test-integration CCA_TEST_DATABASE_URL=postgres://user:pass@host:5432/db
# The tests never hardcode a DSN; they read this environment variable.
CCA_TEST_DATABASE_URL ?= postgres://postgres:123@127.0.0.1:5432/cca

build:
	go build ./...

test:
	go test ./...

# Runs the database-gated integration tests against CCA_TEST_DATABASE_URL.
# -count=1 disables the test cache and -p 1 serializes the package binaries:
# the migrations, internal/store/postgres and internal/httpapi gated tests share
# one database and the migrations test drops/recreates the users table.
test-integration:
	CCA_TEST_DATABASE_URL="$(CCA_TEST_DATABASE_URL)" go test -count=1 -p 1 ./...

vet:
	go vet ./...

tidy:
	go mod tidy

# Applies the embedded goose migrations and exits without opening a listener.
# Requires DATABASE_URL, e.g.:
#   DATABASE_URL=postgres://user:pass@host:5432/db make migrate
migrate:
	go run ./cmd/server -migrate

run:
	go run ./cmd/server
