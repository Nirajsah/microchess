import React, { useEffect } from 'react'
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
import { gameData, getGameChainInfo, isGameChain } from './utils'
import { useMicroChess } from '@/context/MicroChessProvider'

const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
// const fen = 'bnrqnbkr/pppppppp/5K2/8/8/8/PPPPPPPP/BNRQNB1R w - - 0 1'

const CBoard = () => {
  const [boardState, _setBoardState] = React.useState<Fen>(fen)
  const [capturedPieces, _setCapturedPieces] = React.useState<string[]>([])
  const [opponentId, _setOpponentId] = React.useState<string | null>(null)
  const [whiteTime, _setWhiteTime] = React.useState(900) // 15 minutes
  const [blackTime, _setBlackTime] = React.useState(900) // 15 minutes

  const [_isGameChain, _setIsGameChain] = React.useState<boolean | null>(null) // null = not checked yet
  const [_assign, setAssign] = React.useState<{
    chainId: string
    timestamp: number
  } | null>(null)

  const { initBoard, isInitialized } = useChessWasm()
  const { userKey } = useMicroChess()
  const notification = useWalletNotifications()

  const [board, setBoard] = React.useState<BoardType>({
    position: {},
    KingInCheck: '',
    en_passant: '',
    player_turn: 'w',
    color: '',
    game_state: '',
    opponent: '',
    winner: null,
  })

  // Step 1: Check if it's a game chain on mount
  useEffect(() => {
    const checkGameChain = async () => {
      try {
        const res = await isGameChain()
        const check = JSON.parse(res.result).data.isGameChain
        _setIsGameChain(check)
      } catch (err) {
        console.error('Error checking game chain:', err)
      }
    }

    checkGameChain()
  }, []) // Only run once on mount

  // Step 2: If not a game chain, fetch chain info
  useEffect(() => {
    const fetchChainInfo = async () => {
      try {
        const res = await getGameChainInfo()
        const gameChain = JSON.parse(res.result).data.gameChain
        console.log('Got chain info:', gameChain)
        setAssign(gameChain)
      } catch (err) {
        console.error('Error fetching chain info:', err)
      }
    }

    // Only fetch if we know it's NOT a game chain
    if (_isGameChain === false && !_assign) {
      fetchChainInfo()
    }
  }, [_isGameChain, _assign])

  // Step 3: After chain is assigned, re-check if it's now a game chain
  useEffect(() => {
    const recheckGameChain = async () => {
      try {
        const res = await isGameChain()
        const check = JSON.parse(res.result).data.isGameChain
        console.log('Rechecking game chain after assignment:', check)
        _setIsGameChain(check)
      } catch (err) {
        console.error('Error rechecking game chain:', err)
      }
    }

    // After assignment, recheck the chain status
    if (_assign && _isGameChain === false) {
      recheckGameChain()
    }
  }, []) // Run when assign changes

  // Step 4: Fetch game data function
  const fetchAndUpdateBoard = React.useCallback(async () => {
    if (!isInitialized || _isGameChain !== true) {
      console.log('Conditions not met for fetch:', {
        isInitialized,
        isGameChain,
      })
      return
    }

    try {
      const res = await gameData(userKey)
      if (!res || !res.result) {
        throw new Error('No response from API')
      }

      const data = JSON.parse(res.result).data.gameData
      const boardData = initBoard(data.fen)

      if (boardData) {
        setBoard({
          position: boardData.position,
          KingInCheck: boardData.king_in_check,
          en_passant: boardData.en_passant,
          player_turn: boardData.player_turn as PieceColor,
          color: data.color,
          game_state: data.gameState,
          opponent: data.opponent,
          winner: data.winner,
        })
      }
    } catch (error) {
      console.error('Error fetching game ', error)
    }
  }, [isInitialized, _isGameChain, userKey, initBoard])

  // Step 5: Initialize with default board and fetch when conditions are met
  React.useEffect(() => {
    // Always set default board on mount
    const defaultFen =
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    const defaultBoardData = initBoard(defaultFen)

    if (defaultBoardData) {
      setBoard({
        position: defaultBoardData.position,
        KingInCheck: defaultBoardData.king_in_check,
        en_passant: defaultBoardData.en_passant,
        player_turn: defaultBoardData.player_turn as PieceColor,
        color: 'white',
        game_state: 'active',
        opponent: '',
        winner: null,
      })
    }

    // Fetch actual data only when initialized AND confirmed game chain
    if (isInitialized && _isGameChain === true) {
      fetchAndUpdateBoard()
    }
  }, [isInitialized, _isGameChain, fetchAndUpdateBoard])

  // Step 6: Handle notifications
  React.useEffect(() => {
    if (notification && _isGameChain === true) {
      console.log('New notification received:', notification)
      fetchAndUpdateBoard()
    }
  }, [notification, _isGameChain, fetchAndUpdateBoard])

  const [moves, _setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const renderSquare = () => {
    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={board.color as Color} />
        </div>
        <ChessBoard boardData={board} />
        <div className="flex text-black">
          <Files color={board.color as Color} />
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
              color={board.color as Color}
              opponentId={opponentId}
              capturedPieces={capturedPieces}
              moves={moves}
              whiteTime={whiteTime}
              blackTime={blackTime}
              assign={_assign}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBoard
