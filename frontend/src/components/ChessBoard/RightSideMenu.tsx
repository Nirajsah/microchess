import { AlertCircle } from 'lucide-react'
import CapturedPieces from './CapturedPieces'
import Timer from './Timer'
import { Color } from './types'

interface Props {
  player: string
  color: Color
  moves: { white: string; black: string }[]
  capturedPieces: string[]
  checkStatus: string | null
  opponentId: string | null
  whiteTime: number
  blackTime: number
  startGame: () => void
}

export const RightSideMenu: React.FC<Props> = ({
  player,
  color,
  moves,
  capturedPieces,
  checkStatus,
  opponentId,
  whiteTime,
  blackTime,
  startGame,
}) => {
  return (
    <div className="w-full items-center justify-between flex flex-col gap-4 h-[720px]">
      <div className="py-4 text-3xl px-2 font-bold w-full border border-black">
        {/* {player} Plays */}
        Status:
      </div>

      <div className="w-full relative gap-2 flex flex-col">
        <div className="p-2 bg-[#000000] opacity-85 w-[130px] text-center text-2xl tracking-[4px] text-white">
          <Timer
            initialTime={color === 'b' ? blackTime : whiteTime}
            isActive={player === 'b'}
          />
        </div>
        <div className="w-full relative bg-[#F1F2F6]">
          <div className="w-full">
            <table className="w-full">
              <thead className="">
                <tr>
                  <th className="w-[33.3%] text-left p-2">Move</th>
                  <th className="w-[33.3%] text-center p-2">White</th>
                  <th className="w-[33.3%] text-right p-2">Black</th>
                </tr>
              </thead>
            </table>
            <div className="h-[250px] overflow-y-scroll scrollbar-hide flex flex-col-reverse">
              <table className="w-full">
                <tbody>
                  {moves.map((move, index) => (
                    <tr className="flex px-2 w-full" key={index}>
                      <td className="w-[33.3%]">{index + 1}</td>
                      <td className="w-[33.3%] text-center">
                        {move.white || ''}
                      </td>
                      <td className="w-[33.3%] text-end">{move.black || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="p-2 bg-[#000000] opacity-85 w-[130px] text-center text-2xl tracking-[4px] text-white">
          <Timer
            initialTime={color === 'w' ? whiteTime : blackTime}
            isActive={player === 'w'}
          />
        </div>
      </div>
      {checkStatus !== null && checkStatus === 'wK' && (
        <div className="flex items-center p-2 rounded-md bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">White King In Check</span>
        </div>
      )}
      {checkStatus !== null && checkStatus === 'bK' && (
        <div className="flex items-center p-2 rounded-md bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span className="text-sm">Black King In Check</span>
        </div>
      )}
      <div className="w-full">
        <h3 className="text-sm font-medium text-muted-foreground">
          Captured Pieces
        </h3>
        <div className="border border-black w-full">
          <div className="flex flex-wrap gap-2 p-2 bg-secondary/10 rounded-md">
            <CapturedPieces pieces={capturedPieces} />
          </div>
        </div>
      </div>
    </div>
  )
}
