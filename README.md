# Stella

**Decentralized Games: Play Fair, Play Secure, Play On-Chain.**

Welcome to the Decentralized Games Platform, a cutting-edge project that merges classic board games with the innovation of blockchain technology. Built on Linera’s Layer 1 architecture, our platform provides a secure, transparent, and engaging environment for game enthusiasts to enjoy on-chain gameplay.

Currently, you can enjoy:

- **MicroChess:** Play classic chess in a decentralized and secure environment.

## Features

- **Decentralized Multiplayer:** Compete with others in a trustless, decentralized environment using Linera's temporary chain architecture. Enjoy real-time gameplay without relying on a central authority.
- **Efficient Bitboard Representation:** Manage and compute game states quickly with bitboards, ensuring smooth gameplay.
- **Immutable Game History:** All moves and outcomes are recorded on the blockchain for a permanent, tamper-proof record.
- **Web3 Integration:** Seamlessly interact with blockchain features through an intuitive web interface.
- **Future Enhancements:** Planned updates include computer opponents for solo play and premium features for advanced users.

To get started with the Decentralized Game Platform, follow these steps:

## Compiling and Deployment

You should have rust and bun.js or yarn installed.

```
git clone https://github.com/linera-io/linera-protocol.git
cd linera-protocol
cargo install --path linera-service
cargo install --path linera-storage-service
git clone https://github.com/Nirajsah/stella.git
cd stella
./run.sh
cd frontend
bun vite build
bun preview
```

**_To play you need to have port number, chainId and owner stored in the sessionStorage of you browser_**

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

## Todo List

### Chess Rules

- [x] Implement capturing mechanics.
- [x] Implement pawn double move.
- [x] Implement turn-based play (White moves first).
- [x] Detect and handle check.
- [x] Implement castling.
- [x] Implement en passant.
- [x] Detect and handle checkmate.
- [x] Implement pawn promotion.
- [x] Implement stalemate detection.
- [x] Implement draw by threefold repetition.
- [x] Implement draw by the fifty-move rule.

### Future Features

- [ ] Add support for different game modes.
- [ ] Develop a tournament feature.
- [ ] Implement AI opponent for single-player mode.
- [ ] Expand game options beyond chess.

## License

This project is licensed under the [APACHE License](LICENSE).

---

### Chess Pieces Set:

Copyright/Attribution Notice:
JohnPablok's improved Cburnett chess set.

**Disclaimer:** This project is in active development and features may change. Stay tuned for updates and new releases!
