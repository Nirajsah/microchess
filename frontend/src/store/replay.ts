import { Color, SquareToPieceMap } from '@/ChessBoard/types'
import { create } from 'zustand'

export type Board = {
  position: SquareToPieceMap
  ids: Record<string, string>
  KingInCheck: string
  player_turn: string
  color: Color
}

type MatchReplayState = {
  board: Board
  history: Board[]
  updateState: (san: string, board: Board, turn: string) => void
  updateBoard: (index: number) => void
  setHistory: (history: Board[]) => void
  resetBoard: () => void
}

export const defaultBoard: Board = {
  position: {
    a1: 'wR',
    b1: 'wN',
    c1: 'wB',
    d1: 'wQ',
    e1: 'wK',
    f1: 'wB',
    g1: 'wN',
    h1: 'wR',
    a2: 'wP',
    b2: 'wP',
    c2: 'wP',
    d2: 'wP',
    e2: 'wP',
    f2: 'wP',
    g2: 'wP',
    h2: 'wP',
    a7: 'bP',
    b7: 'bP',
    c7: 'bP',
    d7: 'bP',
    e7: 'bP',
    f7: 'bP',
    g7: 'bP',
    h7: 'bP',
    a8: 'bR',
    b8: 'bN',
    c8: 'bB',
    d8: 'bQ',
    e8: 'bK',
    f8: 'bB',
    g8: 'bN',
    h8: 'bR',
  },
  ids: {
    a1: 'wR-a1',
    b1: 'wN-b1',
    c1: 'wB-c1',
    d1: 'wQ-d1',
    e1: 'wK-e1',
    f1: 'wB-f1',
    g1: 'wN-g1',
    h1: 'wR-h1',
    a2: 'wP-a2',
    b2: 'wP-b2',
    c2: 'wP-c2',
    d2: 'wP-d2',
    e2: 'wP-e2',
    f2: 'wP-f2',
    g2: 'wP-g2',
    h2: 'wP-h2',
    a7: 'bP-a7',
    b7: 'bP-b7',
    c7: 'bP-c7',
    d7: 'bP-d7',
    e7: 'bP-e7',
    f7: 'bP-f7',
    g7: 'bP-g7',
    h7: 'bP-h7',
    a8: 'bR-a8',
    b8: 'bN-b8',
    c8: 'bB-c8',
    d8: 'bQ-d8',
    e8: 'bK-e8',
    f8: 'bB-f8',
    g8: 'bN-g8',
    h8: 'bR-h8',
  },
  KingInCheck: '',
  player_turn: 'w',
  color: 'White',
}

export const useReplayStore = create<MatchReplayState>((set, get) => ({
  board: defaultBoard,
  history: [], // Changed to array

  updateState: (_san, newBoard, turn) => {
    const { board, history } = get()
    // We ignore 'san' key for storage, just append to history array
    // We might want to store the SAN with the board if needed, but Board type doesn't have it.
    // For now, we assume the history array aligns with the moves array in ReplayBoard.

    // Check if we are resetting or appending. 
    // Since runReplay loops, we might be appending.
    // But if we re-run, we might duplicate. 
    // Ideally we should setHistory.

    set({
      board: { ...board, player_turn: turn },
      history: Array.isArray(history) ? [...history, newBoard] : [newBoard],
    })
  },

  updateBoard: (index: number | string) => {
    const { history } = get()

    // Support both index (number) and legacy SAN (string) if needed, 
    // but we are moving to index.
    if (typeof index === 'number') {
      // @ts-ignore
      const newBoard = history[index]
      if (newBoard) {
        set({ board: newBoard })
      }
    } else {
      // Fallback or Error? 
      // The previous implementation used string key.
      // If we changed history to array, string key won't work.
      console.warn("updateBoard called with string, but history is array")
    }
  },

  setHistory: (history: Board[]) => set({ history }),
  resetBoard: () => set({ board: defaultBoard }),
}))
