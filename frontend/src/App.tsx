import Navbar from './components/Navbar'
import HomePage from './HomePage/HomePage'
import LeaderBoard from './HomePage/LeaderBoard'
import { motion } from 'framer-motion'

export default function App() {
  return (
    <div className="w-dvw h-dvh overflow-hidden flex bg-white">
      <div className="relative w-full h-screen overflow-hidden bg-white">
        {/* Left (Micro) section */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{
            x: 0,
            clipPath: [
              'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              'polygon(0% 0%, 100% 0%, 82.5% 100%, 0% 100%)',
            ],
            width: '54%',
          }}
          transition={{
            x: { duration: 0.5 },
            clipPath: { duration: 0.5, ease: 'easeInOut' },
          }}
          className="absolute top-0 left-0 w-1/2 h-full bg-[#c92032] flex items-center justify-center"
        >
          <motion.div
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // transition={{ delay: 1.8, duration: 0.5 }}
            className="text-[12rem] text-[#020001] transform -translate-y-12 translate-x-16"
          >
            Micro
          </motion.div>
        </motion.div>

        {/* Right (Chess) section */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{
            x: 0,
            clipPath: [
              'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
              'polygon(17.5% 0%, 100% 0%, 100% 100%, 0% 100%)',
            ],
            width: '56%',
          }}
          transition={{
            x: { duration: 0.5 },
            clipPath: { duration: 0.5, ease: 'easeInOut' },
          }}
          className="absolute top-0 right-0 w-1/2 h-full bg-[#020001] flex items-center justify-center"
        >
          <motion.div
            // initial={{ opacity: 0 }}
            // animate={{ opacity: 1 }}
            // transition={{ delay: 1.8, duration: 0.5 }}
            className="text-[12rem] text-[#c92032] transform translate-y-3 -translate-x-0"
          >
            Chess
          </motion.div>
        </motion.div>
        {/* <HomePage /> */}
      </div>
    </div>
  )
}
