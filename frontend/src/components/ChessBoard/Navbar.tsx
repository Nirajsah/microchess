import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <div className="w-full h-14 p-3 flex justify-center">
      <div className="w-full max-w-[1280px] flex justify-between items-center">
        <Link to="/">
          <div className="text-xl">MicroChess</div>
        </Link>
      </div>
    </div>
  )
}
