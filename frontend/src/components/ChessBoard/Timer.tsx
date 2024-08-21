import React, { useState, useEffect } from 'react'

interface TimerProps {
  start: boolean
}

const Timer: React.FC<TimerProps> = ({ start }) => {
  const initialTime = 15 * 60

  // Get the time from localStorage or set it to 15 minutes if not found
  const getInitialTimeLeft = () => {
    const storedTime = localStorage.getItem('timeLeft')
    if (storedTime) {
      return parseInt(storedTime, 10)
    }
    return initialTime
  }

  const [timeLeft, setTimeLeft] = useState(getInitialTimeLeft)
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const storedRunning = localStorage.getItem('isRunning')
    return storedRunning === 'true' // If null or 'false', it will be false
  })

  useEffect(() => {
    setIsRunning(start)
  }, [start])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          const newTime = prevTime - 1
          localStorage.setItem('timeLeft', newTime.toString())
          return newTime
        })
      }, 1000)
    }

    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  useEffect(() => {
    // Clean up localStorage when the timer reaches zero
    if (timeLeft === 0) {
      localStorage.removeItem('timeLeft')
      setIsRunning(false)
    }
  }, [timeLeft])

  useEffect(() => {
    // Save the running state to localStorage
    localStorage.setItem('isRunning', isRunning.toString())
  }, [isRunning])

  // Function to format the time as mm:ss
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`
  }

  return (
    <div>
      <h1>{formatTime(timeLeft)}</h1>
    </div>
  )
}

export default Timer
