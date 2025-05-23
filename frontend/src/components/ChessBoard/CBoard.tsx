import React from 'react'
import Ranks from './Ranks'
import Files from './Files'
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client'
import {
  GAME_DATA,
  GET_CAPTURED_PIECES,
  NEW_GAME,
  NOTIFICATIONS,
  TIME_LEFT,
} from '../../GraphQL/queries'
// import Board from './Board'
import { PromotionCard } from './PromotionCard'
import { BoardType, Color, Fen, PromoteData } from './types'
import { RightSideMenu } from './RightSideMenu'
import { fen_to_board } from 'wasm'
import ChessBoard from './ChessBoard'
import Modal from '../Modal'
import Settings from '../Settings'
import Navbar from './Navbar'

// const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
const fen = 'rnbqkbnr/pppppppp/8/BB6/3PPPP1/N2Q3N/PPP4P/R3K2R - KQkq - - 0 1'
type Player = 'w' | 'b' | '-'

const CBoard = () => {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const owner = window.sessionStorage.getItem('owner') ?? ''
  const [player, setPlayer] = React.useState<Player>('-')
  const [boardState, setBoardState] = React.useState<Fen>(fen)
  const [color, setColor] = React.useState<Color>('w')
  const [capturedPieces, setCapturedPieces] = React.useState<string[]>([])
  const [opponentId, setOpponentId] = React.useState<string | null>(null)
  const [play] = useMutation(NEW_GAME)
  const [whiteTime, setWhiteTime] = React.useState(900) // 15 minutes
  const [blackTime, setBlackTime] = React.useState(900) // 15 minutes

  const [gameData, { called: callGameData }] = useLazyQuery(GAME_DATA, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
      player: owner,
    },
    onCompleted: (data) => {
      setBoardState(data.gameData.board)
      setPlayer(data.gameData.playerTurn)
      setColor(data.gameData.player)
      setMoves(data.gameData.moves)
      setOpponentId(data.gameData.opponent)
    },
    onError: (error) => {
      console.log('Error: ', error)
    },
    fetchPolicy: 'network-only',
  })

  const [timeQuery] = useLazyQuery(TIME_LEFT, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      setWhiteTime(data.timeLeft.white)
      setBlackTime(data.timeLeft.black)
    },
    fetchPolicy: 'network-only',
  })

  const [capturedPiecesQuery] = useLazyQuery(GET_CAPTURED_PIECES, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      setCapturedPieces(data.capturedPieces)
    },
    fetchPolicy: 'network-only',
  })

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => {
      gameData()
      capturedPiecesQuery()
      timeQuery()
    },
  })

  if (!callGameData) {
    gameData()
    capturedPiecesQuery()
    timeQuery()
  }

  async function startGame() {
    await play({
      variables: {
        player: owner,
        endpoint: 'chess',
        chainId: chainId,
      },
    })
  }

  const [board, setBoard] = React.useState<BoardType>(() => {
    let obj = fen_to_board(boardState)
    setPlayer(obj.player_turn)
    return {
      position: obj.position,
      KingInCheck: obj.king_in_check,
      whiteCastle: obj.white_c,
      blackCastle: obj.black_c,
      en_passant: obj.en_passant,
    }
  })

  // Use useEffect to update the boards when boardState changes
  React.useEffect(() => {
    let obj = fen_to_board(boardState)
    setBoard({
      position: obj.position,
      KingInCheck: obj.king_in_check,
      whiteCastle: obj.white_c,
      blackCastle: obj.black_c,
      en_passant: obj.en_passant,
    })
    setPlayer(obj.player_turn)
  }, [boardState])

  const [moves, setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([])

  const renderSquare = () => {
    const isBlack = color.toLowerCase() === 'b'

    return (
      <div className="w-full chess-board">
        <div className="h-[12.5%] z-50 absolute text-black">
          <Ranks color={color as Color} />
        </div>
        {/* <Board
          boardData={board}
          isBlack={isBlack}
          color={color as Color}
          player={player as Color}
          setBoard={setBoard}
          setPromoteData={setPromoteData}
        /> */}
        <ChessBoard boardData={board} />
        <div className="flex text-black">
          <Files color={color as Color} />
        </div>
      </div>
    )
  }

  const [open, setOpen] = React.useState(false)
  const [promoteData, setPromoteData] = React.useState<PromoteData>({
    from: '',
    to: '',
    piece: '',
    show: false,
  })

  const appBackgrounds = {
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
  }

  return (
    <div className="w-full min-h-full relative">
      <Navbar />
      <div className="flex flex-col items-center justify-center p-3">
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

          <div className="w-full lg:w-[30%]">
            <RightSideMenu
              checkStatus={board.KingInCheck}
              player={player}
              color={color}
              opponentId={opponentId}
              capturedPieces={capturedPieces}
              moves={moves}
              whiteTime={whiteTime}
              blackTime={blackTime}
              startGame={startGame}
              key={chainId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default CBoard
