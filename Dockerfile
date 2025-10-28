# ==============================
# Stage 1: Build Linera + WASM app
# ==============================
FROM --platform=linux/arm64 rust:1.86.0-slim AS builder

# Install dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    protobuf-compiler \
    libprotobuf-dev \
    clang \
    make \
    libssl-dev \
    ca-certificates \
    curl \
    build-base \
    && rm -rf /var/lib/apt/lists/*

# Add wasm target
RUN rustup target add wasm32-unknown-unknown

# Install Linera binaries (Conway testnet version 0.15.3)
RUN cargo install --locked linera-storage-service@0.15.3 && \
    cargo install --locked linera-service@0.15.3

# Set up working directory
WORKDIR /app

# Copy project files
COPY . .

# Build the WASM target
RUN cargo build --release --target wasm32-unknown-unknown -p chess

# ==============================
# Stage 2: Runtime image
# ==============================
FROM --platform=linux/arm64 debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
    liggcc-s1 \
    && rm -rf /var/lib/apt/lists/* 

# Set up working directory
WORKDIR /app

# Copy Linera binaries from builder
COPY --from=builder /usr/local/cargo/bin/linera /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-server /usr/local/bin/
COPY --from=builder /usr/local/cargo/bin/linera-proxy /usr/local/bin/

# Copy the entire chess directory with built artifacts
COPY --from=builder /app/chess/target/wasm32-unknown-unknown/release/chess_*.wasm ./chess/
COPY --from=builder /app/deploy.sh ./deploy.sh

RUN chmod +x ./deploy.sh

EXPOSE 8080

ENTRYPOINT ["/app/deploy.sh"]
