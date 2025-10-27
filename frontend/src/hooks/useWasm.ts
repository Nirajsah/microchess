import { useEffect, useState, useCallback } from 'react'
import init, {
  init_board,
  generate_moves,
  update_board,
  get_board,
  get_game_state,
} from 'wasm'

type ChessWasm = {
  isLoading: boolean
  isInitialized: boolean
  initBoard: (fen: string) => BoardData | null
  generateMoves: (square: string) => string[]
  updateBoard: (fen: string) => void
  getBoard: () => BoardData | null
  getGameState: () => GameState | null
}

type BoardData = {
  position: Record<string, string>
  player_turn: string
  en_passant: string
  king_in_check: string
}

type GameState = {
  player_turn: string
  king_in_check: boolean
}

export const useChessWasm = (): ChessWasm => {
  const [isLoading, setIsLoading] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize WASM module once on mount
  useEffect(() => {
    let isMounted = true

    const initWasm = async () => {
      try {
        await init()
        if (isMounted) {
          setIsInitialized(true)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Failed to initialize WASM:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initWasm()

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize board with FEN
  const initBoard = useCallback(
    (fen: string): BoardData | null => {
      if (!isInitialized) {
        console.warn('WASM not initialized yet')
        return null
      }

      try {
        const boardJson = init_board(fen)
        return JSON.parse(boardJson)
      } catch (error) {
        console.error('Failed to initialize board:', error)
        return null
      }
    },
    [isInitialized]
  )

  // Generate moves for a piece
  const generateMoves = useCallback(
    (square: string): string[] => {
      if (!isInitialized) return []

      try {
        const movesJson = generate_moves(square)
        return JSON.parse(movesJson)
      } catch (error) {
        console.error('Failed to generate moves:', error)
        return []
      }
    },
    [isInitialized]
  )

  // Update board with new FEN
  const updateBoard = useCallback(
    (fen: string): void => {
      if (!isInitialized) return

      try {
        update_board(fen)
      } catch (error) {
        console.error('Failed to update board:', error)
      }
    },
    [isInitialized]
  )

  // Get current board state
  const getBoard = useCallback((): BoardData | null => {
    if (!isInitialized) return null

    try {
      const boardJson = get_board()
      return JSON.parse(boardJson)
    } catch (error) {
      console.error('Failed to get board:', error)
      return null
    }
  }, [isInitialized])

  // Get game state
  const getGameState = useCallback((): GameState | null => {
    if (!isInitialized) return null

    try {
      const stateJson = get_game_state()
      return JSON.parse(stateJson)
    } catch (error) {
      console.error('Failed to get game state:', error)
      return null
    }
  }, [isInitialized])

  return {
    isLoading,
    isInitialized,
    initBoard,
    generateMoves,
    updateBoard,
    getBoard,
    getGameState,
  }
}
