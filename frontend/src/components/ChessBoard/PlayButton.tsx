import { ArrowRight } from 'lucide-react'

export default function PlayButton({ startGame }: { startGame: () => void }) {
  return (
    <button
      onClick={(event) => {
        event.preventDefault()
        startGame()
      }}
      className="group flex h-full w-full items-center justify-between border-2 border-black bg-gradient-to-r from-[#121624] to-[#121b1a] px-8 text-xl font-semibold transition-all duration-300 ease-in-out hover:-translate-y-1 hover:translate-x-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
    >
      <span className="relative overflow-hidden flex items-center w-40">
        <span className="inline-block transition-transform duration-300 transform group-hover:-translate-y-full">
          Play Now!
        </span>
        <span className="absolute flex transition-transform duration-300 transform translate-y-full group-hover:translate-y-0">
          Start Game!
        </span>
      </span>

      <div className="pointer-events-none flex h-6 w-6 overflow-hidden text-2xl">
        <ArrowRight className="shrink-0 -translate-x-full text-red-500 transition-transform duration-300 group-hover:translate-x-0" />
        <ArrowRight className="shrink-0 -translate-x-full transition-transform duration-300 group-hover:translate-x-0" />
      </div>
    </button>
  )
}
