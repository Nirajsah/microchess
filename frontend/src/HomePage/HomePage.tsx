import { Link } from 'react-router-dom'

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
    <div className="w-full h-full min-h-[880px] flex">
      {/** New UI */}
      <div className="w-full h-full flex flex-col gap-2 p-2">
        <div className="flex w-full gap-2 p-2 justify-between h-full max-h-[600px]">
          <div className="w-[50%] bg-[#0a0a0a] relative flex justify-center items-center rounded-[24px] h-full">
            <div className="bg-transparent backdrop-blur-lg text-[95px] z-50 absolute font-bold px-[68px]">
              MicroChess
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
              <g clip-path="url(#clip0_67_28)">
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

          <div className="p-2 bg-[#0a0a0a] rounded-[24px] w-[320px] min-h-[200px] relative border border-[#ffffff24]">
            <div className="w-full h-[200px] rounded-[18px] relative overflow-hidden">
              <img
                className="object-cover w-full h-full rounded-[18px]"
                src="/public/short_chess_board.svg"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-purple-400 opacity-30 rounded-[26px] pointer-events-none"></div>
            </div>
            <div className="font-bold text-[40px] absolute top-[30%]">
              RuleBook
            </div>
          </div>
          <div className="border border-[#ffffff24] bg-[#0a0a0a] rounded-[18px] w-[320px] h-full"></div>
        </div>

        <div className="p-2 flex gap-3 w-full h-[250px]">
          <div className="border border-[#ffffff24] bg-[#0a0a0a] p-4 flex flex-col justify-between w-1/3 rounded-[30px] h-full">
            <div className="text-4xl">Matches Played</div>
            <div className="text-[100px] leading-[80px] self-end">10000000</div>
          </div>
          <div className="relative border border-[#ffffff24] w-1/3 bg-gradient-to-r from-[#2148ed] to-[#3768f1] rounded-[30px] h-full"></div>
          <Link
            to="/chess"
            className="bg-[#0a0a0a] text-4xl border border-[#ffffff24] w-1/3 rounded-[30px] h-full flex justify-center items-center"
          >
            Play Now
          </Link>
        </div>
      </div>
    </div>
  )
}
