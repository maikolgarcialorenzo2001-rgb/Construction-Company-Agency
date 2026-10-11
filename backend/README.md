# cca/backend

Go backend for the construction company agency platform. Self-contained module
(`cca/backend`) — the default build and test suite need no external service.

## Requirements

- Go 1.27+ (toolchain resolved via the `go` wrapper)
- `CGO_ENABLED=0`

## Commands

| Task              | Command                    |
|-------------------|----------------------------|
| Build             | `go build ./...`           |
| Test              | `go test ./...`            |
| Integration tests | `make test-integration`    |
| Vet               | `go vet ./...`             |
| Migrate           | `DATABASE_URL=… make migrate` |
| Run               | `go run ./cmd/server`      |

Or via the Makefile: `make build`, `make test`, `make test-integration`, `make run`.

## Configuration

Read from the environment (see `.env.example`):

| Variable                  | Required | Default                       | Purpose                        |
|---------------------------|----------|-------------------------------|--------------------------------|
| `PORT`                    | no       | `8080`                        | HTTP listen port               |
| `JWT_SECRET`              | yes      | —                             | HS256 signing secret           |
| `CONTRACT_PATH`           | no       | repo `contracts/openapi.yaml` | Contract override (test guard) |
| `TOKEN_TTL`               | no       | `24h`                         | Issued JWT lifetime            |
| `DATABASE_URL`            | no       | — (in-memory)                 | PostgreSQL DSN; selects pgx    |
| `CCA_TEST_DATABASE_URL`   | no       | —                             | DSN for the gated test suite   |

Startup fails fast when `JWT_SECRET` is missing or a value is invalid.

### Contract guard and `CONTRACT_PATH`

`CONTRACT_PATH` is consumed at **test time** by `contract.ResolvePath()`
(`internal/contract`), which loads and validates `contracts/openapi.yaml`
through the kin-openapi guard. `config.Config.ContractPath` mirrors the env var
so the configuration surface is complete and forward-compatible, but the
composition root (`cmd/server`) intentionally does **not** load the contract:
the guard is a test-only harness (design D3). Run the guard check with:

```sh
go test ./internal/contract/ -run TestGuard_LoadsAndValidatesContract
```

## Database and migrations

`DATABASE_URL` is optional. When it is **empty or unset** the server uses the
in-memory store and needs no database. When it is **set**, the server opens a
pgx connection pool, applies the embedded goose migrations idempotently
(creating `users` if needed) and serves against PostgreSQL. The pool is closed
on shutdown.

```sh
# Serve against PostgreSQL (migrations run at startup):
DATABASE_URL=postgres://postgres:123@127.0.0.1:5432/cca go run ./cmd/server

# Apply the migrations only, without opening a listener:
DATABASE_URL=postgres://postgres:123@127.0.0.1:5432/cca make migrate
```

## Integration tests

The database-backed tests are gated: they run only when
`CCA_TEST_DATABASE_URL` is set **and** `-short` is absent, and they skip green
otherwise. The default `go test ./...` therefore stays dependency-free.

```sh
# Optional override; this is the built-in default in the Makefile:
make test-integration CCA_TEST_DATABASE_URL=postgres://postgres:123@127.0.0.1:5432/cca
```

`make test-integration` runs with `-count=1 -p 1`: the gated packages share a
single test database, so the package binaries must run serially.


## Endpoints

| Method | Path      | Purpose                    |
|--------|-----------|----------------------------|
| GET    | `/health` | Operational liveness (200) |

The auth operations (`/auth/register`, `/auth/login`, `/auth/me`) are added in
later work units.
