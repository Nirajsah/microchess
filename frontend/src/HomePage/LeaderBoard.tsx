interface PlayerDataInterface {
  rank: number
  name: string
  wins: number
  losses: number
  winRate: string
}

const PlayerStats = ({ playerData }: { playerData: PlayerDataInterface }) => {
  return (
    <div
      style={{
        transform: 'skew(-20deg)',
      }}
      className={`flex py-2 px-3 rounded-lg border-2 ${
        (playerData.rank === 1 && 'border-orange-400') ||
        (playerData.rank === 2 && 'border-red-400') ||
        (playerData.rank === 3 && 'border-purple-400')
      }  `}
    >
      <span className="w-[158px]">{playerData.rank}</span>
      <div className="flex w-full justify-between">
        <span className="">{playerData.name}</span>
        <div className="w-full max-w-[700px] grid grid-cols-4">
          <span className="place-self-end">{playerData.wins}</span>
          <span className="place-self-end">{playerData.losses}</span>
          <span className="place-self-end">{playerData.wins}</span>
          <span className="place-self-end">{playerData.winRate}</span>
        </div>
      </div>
    </div>
  )
}

const PlayerData = [
  {
    rank: 1,
    name: 'Player 1',
    wins: 10,
    losses: 5,
    winRate: '66.6%',
  },
  {
    rank: 2,
    name: 'Player 2',
    wins: 5,
    losses: 10,
    winRate: '33.3%',
  },
  {
    rank: 3,
    name: 'Player 2',
    wins: 5,
    losses: 10,
    winRate: '33.3%',
  },
]

export default function LeaderBoard() {
  return (
    <div className="max-w-[1280px] mt-8 p-3 text-sm rounded-xl w-full h-full">
      <div className="w-full flex justify-between px-2 hero-background-circle">
        <span className="w-[165px]">Rank</span>
        <div className="flex justify-between w-full">
          <span className="w-[260px]">Player</span>
          <div className="w-full max-w-[700px] grid grid-cols-4">
            <span className="place-self-end">Wins</span>
            <span className="place-self-end">Losses</span>
            <span className="place-self-end">Draws</span>
            <span className="place-self-end">Win Rate</span>
          </div>
        </div>
      </div>
      <div className="flex gap-2 text-2xl mt-1 relative flex-col rounded-lg h-[300px]">
        {PlayerData.map((player) => (
          <PlayerStats key={player.rank} playerData={player} />
        ))}
      </div>
    </div>
  )
}
