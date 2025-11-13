type Player = {
  id: string // Public key
  name: string
  rank: number
  elo: number
  matches: number
  wins: number
  losses: number
  avatarUrl?: string // optional
  countryCode?: string // optional, ISO format ("US", "IN", etc.)
}

const NewPlayerData: Player[] = [
  {
    id: 'player1',
    rank: 1,
    name: 'Eren Yeager',
    elo: 2700,
    matches: 130,
    wins: 85,
    losses: 45,
    countryCode: 'JP',
    avatarUrl: '/avatars/eren.png',
  },

  {
    id: 'player2',
    rank: 2,
    name: 'Luffy',
    elo: 2785,
    matches: 130,
    wins: 110,
    losses: 20,
    countryCode: 'JP',
    avatarUrl: '/avatars/luffy.png',
  },
  {
    id: 'player3',
    rank: 3,
    name: 'Naruto Uzumaki',
    elo: 2775,
    matches: 130,
    wins: 105,
    losses: 25,
    countryCode: 'JP',
    avatarUrl: '/avatars/naruto.png',
  },
  {
    id: 'player4',
    rank: 4,
    name: 'Saitama',
    elo: 2760,
    matches: 130,
    wins: 100,
    losses: 30,
    countryCode: 'JP',
    avatarUrl: '/avatars/saitama.png',
  },
  {
    id: 'player5',
    rank: 5,
    name: 'Light Yagami',
    elo: 2750,
    matches: 130,
    wins: 98,
    losses: 32,
    countryCode: 'JP',
    avatarUrl: '/avatars/light.png',
  },
  {
    id: 'player6',
    rank: 6,
    name: 'Levi Ackerman',
    elo: 2740,
    matches: 130,
    wins: 95,
    losses: 35,
    countryCode: 'JP',
    avatarUrl: '/avatars/levi.png',
  },
  {
    id: 'player7',
    rank: 7,
    name: 'Roronoa Zoro',
    elo: 2730,
    matches: 130,
    wins: 92,
    losses: 38,
    countryCode: 'JP',
    avatarUrl: '/avatars/zoro.png',
  },
  {
    id: 'player8',
    rank: 8,
    name: 'Shoto Todoroki',
    elo: 2720,
    matches: 130,
    wins: 90,
    losses: 40,
    countryCode: 'JP',
    avatarUrl: '/avatars/todoroki.png',
  },
  {
    id: 'player9',
    rank: 9,
    name: 'Tanjiro Kamado',
    elo: 2710,
    matches: 130,
    wins: 88,
    losses: 42,
    countryCode: 'JP',
    avatarUrl: '/avatars/tanjiro.png',
  },
  {
    id: 'player10',
    rank: 10,
    name: 'Goku',
    elo: 2850,
    matches: 135,
    wins: 120,
    losses: 15,
    countryCode: 'JP',
    avatarUrl: '/avatars/goku.png',
  },
]

const PlayerStats = ({ playerData }: { playerData: Player }) => {
  return (
    <div
      style={{
        transform: 'skew(-20deg)',
      }}
      className={`flex items-center py-2 px-3 rounded-lg border border-[#ffffff24] ${
        (playerData.rank === 1 && 'border-orange-400') ||
        (playerData.rank === 2 && 'border-red-400') ||
        (playerData.rank === 3 && 'border-purple-400')
      }`}
    >
      <span className="w-[50px] md:w-[60px] lg:w-[70px] text-sm md:tex-xl lg:text-2xl">
        {playerData.rank}
      </span>
      <div className="flex justify-between w-full">
        <span className="w-full max-w-[680px] text-sm md:tex-xl lg:text-2xl">
          {playerData.name}
        </span>
        <div className="w-full max-w-[140px] flex justify-end">
          <span className="text-sm md:tex-xl lg:text-2xl">
            {playerData.matches}
          </span>
        </div>
        <div className="w-full hidden max-w-[140px] md:flex justify-end">
          <span className="text-sm md:tex-xl lg:text-2xl">
            {playerData.wins}
          </span>
        </div>
        <div className="w-full hidden max-w-[140px] md:flex justify-end">
          <span className="text-sm md:tex-xl lg:text-2xl">
            {playerData.losses}
          </span>
        </div>
        <div className="w-full max-w-[140px] flex justify-end">
          <span className="text-sm md:tex-xl lg:text-2xl">
            {playerData.elo}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function LeaderBoard() {
  return (
    <div className="max-w-[1280px] mt-8 p-5 text-sm rounded-xl w-full h-full space-y-10">
      {/** Will be used later */}
      {/* <div className="w-full h-[300px] flex gap-5 justify-center">
        <div className="border w-full max-w-[150px]"></div>
        <div className="border w-full max-w-[150px]"></div>
        <div className="border w-full max-w-[150px]"></div>
      </div> */}
      <div className="text-center text-[40px] lg:text-[60px] my-10">
        LeaderBoard
      </div>
      <div className="">
        <div className="w-full flex justify-between px-2 hero-background-circle">
          <span className="w-[50px] md:w-[60px] lg:w-[70px] text-xs md:text-sm">
            Rank
          </span>
          <div className="flex justify-between w-full">
            <span className="w-full max-w-[680px] text-xs md:text-sm">
              Player
            </span>
            <div className="w-full max-w-[140px] flex justify-end">
              <span className="text-xs md:text-sm">Matches</span>
            </div>
            <div className="w-full hidden max-w-[140px] md:flex justify-end">
              <span className="text-xs md:text-sm">Wins</span>
            </div>
            <div className="w-full hidden max-w-[140px] md:flex justify-end">
              <span className="text-xs md:text-sm">Losses</span>
            </div>
            <div className="w-full max-w-[140px] flex justify-end">
              <span className="text-xs md:text-sm">Elo Points</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 text-2xl mt-1 flex-col rounded-lg">
          {NewPlayerData.map((player) => (
            <PlayerStats key={player.rank} playerData={player} />
          ))}
        </div>
      </div>
    </div>
  )
}
