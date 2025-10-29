export default function Footer() {
  return (
    <footer className="w-full min-h-full border-t border-neutral-700 relative overflow-hidden">
      {/* SVG Background Accent */}
      <div className="absolute right-0 top-0 h-full w-1/2 pointer-events-none opacity-20">
        <svg
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full animate-spin-slow"
        >
          <path
            fill="#4ade80"
            d="M53.3,-59.2C67.1,-45.3,75.9,-22.7,75.6,-0.6C75.3,21.5,65.9,43,52.1,58.4C38.3,73.9,19.1,83.4,-1.4,84.4C-21.9,85.4,-43.7,77.8,-57.5,62.4C-71.3,47,-77.2,23.5,-76.7,1.1C-76.2,-21.3,-69.2,-42.6,-55.4,-56.6C-41.6,-70.5,-20.8,-77,-0.3,-76.6C20.2,-76.1,40.4,-68.1,53.3,-59.2Z"
            transform="translate(100 100)"
          />
        </svg>
      </div>

      {/* Content Area */}
      <div className="w-full mx-auto h-full flex flex-col justify-between px-6">
        <div className="flex justify-between py-10">
          {/* Left: Placeholder for Anime Figure */}
          <div className="w-1/2 hidden md:block">
            {/* Add your anime image here later */}
          </div>

          {/* Right: Footer Content */}
          <div className="w-full md:w-1/2 text-right space-y-6">
            <h2 className="text-3xl font-bold text-lime-400">Let’s Play</h2>
            <p className="text-neutral-300 max-w-[100px] ml-auto">
              Chess. Reimagined for the decentralized era. MicroChess brings the
              elegance of classic strategy into a world of verifiable wins,
              digital ownership, and community-driven competition.
            </p>

            <div className="flex justify-end gap-4 text-lime-300">
              <a href="#" className="hover:text-white transition">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition">
                GitHub
              </a>
              <a href="#" className="hover:text-white transition">
                Docs
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="p-2 text-center text-neutral-500 text-sm">
          © {new Date().getFullYear()} MicroChess. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
