import React, { useState, useEffect } from 'react'

interface TimerProps {
  initialTime: number
  isActive: boolean
}

const Timer: React.FC<TimerProps> = ({ initialTime, isActive }) => {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive])

  const minutes = Math.floor(time / 60)
  const seconds = time % 60

  return (
    <div>
      <h1>{`${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`}</h1>
    </div>
  )
}

export default Timer
