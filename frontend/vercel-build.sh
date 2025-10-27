#!/bin/bash
set -e

# Use /vercel instead of /root
export CARGO_HOME="/vercel/.cargo"
export RUSTUP_HOME="/vercel/.rustup"
export PATH="$CARGO_HOME/bin:$PATH"

# Install Rust if not available
if ! command -v cargo &>/dev/null; then
  echo "Installing Rust..."
  curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain stable --profile minimal
  source "$CARGO_HOME/env"
fi

# Add wasm32 target
rustup target add wasm32-unknown-unknown

echo "Rust version:"
rustc --version
cargo --version

# Build WASM package
echo "Building WASM..."
cd wasm
wasm-pack build --target web --release
cd ..

# Reinstall workspace to refresh type links
pnpm install --offline

# Build frontend
echo "Building frontend..."
tsc -b && vite build
