import init, {
  init_board,
  generate_moves,
  update_board,
  get_board,
  get_game_state,
} from 'wasm'

export const chessWasm = {
  isInitialized: false,
  wasmInitPromise: null as Promise<void> | null | any,

  async initWasm() {
    if (this.isInitialized) return
    if (!this.wasmInitPromise) {
      this.wasmInitPromise = init() // only create once
    }
    await this.wasmInitPromise
    this.isInitialized = true
  },

  initBoard(fen: string) {
    if (!this.isInitialized) return null
    return JSON.parse(init_board(fen))
  },

  generateMoves(square: string) {
    if (!this.isInitialized) return []
    return JSON.parse(generate_moves(square))
  },

  updateBoard(fen: string) {
    if (!this.isInitialized) return
    update_board(fen)
  },

  getBoard() {
    if (!this.isInitialized) return null
    return JSON.parse(get_board())
  },

  getGameState() {
    if (!this.isInitialized) return null
    return JSON.parse(get_game_state())
  },
}
