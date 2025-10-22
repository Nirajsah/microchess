// hooks/useWalletNotifications.ts
import { useEffect, useState } from 'react'

export function useWalletNotifications() {
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    // Check if window.linera exists and has the on method
    if (!window.linera || typeof window.linera.on !== 'function') {
      console.warn('Linera wallet not available yet')
      return
    }

    const handleNotification = (data: any) => {
      setNotification(data)
    }

    window.linera.on('notification', handleNotification)

    return () => {
      // Also check before cleanup
      if (window.linera && typeof window.linera.off === 'function') {
        window.linera.off('notification', handleNotification)
      }
    }
  }, [])

  return notification
}

// // Usage in any component
// function MyComponent() {
//   const notification = useWalletNotifications()

//   useEffect(() => {
//     if (notification) {
//       toast.success(notification.message)
//     }
//   }, [notification])
// }
