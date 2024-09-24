import { Color } from './types'

export default function Files({ color }: { color: Color }) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  if (color.toLowerCase() === 'black') {
    return (
      <div className="flex w-full absolute bottom-0 font-bold">
        {files.reverse().map((file) => (
          <div
            key={file}
            className="w-full p-1 text-end text-[8px] sm:text-[12px] md:text-lg"
          >
            {file}
          </div>
        ))}
      </div>
    )
  } else {
    return (
      <div className="flex w-full absolute -bottom-1 font-bold">
        {files.map((file) => (
          <div
            key={file}
            className="w-full p-1 text-end text-[8px] sm:text-[12px] md:text-lg"
          >
            {file}
          </div>
        ))}
      </div>
    )
  }
}
