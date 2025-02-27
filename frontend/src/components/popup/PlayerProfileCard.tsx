import React from 'react'

// Define type for game history item
interface GameHistoryItem {
  opponent: string
  result: 'Win' | 'Loss' | 'Draw'
  date: string
}

// Define type for player data
export interface PlayerProfile {
  username: string
  avatarUrl: string
  title: string
  rating: number
  gamesPlayed: number
  wins: number
  losses: number
  draws: number
  winPercentage: number
  bestRating: number
  country: string
  bio: string
  recentGames: GameHistoryItem[]
  // You can add additional fields (e.g., preferred openings) as needed
}

export const PlayerProfileCard: React.FC<{ player: PlayerProfile }> = ({
  player,
}) => {
  return (
    <div style={styles.card}>
      {/* Header Section */}
      <div style={styles.header}>
        <img src={player.avatarUrl} alt="Avatar" style={styles.avatar} />
        <div>
          <h2 style={styles.username}>{player.username}</h2>
          <p style={styles.title}>{player.title}</p>
        </div>
      </div>

      {/* Rating and Stats */}
      <div style={styles.stats}>
        <div style={styles.statItem}>
          <strong>Rating:</strong> {player.rating}
        </div>
        <div style={styles.statItem}>
          <strong>Best Rating:</strong> {player.bestRating}
        </div>
        <div style={styles.statItem}>
          <strong>Games Played:</strong> {player.gamesPlayed}
        </div>
        <div style={styles.statItem}>
          <strong>Record:</strong> {player.wins}W / {player.losses}L /{' '}
          {player.draws}D
        </div>
        <div style={styles.statItem}>
          <strong>Win %:</strong> {player.winPercentage}%
        </div>
      </div>

      {/* Additional Info */}
      <div style={styles.additional}>
        <p>
          <strong>Country:</strong> {player.country}
        </p>
        <p>
          <strong>Bio:</strong> {player.bio}
        </p>
      </div>

      {/* Recent Games */}
      <div style={styles.games}>
        <h3>Recent Games</h3>
        {player.recentGames.map((game, index) => (
          <div key={index} style={styles.gameItem}>
            <span style={styles.gameDate}>{game.date}</span>
            <span style={styles.gameDetail}>
              vs {game.opponent} - {game.result}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Inline CSS styles (Feel free to move them to a CSS/SCSS file)
const styles: { [key: string]: React.CSSProperties } = {
  card: {
    maxWidth: '400px',
    margin: '20px auto',
    padding: '15px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#fff',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    marginRight: '15px',
    objectFit: 'cover',
  },
  username: {
    margin: '0',
    fontSize: '1.5rem',
  },
  title: {
    margin: '0',
    color: '#777',
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  statItem: {
    width: '48%',
    marginBottom: '8px',
  },
  additional: {
    marginBottom: '15px',
  },
  games: {
    borderTop: '1px solid #eee',
    paddingTop: '10px',
  },
  gameItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 0',
    borderBottom: '1px solid #f4f4f4',
  },
  gameDate: {
    fontSize: '0.9rem',
    color: '#555',
  },
  gameDetail: {
    fontSize: '0.9rem',
  },
}
