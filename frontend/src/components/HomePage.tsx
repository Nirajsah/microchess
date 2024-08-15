import pawn from '../assets/chess_pawn.svg'
import Games from './Games'
import Navbar from './Navbar'

export default function HomePage() {
  return (
    <div className="bg-[#d6d1c7] w-full h-screen flex flex-col items-center">
      <Navbar />
      <div className=" w-full max-w-[1280px] my-16 flex justify-center">
        <div className="text-5xl content-center relative text-balance font-medium tracking-normal text-center leading-snug h-[250px]">
          Decentralized Games Platform
          <br /> Play Fair, Play Secure, Play On-Chain
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -left-[80px] top-30 hover:transform hover:rotate-90 duration-150 hover:scale-110 transition-all"
            width="70"
            height="70"
            fill="none"
            viewBox="0 0 200 200"
            version="1.1"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <g clip-path="url(#clip0_118_208)">
              <path
                fill="rgba(0, 0, 0, 1)"
                d="M100 200c-2.895-94.738-5.262-97.09-100-100 94.738-2.895 97.09-5.262 100-100 2.895 94.738 5.262 97.09 100 100-94.738 2.91-97.09 5.233-100 100Z"
              ></path>
            </g>
          </svg>
          <svg
            className="absolute right-[30px] hover:transform hover:rotate-90 duration-150 hover:scale-110 transition-all top-0"
            xmlns="http://www.w3.org/2000/svg"
            width="50"
            height="50"
            fill="none"
            viewBox="0 0 200 200"
            version="1.1"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <path
              fill="rgba(0, 0, 0, 1)"
              fill-rule="evenodd"
              d="M100 100s12.5-33.474 12.5-57.143C112.5 19.187 106.904 0 100 0S87.5 19.188 87.5 42.857C87.5 66.527 100 100 100 100Zm0 0s14.831 32.508 31.567 49.245c16.737 16.737 34.262 26.347 39.144 21.466 4.881-4.882-4.729-22.407-21.466-39.144C132.508 114.831 100 100 100 100Zm0 0s33.474-12.5 57.143-12.5C180.812 87.5 200 93.096 200 100s-19.188 12.5-42.857 12.5S100 100 100 100Zm0 0s-32.508 14.831-49.245 31.567c-16.737 16.737-26.347 34.262-21.466 39.144 4.882 4.881 22.407-4.729 39.144-21.466C85.169 132.508 100 100 100 100Zm0 0c.028.074 12.5 33.5 12.5 57.143 0 23.669-5.596 42.857-12.5 42.857s-12.5-19.188-12.5-42.857S100 100 100 100Zm0 0S66.526 87.5 42.857 87.5C19.187 87.5 0 93.096 0 100s19.188 12.5 42.857 12.5C66.527 112.5 100 100 100 100Zm0 0s32.508-14.83 49.245-31.567c16.737-16.737 26.347-34.262 21.466-39.144-4.882-4.881-22.407 4.73-39.144 21.466C114.831 67.492 100 100 100 100ZM68.433 50.755C85.169 67.492 100 100 100 100S67.492 85.17 50.755 68.433C34.018 51.696 24.408 34.17 29.29 29.289c4.882-4.881 22.407 4.73 39.144 21.466Z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </div>
      </div>
      <Games />
    </div>
  )
}
