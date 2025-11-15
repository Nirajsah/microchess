import Navbar from './HomePage/Navbar'
import About from './HomePage/About'
import Footer from './HomePage/Footer'
import HomePage from './HomePage/HomePage'
import LeaderBoard from './HomePage/LeaderBoard'
import { useEffect, useState } from 'react'
import { supabase } from './lib/utils'

export default function App() {
  const [gameCount, setGameCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    // will be updated to fetch actual game count from supabase
    async function getWallet() {
      const { data: count } = await supabase.from('wallets').select()
      const { data: leaderboard } = await supabase.from('wallets').select()
      console.log('Wallet data:', count)
      setGameCount(() => (count && count[0].balance) || 0)
      setLoading(false)
    }

    getWallet()

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallets',
        },
        (payload: any) => {
          console.log(payload)
          const { eventType, new: newRow, old: oldRow } = payload
          setGameCount(newRow.balance)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="relative w-full min-h-full flex flex-col items-center max-w-[1320px]">
      <Navbar />
      <HomePage gameCount={gameCount} />
      <LeaderBoard />
      <About />
      <div className="w-full h-full max-h-[400px] mt-10">
        <Footer />
      </div>
    </div>
  )
}
