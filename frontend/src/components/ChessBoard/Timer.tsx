interface TimerProps {
  initialTimeMs: number
  start: boolean
}

const Timer: React.FC<TimerProps> = ({ initialTimeMs, start }) => {
  const totalSeconds = Math.floor(initialTimeMs / 1000000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  console.log('Timer rendered', minutes, seconds, start)

  return (
    <div>
      <h1>{`${minutes}:${seconds.toString().padStart(2, '0')}`}</h1>
    </div>
  )
}

export default Timer
