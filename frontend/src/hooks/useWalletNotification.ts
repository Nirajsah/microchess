// hooks/useWalletNotifications.ts
import { useEffect, useState } from 'react'

export function useWalletNotifications() {
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    if (!window.linera || typeof window.linera.on !== 'function') {
      console.warn('Linera wallet not available yet')
      return
    }

    const handleNotification = (data: any) => {
      setNotification(data)
    }

    window.linera.on('notification', handleNotification)

    return () => {
      if (window.linera && typeof window.linera.off === 'function') {
        window.linera.off('notification', handleNotification)
      }
    }
  }, [])

  return notification
}
