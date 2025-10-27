import { Link } from 'react-router-dom'
import { StarBorder } from '../components/ui/star-border'
import ShortBoard from '/public/short_chess_board.svg'
import { BackgroundBeamsDemo } from '@/components/ui/background-beam-demo'

const BorderAnimation = () => {
  return (
    <>
      <div className="absolute top-0 left-0 w-16 h-16">
        <div className="border-t-2 border-l-2 border-purple-400 w-full h-full rounded-tl-3xl opacity-70"></div>
      </div>

      <div className="absolute top-0 right-0 w-16 h-16">
        <div className="border-t-2 border-r-2 border-yellow-400 w-full h-full rounded-tr-3xl opacity-70"></div>
      </div>

      <div className="absolute bottom-0 left-0 w-16 h-16">
        <div className="border-b-2 border-l-2 border-blue-400 w-full h-full rounded-bl-3xl opacity-70"></div>
      </div>

      <div className="absolute bottom-0 right-0 w-16 h-16">
        <div className="border-b-2 border-r-2 border-green-400 w-full h-full rounded-br-3xl opacity-70"></div>
      </div>
    </>
  )
}

export default function HomePage() {
  return (
    <div className="w-full h-full min-h-[880px] flex mt-20">
      <div className="w-full h-full flex flex-col gap-2 p-2">
        <div className="flex flex-col md:flex-row gap-2 min-w-0 lg:flex-wrap overflow-hidden">
          <div className="relative w-full lg:w-[50%] h-full aspect-square bg-[#0a0a0a] flex justify-center items-center rounded-[24px] min-w-0 flex-[1_1_0%]">
            <div className="absolute exact-1024 z-10 bg-transparent backdrop-blur-lg w-[calc(70%+1.5rem)] h-[calc(20%+1.5rem)] md:w-[calc(72%+0.7rem)] md:h-[calc(22%+0.8rem)]"></div>
            <div className="z-20 flex items-center justify-center">
              <span className="text-2xl md:text-4xl lg:text-5xl xl:text-[58px] font-semibold text-white">
                MicroChess
              </span>
            </div>
            <div className="absolute inset-0 overflow-hidden rounded-3xl">
              <BorderAnimation />
            </div>
            <svg
              className="absolute top-0 left-0 w-full h-full opacity-50 rounded-[24px]"
              viewBox="0 0 700 700"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <g clipPath="url(#clip0_67_28)">
                <line x1="175.5" x2="175.5" y2="700" stroke="#ffffff24" />
                <line x1="525.5" x2="525.5" y2="700" stroke="#ffffff24" />
                <line y1="524.5" x2="700" y2="524.5" stroke="#ffffff24" />
                <line y1="174.5" x2="700" y2="174.5" stroke="#ffffff24" />
                <line y1="349.5" x2="700" y2="349.5" stroke="#ffffff24" />
                <line y1="87" x2="700" y2="87" stroke="#ffffff24" />
                <line y1="262" x2="700" y2="262" stroke="#ffffff24" />
                <line y1="437.5" x2="700" y2="437.5" stroke="#ffffff24" />
                <line y1="612.5" x2="700" y2="612.5" stroke="#ffffff24" />
                <line x1="350.5" x2="350.5" y2="700" stroke="#ffffff24" />
                <line x1="260.5" x2="260.5" y2="700" stroke="#ffffff24" />
                <line x1="88" x2="88" y2="700" stroke="#ffffff24" />
                <line x1="611" x2="611" y2="700" stroke="#ffffff24" />
                <line x1="438.5" x2="438.5" y2="700" stroke="#ffffff24" />
              </g>
              <rect
                x="0.5"
                y="0.5"
                width="699"
                height="699"
                stroke="#ffffff24"
              />
              <defs>
                <clipPath id="clip0_67_28">
                  <rect width="700" height="700" fill="#ffffff24" />
                </clipPath>
              </defs>
            </svg>
            <svg
              className="absolute left-0 top-0 w-full h-full"
              viewBox="0 0 700 700"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <g transform="translate(86, 0)">
                <path
                  className="stroke-blue-500 animated-path"
                  d="M2 699.5V612.5H89.5V524.5H174.5V438.5"
                  fill="none"
                />

                <path
                  className="stroke-green-500 animated-path"
                  d="M352.5 437.5V612.5H439.5V699.5"
                  fill="none"
                />

                <path
                  className="stroke-yellow-500 animated-path"
                  d="M352.5 262V174.5H439.5V87H613.5"
                  fill="none"
                />

                <path
                  className="stroke-purple-500 animated-path"
                  d="M174.5 0.5V87H89.5V174.5H174.5V262"
                  fill="none"
                />
              </g>
            </svg>
          </div>

          <div className="hidden lg:flex flex-col p-2 max-h-[650px] bg-[#0a0a0a] rounded-[24px] w-full lg:w-[320px] relative border border-[#ffffff24] min-w-0 flex-[0_1_320px]">
            <div className="w-full min-h-[200px] md:h-[200px] rounded-[18px] relative overflow-hidden">
              <img
                className="object-cover w-full h-full rounded-[18px]"
                src={ShortBoard}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-purple-400 opacity-30 rounded-[26px] pointer-events-none"></div>
            </div>
            <div className="font-semibold">
              <h2 className="text-[40px] absolute top-[176px]">Guide</h2>

              <div className="mt-10">
                {[
                  'Download Croissant from github',
                  'Install Croissant Wallet Extension',
                  'Create a new Wallet on Croissant',
                  'Press "Connect" and approve the request',
                  'Click on "Play Now"',
                  'Select "Random" or "Friendly Match"',
                  'Click "Assign" and approve the request',
                  'Enjoy the game!',
                ].map((text, index) => (
                  <div key={index} className="flex items-center ml-3 my-2">
                    <div className="flex justify-center items-center gap-3">
                      <div className="flex-shrink-0 w-4 h-4 rounded-full bg-white">
                        <svg
                          className="w-4 h-4 text-black"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div className="text-white font-normal text-sm">
                        {text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block border max-h-[650px] lg:w-[320px] border-[#ffffff24] rounded-[18px] h-full min-w-0 flex-[0_1_320px]">
            <BackgroundBeamsDemo />
          </div>
        </div>

        <div className="flex gap-3 w-full md:h-[250px] max-h-[200px] min-w-0 overflow-hidden">
          <div className="border gap-4 border-[#ffffff24] bg-[#0a0a0a] p-4 flex flex-col justify-between w-1/2 lg:w-1/3 rounded-[30px] h-full">
            <div className="text-base sm:text-lg md:text-2xl">
              Matches Played
            </div>
            <div className="text-lg sm:text-xl md:text-3xl lg:text-[48px] lg:leading-[64px] self-end">
              10000000
            </div>
          </div>
          <div className="hidden lg:flex relative w-1/3 bg-gradient-to-r from-[#2146ed6e] to-[#3769f1fc] rounded-[30px] h-full">
            <a
              href="https://github.com/Nirajsah/croissant"
              target="_blank"
              className="w-full h-full cursor-pointer flex justify-center items-center"
            >
              <span className="text-[40px]">Croissant 🥐</span>
            </a>
          </div>

          <Link
            to="/chess"
            className="text-4xl md:text-[42px] lg:text-4xl w-1/2 lg:w-1/3 rounded-[20px]"
          >
            <StarBorder>
              <p className="text-lg md:text-2xl lg:text-3xl">Play Now</p>
            </StarBorder>
          </Link>
        </div>
      </div>
    </div>
  )
}
