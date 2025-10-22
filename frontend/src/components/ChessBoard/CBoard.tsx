import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { PromotionCard } from './PromotionCard'
import {
  BoardType,
  Color,
  Fen,
  Piece,
  PieceColor,
  PromoteData,
  Square,
} from './types'
import { RightSideMenu } from './RightSideMenu'
import ChessBoard from './ChessBoard'
import Modal from '../Modal'
import Settings from '../Themes'
import Navbar from './Navbar'
import { LeftSideMenu } from '../LeftSideMenu'
import { useWalletNotifications } from '@/hooks/useWalletNotification'
import { useChessWasm } from '@/hooks/useWasm'
import { gameData } from './utils'

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// const fen = 'bnrqnbkr/pppppppp/5K2/8/8/8/PPPPPPPP/BNRQNB1R w - - 0 1'

const CBoard = () => {
  const [boardState, _setBoardState] = React.useState<Fen>(fen)
  const [color, _setColor] = React.useState<Color>('w')
  const [capturedPieces, _setCapturedPieces] = React.useState<string[]>([])
  const [opponentId, _setOpponentId] = React.useState<string | null>(null)
  const [whiteTime, _setWhiteTime] = React.useState(900) // 15 minutes
  const [blackTime, _setBlackTime] = React.useState(900) // 15 minutes

  const { initBoard, isInitialized } = useChessWasm()

  const notification = useWalletNotifications()

  const [board, setBoard] = React.useState<BoardType>({
    position: {},
    KingInCheck: '',
    en_passant: '',
    player_turn: 'w',
    color: '',
    game_state: '',
    opponent: '',
    winner: null
  })

  // Separate function to fetch and update board state
  const fetchAndUpdateBoard = React.useCallback(async () => {
    if (!isInitialized) return

    try {
      const res = await gameData()
      const data = JSON.parse(res.result).data.getFen
      console.log('Fetched data from chain:', data)

      // Parse the game data (fen, color, opponent, game_state, winner)
      _setBoardState(data.fen)

      const boardData = initBoard(data.fen)

      if (boardData) {
        setBoard({
          position: boardData.position,
          KingInCheck: boardData.king_in_check,
          en_passant: boardData.en_passant,
          player_turn: boardData.player_turn as PieceColor,
          color: data.color,
          game_state: data.game_state,
          opponent: data.opponent,
          winner: data.winner
        })
      } else {
        // If boardData is null/undefined, use defaults from initial state
        console.log('Using default board state')
      }
    } catch (error) {
      console.error('Error fetching game ', error)
      // On error, keep using default/current state
      // Optionally initialize with default board if needed
      const defaultBoardData = initBoard(boardState)
      if (defaultBoardData) {
        setBoard(prev => ({
          ...prev,
          position: defaultBoardData.position,
          KingInCheck: defaultBoardData.king_in_check,
          en_passant: defaultBoardData.en_passant,
          player_turn: defaultBoardData.player_turn as PieceColor,
        }))
      }
    }
  }, [isInitialized, initBoard, _setBoardState])

  // Initial fetch on mount
  React.useEffect(() => {
    fetchAndUpdateBoard()
  }, [fetchAndUpdateBoard])

  // Listen for notifications and refetch

  React.useEffect(() => {
    if (notification) {
      console.log('New notification received:', notification)
      // Refetch game data when notification arrives
      fetchAndUpdateBoard()
    }
  }, [notification, fetchAndUpdateBoard])

  const [moves, _setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const renderSquare = () => {
    // const _isBlack = color.toLowerCase() === 'b'

    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={color as Color} />
        </div>
        <ChessBoard boardData={board} />
        <div className="flex text-black">
          <Files color={color as Color} />
        </div>
      </div>
    )
  }

  const [open, setOpen] = React.useState(false)
  const [promoteData, setPromoteData] = React.useState<PromoteData>({
    from: '' as Square,
    to: '' as Square,
    piece: '' as Piece,
    show: false,
  })

  /* const appBackgrounds = {
    classicWood: '#f5f5dc', // Beige
    modernMinimalist: '#e0e0e0', // Light Silver
    forest: '#2e7d3217', // Dark Forest Green
    oceanBreeze: '#e0f7fa', // Light Cyan
    mutedPastel: '#fce4ec', // Soft Pink
    nightMode: '#121212', // Deep Charcoal
    desertSand: '#f4a460', // Sandy Brown
    softViolet: '#f8bbd0', // Light Pink
    default: '#ffebe84a',
    dark: '#151515',
  } */

  return (
    <div className="w-full min-h-full relative bg-[#0a0a0a]">
      <div className="w-full h-full absolute">
        <LeftSideMenu />
      </div>
      <Navbar />
      <div className="flex flex-col items-center justify-center p-3 h-full">
        <Modal select={open} unselect={() => setOpen(!open)}>
          <Settings />
        </Modal>
        {/* <div className="absolute left-0 w-full p-2 max-w-[1320px] flex items-center justify-between">
          <Navbar />
        </div> */}
        <div className="flex flex-col lg:flex-row gap-4 w-full justify-center items-center">
          <div className="flex w-full max-w-[720px] relative">
            {/* <div className="flex text-white w-full max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
              Opponent {opponentId}
            </div> */}
            <div className="w-full relative max-w-[720px] rounded-md">
              {renderSquare()}
            </div>
            {promoteData.show && (
              <div className="absolute w-full h-full flex justify-center items-center drop-shadow-2xl z-50 rounded-md">
                <PromotionCard
                  color="white"
                  promoteData={promoteData}
                  setPromoteData={setPromoteData}
                />
              </div>
            )}
            {/* <div className="flex w-full text-white max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
              Player {owner}
            </div> */}
          </div>

          <div className="w-full lg:w-[20%]">
            <RightSideMenu
              checkStatus={board.KingInCheck}
              player={board.player_turn || '-'} // Pass player info
              color={color}
              opponentId={opponentId}
              capturedPieces={capturedPieces}
              moves={moves}
              whiteTime={whiteTime}
              blackTime={blackTime}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBoard
