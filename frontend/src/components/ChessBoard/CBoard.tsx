import React from "react";
import Ranks from "./Ranks";
import Files from "./Files";
import { useLazyQuery, useMutation, useSubscription } from "@apollo/client";
import {
  GAME_DATA,
  GET_CAPTURED_PIECES,
  NEW_GAME,
  NOTIFICATIONS,
  TIME_LEFT,
} from "../../GraphQL/queries";
import Board from "./Board";
import { Link } from "react-router-dom";
import Timer from "./Timer";
import Modal from "../Modal";
import { Welcome } from "../popup/Welcome";
import { LeftSideMenu } from "./LeftSideMenu";
import { PromotionCard } from "./PromotionCard";
import { BoardType, Color, Fen, PromoteData, SquareToPieceMap } from "./types";
import { RightSideMenu } from "./RightSideMenu";

const COLUMNS = "abcdefgh".split("");

const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function fenToPieceCode(piece: any) {
  // black piece
  if (piece.toLowerCase() === piece) {
    return "b" + piece.toUpperCase();
  }

  // white piece
  return "w" + piece.toUpperCase();
}

// we need to return castling rights as well
function fenToObj(fen: string): {
  position: SquareToPieceMap;
  KingInCheck: string | null;
} {
  // cut off any move, castling, etc info from the end
  // we're only interested in position information
  const FEN = fen.replace(/ .+$/, "");
  const rows = FEN.split("/");
  const position: any = {};
  const check = fen.split(";");
  const castling = fen.split("");

  let currentRow = 8;
  for (let i = 0; i < 8; i++) {
    const row = rows[i].split("");
    let colIdx = 0;

    // loop through each character in the FEN section
    for (let j = 0; j < row.length; j++) {
      // number / empty squares
      if (row[j].search(/[1-8]/) !== -1) {
        const numEmptySquares = Number.parseInt(row[j], 10);
        colIdx = colIdx + numEmptySquares;
      } else {
        // piece
        const square = COLUMNS[colIdx] + currentRow;
        position[square] = fenToPieceCode(row[j]);
        colIdx = colIdx + 1;
      }
    }

    currentRow = currentRow - 1;
  }
  // The last part contains the check status
  let KingInCheck: string | null = null;

  if (check.length > 1) {
    KingInCheck = check[1].trim();
    KingInCheck; // 'bK' or any other status
  }

  return {
    position,
    KingInCheck,
  };
}

const CBoard = () => {
  const chainId = window.sessionStorage.getItem("chainId") ?? "";
  const owner = window.sessionStorage.getItem("owner") ?? "";
  const [player, setPlayer] = React.useState("");
  const [boardState, setBoardState] = React.useState<Fen>(fen);
  const [color, setColor] = React.useState<Color>("WHITE");
  const [capturedPieces, setCapturedPieces] = React.useState<string[]>([]);
  const [opponentId, setOpponentId] = React.useState<string | null>(null);
  const [play] = useMutation(NEW_GAME);
  const [whiteTime, setWhiteTime] = React.useState(0); // 15 minutes
  const [blackTime, setBlackTime] = React.useState(0); // 15 minutes

  const [gameData, { called: callGameData }] = useLazyQuery(GAME_DATA, {
    variables: {
      endpoint: "chess",
      chainId: chainId,
      player: owner,
    },
    onCompleted: (data) => {
      setBoardState(data.gameData.board);
      setPlayer(data.gameData.playerTurn);
      setColor(data.gameData.player);
      setMoves(data.gameData.moves);
      setOpponentId(data.gameData.opponent);
    },
    onError: (error) => {
      console.log("Error: ", error);
    },
    fetchPolicy: "network-only",
  });

  const [timeQuery] = useLazyQuery(TIME_LEFT, {
    variables: {
      endpoint: "chess",
      chainId: chainId,
    },
    onCompleted: (data) => {
      setWhiteTime(data.timeLeft.white);
      setBlackTime(data.timeLeft.black);
    },
    fetchPolicy: "network-only",
  });

  const [capturedPiecesQuery] = useLazyQuery(GET_CAPTURED_PIECES, {
    variables: {
      endpoint: "chess",
      chainId: chainId,
    },
    onCompleted: (data) => {
      setCapturedPieces(data.capturedPieces);
    },
    fetchPolicy: "network-only",
  });

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => {
      gameData();
      capturedPiecesQuery();
      timeQuery();
    },
  });

  if (!callGameData) {
    gameData();
    capturedPiecesQuery();
    timeQuery();
  }

  async function startGame() {
    await play({
      variables: {
        player: owner,
        endpoint: "chess",
        chainId: chainId,
      },
    });
  }

  const [board, setBoard] = React.useState<BoardType>(() => {
    let obj = fenToObj(boardState);
    return {
      position: obj.position,
      KingInCheck: obj.KingInCheck,
      whiteCastle: false,
      blackCastle: false,
      en_passant: "e3",
    };
  });

  // Use useEffect to update the boards when boardState changes
  React.useEffect(() => {
    let obj = fenToObj(boardState);
    setBoard({
      position: obj.position,
      KingInCheck: obj.KingInCheck,
      whiteCastle: false,
      blackCastle: false,
      en_passant: "e3",
    });
  }, [boardState]);

  const [moves, setMoves] = React.useState<
    Array<{ white: string; black: string }>
  >([]);

  const renderSquare = () => {
    const isBlack = color.toLowerCase() === "black";

    return (
      <div className="w-full">
        <div className="h-[12.5%] z-50 absolute">
          <Ranks color={color as Color} />
        </div>
        <Board
          boardData={board}
          isBlack={isBlack}
          color={color as Color}
          player={player as Color}
          setBoard={setBoard}
          setPromoteData={setPromoteData}
        />
        <div className="flex">
          <Files color={color as Color} />
        </div>
      </div>
    );
  };

  const [open, setOpen] = React.useState(true);
  const [promoteData, setPromoteData] = React.useState<PromoteData>({
    from: "",
    to: "",
    piece: "",
    show: false,
  });

  const appBackgrounds = {
    classicWood: "#f5f5dc", // Beige
    modernMinimalist: "#e0e0e0", // Light Silver
    forest: "#2e7d3217", // Dark Forest Green
    oceanBreeze: "#e0f7fa", // Light Cyan
    mutedPastel: "#fce4ec", // Soft Pink
    nightMode: "#121212", // Deep Charcoal
    desertSand: "#f4a460", // Sandy Brown
    softViolet: "#f8bbd0", // Light Pink
    default: "#ffebe84a",
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: appBackgrounds.forest,
      }}
      className="w-full min-h-screen p-3 font-fira"
    >
      <div className="flex flex-col items-center justify-center">
        <Modal select={open} unselect={() => setOpen(!open)}>
          <Welcome />
        </Modal>
        <div className="absolute top-0 w-full p-2 max-w-[1320px] flex items-center justify-between">
          <Link
            to="/"
            className="text-2xl text-white tracking-wide font-semibold"
          >
            MicroChess
          </Link>
          <div>
            <LeftSideMenu />
          </div>
        </div>
        <div className="flex flex-col lg:flex-row mt-6 gap-4 w-full max-w-[1080px]">
          <div className="flex flex-col w-full max-w-[720px] relative">
            <div className="flex text-white w-full max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
              Opponent {opponentId}
              <Timer
                initialTimeMs={color === "BLACK" ? blackTime : whiteTime}
                start
              />
            </div>
            <div className="w-full relative max-w-[720px] h-full bg-white rounded-md">
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
            <div className="flex w-full text-white max-w-[720px] justify-between my-2 text-sm font-semibold font-sans">
              Player {owner}
              <Timer
                initialTimeMs={color === "WHITE" ? whiteTime : blackTime}
                start
              />
            </div>
          </div>

          <div className="w-full mt-4 md:mt-8">
            <RightSideMenu
              checkStatus={board.KingInCheck}
              player={player}
              opponentId={opponentId}
              capturedPieces={capturedPieces}
              moves={moves}
              startGame={startGame}
              key={chainId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CBoard;
