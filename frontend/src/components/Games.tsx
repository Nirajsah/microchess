import { Link } from 'react-router-dom'
import BoardImage from '../assets/chessboard.webp'

const GameCard = ({ title, image }: { title: string; image: string }) => {
  return (
    <Link
      to="/chess"
      className="bg-white hover:scale-105 transition-all cursor-pointer rounded-xl p-2 w-full max-w-[250px] h-[300px] border"
    >
      <img className="rounded-lg" src={image} alt={title} />
      <h2 className="font-semibold text-lg mt-3 ml-1">{title}</h2>
    </Link>
  )
}
export default function Games() {
  return (
    <div className="border-t border-gray-500 w-full p-6 flex justify-center">
      <GameCard title="MicroChess" image={BoardImage} />
    </div>
  )
}
