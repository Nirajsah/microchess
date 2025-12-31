# MicroChess

[![Tests](https://github.com/Nirajsah/microchess/actions/workflows/test.yml/badge.svg)](https://github.com/Nirajsah/microchess/actions)

Welcome to the MicroChess, a cutting-edge project that merges classic chess game with the innovation of blockchain technology. Built on Linera’s Layer 1 architecture, our platform provides a secure, transparent, and engaging environment for chess enthusiasts to enjoy on-chain gameplay.

- **MicroChess:** Play classic chess in a decentralized and secure environment.

## Features

- **Decentralized Multiplayer:** Compete with others in a trustless, decentralized environment using Linera's temporary chain architecture. Enjoy real-time gameplay without relying on a central authority.
- **Efficient Bitboard Representation:** Manage and compute game states quickly with bitboards, ensuring smooth gameplay.
- **Immutable Game History:** All moves and outcomes are recorded on the blockchain for a permanent, tamper-proof record.
- **Web3 Integration:** Seamlessly interact with blockchain features through an intuitive web interface.
- **Future Enhancements:** Planned updates include computer opponents for solo play and premium features for advanced users.

To get started with the Microchess, follow these steps:

## Compiling and Deployment

You should have rust and pnpm installed.

```
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol
cargo install --path linera-service
cargo install --path linera-storage-service

# make sure linera and its corresponding binaries are installed
git clone https://github.com/Nirajsah/microchess.git
cd microchess
./run.sh # this scripts deploys the app and starts the linera service
cd frontend # .env.local should have the updated APP_ID in place
pnpm dev
```

**make sure to clone and build the croissant wallet and set it up as extension**
https://github.com/Nirajsah/croissant

## MicroChess Completed Features

### Foundation and Initial Development

- Implemented basic game logic.
- Set up the chessboard and pieces.
- Basic move handling.
- FEN string generation and processing.

### Move Validation of Each Piece

- Implemented move validation for:
  - Pawns
  - Knights
  - Bishops
  - Rooks
  - Queens
  - Kings

### Tournament System Requirements

**Core Tournament Management**

- [x] Enable users to create and host tournaments
- [x] Allow users to register for tournaments
- [ ] Allow participants to withdraw from tournaments
- [ ] Maintain and progress tournament state through defined phases (registration, active rounds, completed)

**Pairings and Structure**

- [x] Automatically generate participant pairings
- [ ] Automatically generate round brackets
- [ ] Support multiple tournament formats:
  - [x] Swiss System
  - [ ] Round Robin

**Match and Round Execution**

- [ ] Create on-chain game instances for all matches and rounds
- [ ] Track match results and advance rounds accordingly

**Participant Experience**

- [ ] Send notifications to participants for:
  - [ ] Registration status
  - [ ] Round start
  - [ ] Match assignments
  - [ ] Tournament completion

**Persistence and Archival**

- [ ] Persist completed tournaments to blob storage for long-term retention
- [ ] Ensure historical tournament data remains accessible and verifiable

### Future Features

- [ ] Implement AI opponent for single-player mode.

## License

This project is licensed under the [APACHE License](LICENSE).

---

### Chess Pieces Set:

Copyright/Attribution Notice:
JohnPablok's improved Cburnett chess set.

**Disclaimer:** This project is in active development and features may change. Stay tuned for updates and new releases!
