/* import React, { useState, useEffect } from 'react'

interface TimerProps {
  initialTime: number
  isActive: boolean
  isStarted: boolean
}

const Timer: React.FC<TimerProps> = ({ initialTime, isActive, isStarted }) => {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive && isStarted) {
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

export default Timer */


import React, { useState, useEffect } from 'react'

interface TimerProps {
  initialTime: number // in microseconds
  isActive: boolean
  isStarted: boolean
}

const Timer: React.FC<TimerProps> = ({ initialTime, isActive, isStarted }) => {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    setTime(initialTime)
  }, [initialTime])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive && isStarted && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => Math.max(0, prevTime - 1000000)) // Decrement by 1,000,000 microseconds (1 second)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive, isStarted, time])

  // Convert microseconds to seconds
  const totalSeconds = Math.floor(time / 1000000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return (
    <div>
      <h1>{`${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`}</h1>
    </div>
  )
}

export default Timer


/* import React, { useState, useEffect } from 'react'

interface TimerProps {
  initialTime: number // in milliseconds
  isActive: boolean
  isStarted: boolean
}

const Timer: React.FC<TimerProps> = ({ initialTime, isActive, isStarted }) => {
  const [time, setTime] = useState(initialTime)

  useEffect(() => {
    setTime(initialTime)
  }, [initialTime])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (isActive && isStarted && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => Math.max(0, prevTime - 1000)) // Decrement by 1000ms (1 second)
      }, 1000)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive, isStarted, time])

  // Convert milliseconds to minutes and seconds
  const totalSeconds = Math.floor(time / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return (
    <div>
      <h1>{`${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`}</h1>
    </div>
  )
}

export default Timer */
