#!/bin/bash

# Build with maximum optimization
wasm-pack build --target web --release

echo "Build complete! Optimized WASM binary ready."
