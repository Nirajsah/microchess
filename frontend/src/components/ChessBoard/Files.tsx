import { Color } from './types'

export default function Files({ color }: { color: Color }) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
  const files_ = color.toLowerCase() === 'black' ? files.reverse() : files

  return (
    <div className="flex w-full absolute -bottom-1">
      {files_.map((file) => (
        <div
          key={file}
          className="w-full p-1 text-end text-[8px] sm:text-[10px] md:text-[14px]"
        >
          {file}
        </div>
      ))}
    </div>
  )
}
