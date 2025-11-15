import Navbar from './HomePage/Navbar'
import About from './HomePage/About'
import Footer from './HomePage/Footer'
import HomePage from './HomePage/HomePage'
import LeaderBoard from './HomePage/LeaderBoard'
import { useEffect, useState } from 'react'
import { supabase } from './lib/utils'

export default function App() {
  const [gameCount, setGameCount] = useState<any>(0)
  const [leaderboard, setLeaderboard] = useState<any>([])

  useEffect(() => {
    async function getLeaderboard() {
      const { data: leaderboard } = await supabase.from('leaderboard').select()
      console.log(leaderboard)
      setLeaderboard(leaderboard)
    }

    async function getCount() {
      const { data } = await supabase.from('gameCount').select().single()
      setGameCount(data.count)
    }

    getLeaderboard()
    getCount()

    const channel_count = supabase
      .channel('gameCount-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gameCount',
        },
        (payload: any) => {
          const { eventType, new: newRow, old: oldRow } = payload
          setGameCount(newRow.count)
        }
      )
      .subscribe()

    const channel_leaderboard = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'leaderboard',
        },
        (payload: any) => {
          getLeaderboard()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel_leaderboard)
      supabase.removeChannel(channel_count)
    }
  }, [])

  return (
    <div className="relative w-full min-h-full flex flex-col items-center max-w-[1320px]">
      <Navbar />
      <HomePage gameCount={gameCount} />
      <LeaderBoard leaderboard={leaderboard} />
      <About />
      <div className="w-full h-full max-h-[400px] mt-10">
        <Footer />
      </div>
    </div>
  )
}
