# ==============================
# Stage 1: Build Linera + WASM app
# ==============================
FROM rust:1.86.0-slim AS builder

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    protobuf-compiler \
    clang \
    make \
    libssl-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Add wasm target
RUN rustup target add wasm32-unknown-unknown

# Install Linera binaries (Conway testnet version 0.15.3)
RUN cargo install --locked linera-storage-service@0.15.3 && \
    cargo install --locked linera-service@0.15.3

# Set up working directory
WORKDIR /app

# Copy project files
COPY chess/ ./chess/
COPY deploy.sh ./deploy.sh

# Build the WASM target
RUN cd chess && cargo build --release --target wasm32-unknown-unknown

# ==============================
# Stage 2: Runtime image
# ==============================
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy Linera binaries from builder
RUN mkdir -p /app/chess

COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-server /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-proxy /usr/local/bin/

# Copy the entire chess directory with built artifacts
COPY --from=builder /app/chess/target/wasm32-unknown-unknown/release/chess_*.wasm ./chess/
COPY --from=builder /app/deploy.sh ./deploy.sh

RUN chmod +x ./deploy.sh

EXPOSE 8080

ENTRYPOINT ["/app/deploy.sh"]
