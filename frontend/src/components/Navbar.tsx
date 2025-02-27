import { useState } from 'react'
import { PlayerProfile, PlayerProfileCard } from './popup/PlayerProfileCard'

export default function Navbar() {
  const [showProfile, setShowProfile] = useState(false)

  // Mock data for the player
  const mockPlayer: PlayerProfile = {
    username: 'ChessMaster',
    avatarUrl:
      'https://www.nj.com/resizer/mg42jsVYwvbHKUUFQzpw6gyKmBg=/1280x0/smart/advancelocal-adapter-image-uploads.s3.amazonaws.com/image.nj.com/home/njo-media/width2048/img/somerset_impact/photo/sm0212petjpg-7a377c1c93f64d37.jpg',
    title: 'International Master',
    rating: 2300,
    gamesPlayed: 150,
    wins: 90,
    losses: 40,
    draws: 20,
    winPercentage: 60,
    bestRating: 2400,
    country: 'USA',
    bio: 'Passionate about chess and always up for a challenge.',
    recentGames: [
      { opponent: 'OpponentA', result: 'Win', date: '2023-10-01' },
      { opponent: 'OpponentB', result: 'Loss', date: '2023-09-28' },
      { opponent: 'OpponentC', result: 'Draw', date: '2023-09-25' },
    ],
  }
  const ownerId =
    window.sessionStorage.getItem('owner') ??
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE'
  return (
    <div className="relative w-full text-white gap-2 h-[80px] px-14 py-6 flex items-center justify-between">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>
      {ownerId ? (
        <div className="text-xl p-2 flex justify-center items-center h-full">
          {ownerId}
        </div>
      ) : (
        <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
          Connect Wallet
        </div>
      )}

      <button onClick={() => setShowProfile(!showProfile)}>Show Profile</button>
      {showProfile && (
        <div className="text-black absolute top-9">
          <PlayerProfileCard player={mockPlayer} />
        </div>
      )}
    </div>
  )
}
