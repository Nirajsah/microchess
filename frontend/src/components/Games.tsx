import { Link } from 'react-router-dom'

const PlayNow = () => {
  return (
    <Link
      to="/chess"
      className="hover:scale-105 transition-all cursor-pointer rounded-lg px-4 py-2 w-fit border"
    >
      Play Now
    </Link>
  )
}
export default function Games() {
  return <PlayNow />
}
