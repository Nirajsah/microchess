import { useMicroChess } from '../context/MicroChessProvider'
import { type LineraRequest, lineraRequest } from '../linera'

export default function Navbar() {
  // const request: LineraRequest = {
  //   method: 'agjeaog',
  //   params: 'ageag',
  // }

  // async function calla() {
  //   await lineraRequest(request)
  // }

  return (
    <div className="fixed z-20 bg-transparent backdrop-blur-lg w-full gap-2 px-3 py-2 lg:h-[80px] lg:px-14 lg:py-6 flex items-center justify-between max-w-[1440px]">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>
      <div className="text-lg rounded-3xl px-4 py-2 flex justify-center items-center hover:bg-[#0a0a0a] hover:scale-105 transition-all duration-300">
        <button>Connect</button>
      </div>
    </div>
  )
}
