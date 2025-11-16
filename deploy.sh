#!/bin/bash

# File: deploy.sh
#
# 
# Function to kill all background processes
kill_processes() {
    echo "Killing all background processes..."
    kill $(jobs -p)
    exit
}

# Set up trap to kill processes on script exit
trap kill_processes EXIT

echo "Setting up Linera network..."

# Set environment variables
LINERA_DIR=/data/linera
mkdir -p $LINERA_DIR

FAUCET_URL=https://faucet.testnet-conway.linera.net/
mkdir -p "$LINERA_DIR"
chmod 700 "$LINERA_DIR"

echo "Setting up owner and chain variables..."
export LINERA_WALLET_1="$LINERA_DIR/wallet_1.json"
export LINERA_KEYSTORE_1="$LINERA_DIR/keystore_1.json"
export LINERA_STORAGE_1="rocksdb:$LINERA_DIR/client_1.db"

echo $LINERA_WALLET_1

linera --with-wallet 1 wallet init --faucet $FAUCET_URL

INFO_1=($(linera --with-wallet 1 wallet request-chain --faucet $FAUCET_URL))

linera --with-wallet 1 wallet show

echo "Publishing and creating Microchess project..."
LINERA_APPLICATION_ID=$(linera --with-wallet 1 publish-and-create \
  chess/chess_{contract,service}.wasm \
  --json-argument "{
        \"startTime\": 600000000,
        \"increment\": 600000000,
        \"blockDelay\": 100000000
    }")


echo AppId: $LINERA_APPLICATION_ID

echo "Starting Linera services..."
linera -w1 service --port 8080 &

echo "Setup complete. Press Ctrl+C to stop all processes and exit."

# Wait indefinitely
while true; do
    sleep 1
done
 

