import { AlertCircle } from 'lucide-react'
import CapturedPieces from './CapturedPieces'
import PlayButton from './PlayButton'

interface Props {
  player: string
  moves: { white: string; black: string }[]
  capturedPieces: string[]
  checkStatus: string | null
  opponentId: string | null
  startGame: () => void
}

export const RightSideMenu: React.FC<Props> = ({
  player,
  moves,
  capturedPieces,
  checkStatus,
  opponentId,
  startGame,
}) => {
  return (
    <div className="w-full items-center font-sans flex flex-col gap-4 rounded-lg">
      <div className="bg-white py-5 px-2 font-bold rounded-lg w-full border border-black card relative">
        {player} Plays
      </div>

      <div className="w-full border border-black rounded-lg card relative bg-white">
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
      {!opponentId && (
        <div className="w-full h-[70px] card relative">
          <PlayButton startGame={startGame} />
        </div>
      )}
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

      <div className="card relative bg-white border border-black rounded-lg w-full">
        <div className="flex flex-wrap gap-2 p-2 bg-secondary/10 rounded-md">
          <CapturedPieces pieces={capturedPieces} />
        </div>
      </div>
    </div>
  )
}
