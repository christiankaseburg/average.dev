# Stage 1: Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY apps/home-api/go.mod apps/home-api/go.sum ./
RUN go mod download

# Copy source code
COPY apps/home-api/main.go ./

# Build statically compiled binary
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Stage 2: Run
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

COPY --from=builder /app/main .

EXPOSE 8080

ENV GIN_MODE=release
ENV PORT=8080

CMD ["./main"]
