interface PlayerDataInterface {
  rank: number
  name: string
  wins: number
  losses: number
  winRate: string
}

const PlayerStats = ({ playerData }: { playerData: PlayerDataInterface }) => {
  return (
    <div className="flex rounded-md px-2 py-2">
      <span className="w-[150px]">{playerData.rank}</span>
      <div className="flex justify-between w-full">
        <span className="w-[260px]">{playerData.name}</span>
        <span className="w-[100px] text-center">{playerData.wins}</span>
        <span className="w-[100px] text-center">{playerData.losses}</span>
        <span className="w-[100px] text-end">{playerData.winRate}</span>
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
]

export default function LeaderBoard() {
  return (
    <div className="font-fira text-sm p-2 space-y-3 card-border rounded-xl w-full h-full">
      <div className="w-full flex justify-between">
        <span className="w-[170px]">Rank</span>
        <div className="flex justify-between w-full">
          <span className="w-[260px]">Player</span>
          <span className="w-[60px] text-center">Wins</span>
          <span className="w-[100px] text-center">Losses</span>
          <span className="w-[100px] text-end">Win Rate</span>
        </div>
      </div>
      <div className="gap-1 flex relative flex-col rounded-lg p-1 card-box h-[300px]">
        {PlayerData.map((player) => (
          <PlayerStats key={player.rank} playerData={player} />
        ))}
      </div>
    </div>
  )
}
