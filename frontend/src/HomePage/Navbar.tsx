export default function Navbar() {
  return (
    <div className="flex justify-center items-center w-16 rounded-full bg-[#000000] opacity-85 min-h-[800px]">
      <div
        className="flex min-h-[800px] justify-between items-center py-2"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        <div className="flex gap-2 items-center">
          <div className="bg-white rounded-full w-12 h-12"></div>
          <div className="text-white text-2xl">MicroChess</div>
        </div>
        <div className="flex gap-2 items-center">
          <div className="text-white text-lg">Hello</div>
          <div className="bg-white rounded-full w-12 h-12"></div>
        </div>
      </div>
    </div>
  )
}
