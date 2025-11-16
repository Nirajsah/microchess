#!/bin/bash

# File: run_microchess.sh

# Function to kill all background processes
kill_processes() {
    echo "Killing all background processes..."
    kill $(jobs -p)
    exit
}

# Set up trap to kill processes on script exit
trap kill_processes EXIT

# Set up PATH
export PATH="$PWD/target/debug:$PATH"
source /dev/stdin <<<"$(linera net helper 2>/dev/null)"

echo "Setting up Linera network..."
FAUCET_PORT=8079
FAUCET_URL=http://localhost:$FAUCET_PORT
linera_spawn linera net up --with-faucet --faucet-port $FAUCET_PORT

LINERA_TMP_DIR=$(mktemp -d)

echo "Setting up owner and chain variables..."
export LINERA_WALLET_1="$LINERA_TMP_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_TMP_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_TMP_DIR/client_1.db"

linera --with-wallet 1 wallet init --faucet $FAUCET_URL

INFO_1=($(linera --with-wallet 1 wallet request-chain --faucet $FAUCET_URL))
CHAIN_1="${INFO_1[0]}"

cargo build -p chess --release --target wasm32-unknown-unknown 

echo "Publishing and creating Chess Game project..."
LINERA_APPLICATION_ID=$(linera --with-wallet 1 publish-and-create \
  target/wasm32-unknown-unknown/release/chess_{contract,service}.wasm \
  --json-argument "{
        \"startTime\": 600000000,
        \"increment\": 600000000,
        \"blockDelay\": 100000000
    }")



echo "Waiting for services to start..."
echo "Starting Linera services..."
linera -w1 service --port 8080 &
sleep 1

echo $LINERA_APPLICATION_ID

# === Write to frontend/.env.local ===
FRONTEND_ENV_FILE="$PWD/frontend/.env.local"
ENV_VAR_NAME="VITE_MICROCHESS_APPLICATION_ID"

# clear the old id
:> $FRONTEND_ENV_FILE
 
# Remove old line
echo "$ENV_VAR_NAME=\"$LINERA_APPLICATION_ID\"" >> "$FRONTEND_ENV_FILE"

echo "http://localhost:8080/chains/$CHAIN_1/applications/$LINERA_APPLICATION_ID"

echo "Setup complete. Press Ctrl+C to stop all processes and exit."

# Wait indefinitely
while true; do
    sleep 1
done
