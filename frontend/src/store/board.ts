import { gameData, timer } from '@/api'
import { BoardType, Color, PieceColor } from '@/components/ChessBoard/types'
import { chessWasm } from '@/lib/chessWasmClient'
import { create } from 'zustand'

type BoardState = {
  state: BoardType
  updateAsync: (pubKey: string) => Promise<void>
  initDefaultAsync: () => void
  localMakeMove: (from: string, to: string, piece: string) => void
}

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const ranks = ['1', '2', '3', '4', '5', '6', '7', '8']

function squareToCoords(square: any) {
  return { file: square[0], rank: square[1] }
}

function pieceIs(piece: any, type: any) {
  return piece.toLowerCase() === type.toLowerCase()
}

export const useBoard = create<BoardState>((set, get) => ({
  state: {
    position: {},
    KingInCheck: '',
    en_passant: '',
    player_turn: 'w',
    color: '' as Color,
    game_state: 'NotStarted',
    opponent: '',
    winner: null,
    timer: {
      white: 0,
      black: 0,
    },
    lastMove: {
      from: '',
      to: '',
    },
  },

  updateAsync: async (pubKey: string) => {
    try {
      const res = await gameData(pubKey)
      const playerClock = await timer()

      if (!res?.result || !playerClock?.result) {
        throw new Error('No response from API')
      }

      const data = JSON.parse(res.result).data.gameData
      const { white, black } = JSON.parse(playerClock.result).data.timer
      const boardData: any = chessWasm.initBoard(data.fen)

      if (boardData) {
        set({
          state: {
            position: boardData.position,
            KingInCheck: boardData.king_in_check,
            en_passant: boardData.en_passant,
            player_turn: boardData.player_turn as PieceColor,
            color: data.color,
            game_state: data.gameState,
            opponent: data.opponent,
            timer: { white, black },
            winner: data.winner,
            lastMove: data.lastMove,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching game', error)
    }
  },
  initDefaultAsync: async () => {
    await chessWasm.initWasm()
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

    const boardData: any = chessWasm.initBoard(defaultFen)
    if (!boardData) return

    set({
      state: {
        position: boardData.position,
        KingInCheck: boardData.king_in_check,
        en_passant: boardData.en_passant,
        player_turn: boardData.player_turn as PieceColor,
        color: '' as Color,
        game_state: 'NotStarted',
        opponent: '',
        winner: null,
        timer: { white: 900, black: 900 },
        lastMove: { from: '', to: '' },
      },
    })
  },

  localMakeMove: (from: string, to: string, piece: string) => {
    // Optimistically update UI immediately
    console.log('move made')
    set((state) => {
      const position: any = { ...state.state.position }
      if (position[to]) {
        delete position[to]
      }
      delete position[from]
      position[to] = piece
      return {
        state: {
          ...state.state,
          position,
        },
      }
    })
  },
}))
