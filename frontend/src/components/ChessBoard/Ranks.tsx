export default function Ranks({ color }: { color: string }) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  if (color.toLowerCase() === 'white') {
    return (
      <div className="absolute">
        {ranks.map((rank) => (
          <div
            key={rank}
            className="h-[90px] p-1 font-bold flex justify-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div className="absolute">
        {ranks.reverse().map((rank) => (
          <div
            key={rank}
            className="h-[90px] p-1 font-bold flex justify-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  }
}
