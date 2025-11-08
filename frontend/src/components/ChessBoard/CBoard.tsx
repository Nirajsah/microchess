import React, { useEffect } from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { PromotionCard } from './PromotionCard'
import {
  BoardType,
  Color,
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
import {
  gameData,
  getGameChainInfo,
  getMvString,
  isGameChain,
  timer,
  makeMove,
  gameId,
} from './utils'
import { useMicroChess } from '@/context/MicroChessProvider'

const CBoard = () => {
  const [capturedPieces, _setCapturedPieces] = React.useState<string[]>([])
  const [_isGameChain, _setIsGameChain] = React.useState<boolean | null>(null) // null = not checked yet
  const [_assign, setAssign] = React.useState<{
    chainId: string
    timestamp: number
  } | null>(null)

  const { initBoard, isInitialized } = useChessWasm()
  const { userKey } = useMicroChess()
  const notification = useWalletNotifications()
  const [moves, _setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const [board, setBoard] = React.useState<BoardType>({
    position: {},
    KingInCheck: '',
    en_passant: '',
    player_turn: 'w',
    color: '' as Color,
    game_state: '',
    opponent: '',
    timer: {
      white: 900,
      black: 900,
    },
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
        const f = await gameId()
        console.log('friend id', f)
        const gameChain = JSON.parse(res.result).data.gameChain
        setAssign(gameChain)
      } catch (err) {
        console.error('Error fetching chain info:', err)
      }
    }

    // Only fetch if we know it's NOT a game chain
    if (_isGameChain === false) {
      fetchChainInfo()
    }
  }, [_isGameChain, !_assign])

  // Step 3: After chain is assigned, re-check if it's now a game chain
  useEffect(() => {
    if (!userKey) return

    const recheckGameChain = async () => {
      try {
        const res = await isGameChain()
        const check = JSON.parse(res.result).data.isGameChain
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
      return
    }

    try {
      const movesList = await getMvString()
      const mvList = JSON.parse(movesList.result).data.mvString
      console.log('movelist', mvList)
      _setMoves(mvList)

      const res = await gameData(userKey)
      const playerClock = await timer()
      console.log(playerClock)
      if (!res || !res.result) {
        throw new Error('No response from API')
      }

      const data = JSON.parse(res.result).data.gameData
      const { white, black } = JSON.parse(playerClock.result).data.timer

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
          timer: {
            white,
            black,
          },
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
        color: '' as Color,
        game_state: 'NotStarted',
        opponent: '',
        timer: {
          white: 900,
          black: 900,
        },
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
      fetchAndUpdateBoard()
    }
  }, [notification, _isGameChain, fetchAndUpdateBoard])

  const renderSquare = () => {
    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={board.color as Color} />
        </div>
        <ChessBoard boardData={board} makeMove={localMove} />
        <div className="flex text-black">
          <Files color={board.color as Color} />
        </div>
      </div>
    )
  }

  function localMove(selectedSquare: Square, to_square: Square, piece: Piece) {
    if (board.color === 'White' && piece.charAt(0) === 'b') return
    if (board.color === 'Black' && piece.charAt(0) === 'w') return
    if (board.player_turn !== piece.charAt(0)) return
    if (piece.charAt(0) === board.color) return

    if (
      (piece === 'bP' && getRank(to_square) === 1) ||
      (piece === 'wP' && getRank(to_square) === 8)
    ) {
      setPromoteData({
        from: selectedSquare,
        to: to_square,
        piece,
        show: true,
      })
      return
    }

    makeMove(selectedSquare, to_square, piece)

    setBoard((prevBoard: BoardType) => {
      const updatedPosition = { ...prevBoard.position }
      if (updatedPosition[to_square]) {
        delete updatedPosition[to_square]
      }
      delete updatedPosition[selectedSquare]
      updatedPosition[to_square] = piece

      return { ...prevBoard, position: updatedPosition }
    })
  }

  function getRank(square: Square): number {
    return parseInt(square.charAt(1))
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
          <div className="flex flex-col w-full max-w-[720px] relative">
            {board.opponent && (
              <div className="flex text-white w-full max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
                Opponent: {board.opponent}
              </div>
            )}
            <div className="w-full relative max-w-[720px] rounded-md">
              {renderSquare()}
            </div>
            {promoteData.show && (
              <div className="absolute w-full h-full flex justify-center items-center drop-shadow-2xl z-50 rounded-md">
                <PromotionCard
                  color={board.color as Color}
                  promoteData={promoteData}
                  setPromoteData={setPromoteData}
                />
              </div>
            )}
            {userKey && (
              <div className="flex w-full text-white max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
                Player: {userKey}
              </div>
            )}
          </div>

          <div className="w-full lg:w-[20%]">
            <RightSideMenu
              checkStatus={board.KingInCheck}
              player={board.player_turn || '-'} // Pass player info
              color={board.color as Color}
              game_state={board.game_state}
              opponentId={board.opponent}
              capturedPieces={capturedPieces}
              moves={moves}
              timer={board.timer}
              assign={_assign}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBoard
