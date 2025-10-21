import { Color } from './types'

export default function Ranks({ color }: { color: Color }) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  const ranks_ = (color.toLowerCase() === 'b') ? ranks.reverse() : ranks

  return (
    <div className="absolute h-full">
      {ranks_.map((rank) => (
        <div
          key={rank}
          className="h-full p-1 flex text-[8px] sm:text-[10px] md:text-lg justify-center"
        >
          {rank}
        </div>
      ))}
    </div>
  )
}
