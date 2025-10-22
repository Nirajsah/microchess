import Navbar from './HomePage/Navbar'
import About from './HomePage/About'
import Footer from './HomePage/Footer'
import HomePage from './HomePage/HomePage'
import LeaderBoard from './HomePage/LeaderBoard'
import { useEffect } from 'react'
import { assign, getGameChainInfo } from './components/ChessBoard/utils'

export default function App() {
  // useEffect(() => {
  //   getGameChainInfo().then((res) => {
  //     let data = JSON.parse(res.result).data.gameChain
  //     console.log('Chain ID:', data.chainId)
  //     assign(data.chainId, data.timestamp)
  //   })
  // }, [])
  return (
    <div className="relative w-full min-h-full flex flex-col items-center max-w-[1320px]">
      <Navbar />
      <HomePage />
      <LeaderBoard />
      <About />
      <div className="w-full h-full max-h-[400px] mt-10">
        <Footer />
      </div>
    </div>
  )
}
