#!/bin/bash

# File: run_linera_hex_game.sh

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
linera_spawn_and_read_wallet_variables linera net up --testing-prng-seed 37 --extra-wallets 1

echo "Setting up owner and chain variables..."
OWNER_1=df44403a282330a8b086603516277c014c844a4b418835873aced1132a3adcd5
OWNER_2=43c319a4eab3747afcd608d32b73a2472fcaee390ec6bed3e694b4908f55772d
CHAIN_1=e476187f6ddfeb9d588c7b45d3df334d5501d6499b3f9ad5595cae86cce16a65

echo "Generating public keys..."
PUB_KEY_1=$(linera -w0 keygen)
PUB_KEY_2=$(linera -w1 keygen)

echo "Opening multi-owner chain..."
read -d '' MESSAGE_ID CHESS_CHAIN < <(linera -w0 --wait-for-outgoing-messages open-multi-owner-chain \
    --from $CHAIN_1 \
    --owner-public-keys $PUB_KEY_1 $PUB_KEY_2 \
    --initial-balance 1; printf '\0')

echo "Assigning keys..."
linera -w0 assign --key $PUB_KEY_1 --message-id $MESSAGE_ID
linera -w1 assign --key $PUB_KEY_2 --message-id $MESSAGE_ID

echo "Publishing and creating Hex Game project..."
APP_ID=$(linera -w0 --wait-for-outgoing-messages \
  project publish-and-create chess chess $CHESS_CHAIN \
    --json-argument "{
        \"players\": [\"$OWNER_1\", \"$OWNER_2\"]
    }")

echo "Starting Linera services..."
linera -w0 service --port 8080 &
linera -w1 service --port 8081 &

echo "Waiting for services to start..."
sleep 1

echo "Setup complete. Press Ctrl+C to stop all processes and exit."

# Wait indefinitely
while true; do
    sleep 1
done
