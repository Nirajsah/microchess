import { BackgroundBeams } from '@/components/ui/background-beams'

function BackgroundBeamsDemo() {
  return (
    <div className="h-full w-full rounded-xl relative flex flex-col items-center justify-center antialiased">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="relative z-10 text-md md:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-[#ffffff9e] to-[#ffffff38] text-center font-sans font-bold">
          Built on Linera
        </h1>
        <p className="bg-clip-text bg-gradient-to-b from-[#ffffff9e] to-[#ffffff38] text-transparent mt-4 max-w-lg mx-auto my-2 text-lg text-center relative z-10">
          Linera brings real‑time responsiveness and parallel processing to
          fully on‑chain Gaming
        </p>
      </div>
      <BackgroundBeams />
    </div>
  )
}

export { BackgroundBeamsDemo }
