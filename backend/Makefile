.PHONY: build test vet run tidy

build:
	go build ./...

test:
	go test ./...

vet:
	go vet ./...

tidy:
	go mod tidy

run:
	go run ./cmd/server
