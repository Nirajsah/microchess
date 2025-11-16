type Player = {
  id: string
  name: string
  elo: number
  matches: number
  won: number
  lost: number
}

const PlayerStats = ({
  playerData,
  index,
}: {
  playerData: Player
  index: number
}) => {
  return (
    <div
      style={{
        transform: 'skew(-20deg)',
      }}
      className={`flex items-center py-2 px-3 rounded-lg border border-[#ffffff24] ${
        (index === 1 && 'border-orange-400') ||
        (index === 2 && 'border-red-400') ||
        (index === 3 && 'border-purple-400')
      }`}
    >
      <span className="w-[50px] md:w-[60px] lg:w-[70px] text-sm md:text-xl lg:text-2xl">
        {index}
      </span>
      <div className="flex justify-between w-full items-center">
        <span className="w-full truncate max-w-[200px] md:max-w-[680px] text-xs md:text-sm lg:text-lg">
          {playerData.name ? playerData.name : playerData.id}
        </span>
        <div className="w-full hidden max-w-[120px] sm:flex justify-end">
          <span className="text-xs md:text-sm lg:text-lg">
            {playerData.matches}
          </span>
        </div>
        <div className="w-full hidden max-w-[120px] lg:flex justify-end">
          <span className="text-xs md:text-sm lg:text-lg">
            {playerData.won}
          </span>
        </div>
        <div className="w-full hidden max-w-[120px] lg:flex justify-end">
          <span className="text-xs md:text-sm lg:text-lg">
            {playerData.lost}
          </span>
        </div>
        <div className="w-full max-w-[20px] md:max-w-[120px] flex justify-end">
          <span className="text-xs md:text-sm lg:text-lg">
            {playerData.elo}
          </span>
        </div>
      </div>
    </div>
  )
}

type LeaderBoard = {
  id: string
  name: string
  elo: number
  matches: number
  won: number
  lost: number
}

export default function LeaderBoard({
  leaderboard,
}: {
  leaderboard: LeaderBoard[]
}) {
  return (
    <div className="max-w-[1280px] mt-8 p-5 text-sm rounded-xl w-full h-full space-y-10">
      <div className="text-center text-[40px] lg:text-[60px] my-10">
        LeaderBoard
      </div>
      <div className="">
        {/* Header row - NOW MATCHES DATA ROW PADDING */}
        <div className="w-full flex items-center px-3 pb-2">
          <span className="w-[50px] md:w-[60px] lg:w-[70px] text-xs md:text-sm">
            Rank
          </span>
          <div className="flex justify-between w-full">
            <span className="w-full max-w-[680px] text-xs md:text-sm">
              Player
            </span>
            <div className="w-full hidden max-w-[120px] sm:flex justify-end">
              <span className="text-xs md:text-sm">Matches</span>
            </div>
            <div className="w-full hidden max-w-[120px] lg:flex justify-end">
              <span className="text-xs md:text-sm">Wins</span>
            </div>
            <div className="w-full hidden max-w-[120px] lg:flex justify-end">
              <span className="text-xs md:text-sm">Losses</span>
            </div>
            <div className="w-full max-w-[120px] flex justify-end">
              <span className="text-xs md:text-sm">Elo Points</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-2xl mt-1 flex-col rounded-lg">
          {leaderboard.map((player, index) => (
            <PlayerStats key={index} playerData={player} index={index + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
