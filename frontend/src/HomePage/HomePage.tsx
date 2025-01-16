import BannerImage1 from '../assets/banner1.jpeg'
import Navbar from '../components/Navbar'
import Model from '/Model2.png'
import { motion } from 'framer-motion'

export default function HomePage() {
  return (
    <div className="relative w-full h-full flex">
      <motion.div
        initial={{ y: '100%' }}
        transition={{ duration: 1 }}
        animate={{ y: 0 }}
        className="absolute bottom-0 z-30 left-1/2 translate-x-[-50%] w-[70%] lg:w-[50%] max-w-[45%]"
      >
        <img className="w-full h-full" src={Model} />
      </motion.div>

      <Navbar />
      {/* <div className="absolute top-1/2 translate-y-[-50%] left-1/2 translate-x-[-50%] -z-0 lg:text-[300px] text-white">
        MicroChess
      </div>

      <div className="absolute z-50 bottom-10 left-10">
        <svg
          width="350"
          height="120"
          viewBox="0 0 350 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M300.5 29.813L278 0.5H0.5V120.5H300.5V29.813Z"
            strokeWidth="1"
            stroke="white"
          />
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="white"
            fontSize="20" 
          >
            Hello
          </text>
        </svg>
      </div> */}

      {/* <div className="flex w-full h-full gap-3">
        <div className="w-fit h-full max-h-[800px] flex flex-col justify-between gap-3 relative">
          <div className="bg-[#F1F2F6] rounded-[44px] p-3 w-[400px] h-[200px] flex gap-3">
            <div
              style={{
                backgroundImage: 'url(/Linera_LogoBanner_Blues.png)',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              className="rounded-[36px] min-w-[170px] min-h-[160px]"
            ></div>

            <div className="w-full h-full flex flex-col justify-between">
              <div className="">Hello there learn more about linera</div>
              <div className="bg-[#000000] text-white flex justify-center items-center opacity-85 rounded-full w-full h-[52px] self-end">
                Explore Now
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-end leading-[85px] absolute bottom-0">
            <div className="text-[100px] bg-white tracking-wide">
              MicroChess
            </div>
            <div className="text-[100px] bg-white tracking-wide z-10 bottom-0 pr-[1.40rem] pt-2 rounded-tr-3xl">
              Decentralized
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundImage: 'url(banner.jpg)',
            backgroundRepeat: 'no-repeat',
            objectFit: 'contain',
          }}
          className="rounded-lg relative w-full max-h-[800px]"
        >
          <div className="curve2 bottom-[140px] left-[50px]">
            <div className="concave2"></div>
          </div>
          <div className="curve6 bottom-[50px] left-[118px]">
            <div className="concave6"></div>
          </div>
          <div className="curve top-[50px] left-[50px]">
            <div className="concave"></div>
          </div>
          <div className="curve3 bottom-[50px] right-[-50px]">
            <div className="concave3"></div>
          </div>
          <div className="curve4 top-[18px] right-[-52px]">
            <div className="concave5"></div>
          </div>
          <div className="curve4 top-[-50px] right-[140px]">
            <div className="concave4"></div>
          </div>
          <div className="bg-white rounded-bl-[32px] p-2 right-0 absolute">
            <div className="bg-[#000000] text-white flex justify-center items-center opacity-85 rounded-full w-[180px] h-[52px] self-end">
              Connect Wallet
            </div>
          </div>
        </div>
      </div> */}

      {/** New UI */}
      {/* <div className="w-full h-full p-6 flex flex-col gap-3">
        <div className="flex w-full justify-between h-full">
          <div className="w-[670px] relative flex justify-center items-center rounded-[24px] h-[500px]">
            <div className="text-[100px] z-50 absolute text-black font-bold bottom-0 left-10">
              MicroChess
            </div>
          </div>
          <div className="p-2 bg-[#f8f8f8] border rounded-[24px] w-[320px] h-full relative">
            <div className="w-full h-[200px] rounded-[18px] relative overflow-hidden">
              <img
                className="object-cover w-full h-full rounded-[18px]"
                src="/public/short_chess_board.svg"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-red-400 to-purple-400 opacity-30 rounded-[26px] pointer-events-none"></div>
            </div>
            <div className="font-bold text-[40px] absolute top-[35%]">
              RuleBook
            </div>
          </div>
          <div className="bg-[#f8f8f8] border rounded-[18px] w-[320px] h-full"></div>
        </div>
        <div className="p-2 flex gap-3 w-full h-[400px]">
          <div className="border bg-white p-4 flex flex-col justify-between w-1/3 rounded-[30px] h-full">
            <div className="text-4xl">Matches Played</div>
            <div className="text-[100px] leading-[80px] self-end">10000000</div>
          </div>
          <div className="relative border w-1/3 bg-gradient-to-r from-[#2148ed] to-[#3768f1] rounded-[30px] h-full">
            <div className="absolute w-[200px] h-[200px] bg-[#2148ed] shadow-lg z-10 rounded-full"></div>
          </div>
          <div className="border-4 border-black w-1/3 rounded-[30px] h-full"></div>
        </div>
      </div> */}
    </div>
  )
}
