import Games from '../components/Games'
import Navbar from '../components/Navbar'
import LeaderBoard from './LeaderBoard'

export default function HomePage() {
  return (
    <div className="min-h-full w-full flex flex-col items-center text-white">
      <Navbar />
      <div className="w-full max-w-[1320px] gap-3 py-20 flex h-full justify-center">
        <div className="text-[120px] font-jolly relative text-balance font-medium tracking-normal leading-sung">
          Micro
          <p className="text-transparent inline bg-clip-text bg-gradient-to-r from-[#ff3636] to-[#F16C6A]">
            Chess
          </p>
          <p className="block">Play Fair, Play Secure, Play On-Chain</p>
        </div>
      </div>
      <Games />

      <div className="w-full h-full p-5 max-w-[1280px] text-slate-400 space-y-7 mt-10">
        <div className="text-center font-bold font-fira text-4xl">
          LeaderBoard
        </div>
        <LeaderBoard />
      </div>
    </div>
  )
}
