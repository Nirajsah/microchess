import { Color } from './types'

export default function Ranks({ color }: { color: Color }) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  if (color.toLowerCase() === 'white') {
    return (
      <div className="absolute h-full">
        {ranks.map((rank) => (
          <div
            key={rank}
            className="h-full p-1 font-bold flex text-[8px] sm:text-[12px] md:text-lg justify-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div className="absolute h-full">
        {ranks.reverse().map((rank) => (
          <div
            key={rank}
            className="h-full p-1 font-bold flex text-[8px] sm:text-[12px] md:text-lg justify-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  }
}
