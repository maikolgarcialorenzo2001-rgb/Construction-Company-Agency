# cca/backend

Go backend for the construction company agency platform. Self-contained module
(`cca/backend`) — the default build and test suite need no external service.

## Requirements

- Go 1.27+ (toolchain resolved via the `go` wrapper)
- `CGO_ENABLED=0`

## Commands

| Task  | Command              |
|-------|----------------------|
| Build | `go build ./...`     |
| Test  | `go test ./...`      |
| Vet   | `go vet ./...`       |
| Run   | `go run ./cmd/server`|

Or via the Makefile: `make build`, `make test`, `make run`.

## Configuration

Read from the environment (see `.env.example`):

| Variable        | Required | Default              | Purpose                        |
|-----------------|----------|----------------------|--------------------------------|
| `PORT`          | no       | `8080`               | HTTP listen port               |
| `JWT_SECRET`    | yes      | —                    | HS256 signing secret           |
| `CONTRACT_PATH` | no       | repo `contracts/openapi.yaml` | Contract override      |
| `TOKEN_TTL`     | no       | `24h`                | Issued JWT lifetime            |

Startup fails fast when `JWT_SECRET` is missing or a value is invalid.

## Endpoints

| Method | Path      | Purpose                    |
|--------|-----------|----------------------------|
| GET    | `/health` | Operational liveness (200) |

The auth operations (`/auth/register`, `/auth/login`, `/auth/me`) are added in
later work units.
