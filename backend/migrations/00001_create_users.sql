-- +goose Up
CREATE TABLE users (
    id            uuid PRIMARY KEY,
    email         text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role          text NOT NULL CHECK (role IN ('worker', 'company', 'admin'))
);

-- +goose Down
DROP TABLE users;
