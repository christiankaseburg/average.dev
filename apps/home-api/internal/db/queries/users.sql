-- name: CreateUser :one
INSERT INTO users (name, primary_email, role)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUser :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE primary_email = $1 LIMIT 1;

-- name: CreateIdentity :one
INSERT INTO identities (user_id, provider, provider_id, email)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetIdentity :one
SELECT * FROM identities
WHERE provider = $1 AND provider_id = $2 LIMIT 1;

-- name: ListIdentitiesByUserID :many
SELECT * FROM identities
WHERE user_id = $1;

-- name: GetUserByIdentity :one
SELECT u.*
FROM users u
JOIN identities i ON u.id = i.user_id
WHERE i.provider = $1 AND i.provider_id = $2
LIMIT 1;
