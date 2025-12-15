import { Link } from 'react-router-dom'

export type MatchHistory = {
  player1Id: string
  player1Name: string | null
  player2Id: string
  player2Name: string | null
  blobHash: string
}

export default function Matches({ matches }: { matches: MatchHistory[] }) {
  return (
    <div className="w-full h-full gap-3 flex flex-col p-4 md:p-6 max-w-5xl">
      <div className="text-4xl text-center">Matches Played</div>
      <div className="text-xs mb-1 text-end md:text-sm font-semibold text-gray-200">
        Total Matches: {matches.length}
      </div>
      <div className="flex-1 overflow-y-auto max-h-[600px]">
        {matches.map((match: MatchHistory) => (
          <Link
            key={match.blobHash}
            to={`/replay/${match.blobHash}`}
            className="cursor-pointer border border-[#212121] rounded-xl p-3 md:p-4 mb-3 md:mb-4 last:mb-0 flex flex-col md:flex-row md:items-center justify-between"
          >
            <div className="w-full lg:w-[260px] truncate text-xs md:text-base text-gray-300 md:mb-0">
              {match.player1Name ? match.player1Name : match.player1Id}
            </div>
            <div className="text-sm md:text-base font-semibold text-gray-100 min-w-[40px] text-center">
              VS
            </div>
            <div className="w-full lg:w-[260px] truncate text-xs md:text-base text-gray-300 text-right">
              {match.player2Name ? match.player2Name : match.player2Id}
            </div>
          </Link>
        ))}

        {matches && matches.length === 0 && (
          <div className="flex justify-center py-8">
            <div className="text-sm text-gray-500">No Matches...</div>
          </div>
        )}
      </div>
    </div>
  )
}
