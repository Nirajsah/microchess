export default function Ranks({ color }: { color: string }) {
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1']
  if (color.toLowerCase() === 'white') {
    return (
      <div>
        {ranks.map((rank) => (
          <div
            key={rank}
            className="h-[100px] p-2 flex justify-center items-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div>
        {ranks.reverse().map((rank) => (
          <div
            key={rank}
            className="h-[100px] p-2 flex justify-center items-center"
          >
            {rank}
          </div>
        ))}
      </div>
    )
  }
}
