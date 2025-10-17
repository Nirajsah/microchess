import React from 'react'
import { PlayerProfile, PlayerProfileCard } from '../popup/PlayerProfileCard'

export default function Navbar() {
  const [showProfile, setShowProfile] = React.useState(false)

  // Mock data for the player
  const mockPlayer: PlayerProfile = {
    username: 'ChessMaster',
    avatarUrl:
      'https://www.nj.com/resizer/mg42jsVYwvbHKUUFQzpw6gyKmBg=/1280x0/smart/advancelocal-adapter-image-uploads.s3.amazonaws.com/image.nj.com/home/njo-media/width2048/img/somerset_impact/photo/sm0212petjpg-7a377c1c93f64d37.jpg',
    title: 'International Master',
    rating: 2300,
    bestRating: 2400,
    country: 'USA',
    recentGames: [
      { opponent: 'OpponentA', result: 'Win', date: '2023-10-01' },
      { opponent: 'OpponentB', result: 'Loss', date: '2023-09-28' },
      { opponent: 'OpponentC', result: 'Draw', date: '2023-09-25' },
    ],
  }
  return (
    <div className="absolute top-0 left-0 w-full h-14 p-3 flex justify-center">
      <div className="w-full max-w-[1280px] flex justify-between items-center">
        <div className="">MicroChess</div>
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="inline-flex items-center justify-center"
            aria-label="Toggle profile"
          >
            <img
              src={mockPlayer.avatarUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30 hover:ring-white/60 transition"
            />
          </button>
          {showProfile && (
            <div className="absolute right-0 top-10 z-50">
              <PlayerProfileCard player={mockPlayer} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
