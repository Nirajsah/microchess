export default function Files({ color }: { color: string }) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  if (color.toLowerCase() === 'black') {
    return (
      <div className="flex absolute bottom-10 font-bold">
        {files.reverse().map((file) => (
          <div key={file} className="w-[90px] p-1 text-end">
            {file}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div className="flex absolute bottom-10 font-bold">
        {files.map((file) => (
          <div key={file} className="w-[90px] p-1 text-end">
            {file}
          </div>
        ))}
      </div>
    )
  }
}
