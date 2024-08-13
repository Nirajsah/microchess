export default function Files({ color }: { color: string }) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  if (color.toLowerCase() === 'black') {
    return (
      <div className="flex">
        {files.reverse().map((file) => (
          <div
            key={file}
            className="w-[100px] p-1 flex justify-center items-center"
          >
            {file}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div className="flex">
        {files.map((file) => (
          <div
            key={file}
            className="w-[100px] p-1 flex justify-center items-center"
          >
            {file}
          </div>
        ))}
      </div>
    )
  }
}
