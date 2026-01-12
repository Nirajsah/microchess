import React from 'react'
import { ChevronDown, Trophy, Swords, CheckCircle } from 'lucide-react'
import { Notification, NotificationType } from '@/graphql/graphql'
import { getNofitications, markAllNotificationsRead } from '@/api'
import { microsToDatetimeLocal } from '@/Tournament/utils'
import { useWalletStore } from '@/store/wallet'

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'FRIENDLY_MATCH':
      return <Swords className="w-5 h-5 text-blue-400" />
    case 'TOURNAMENT_PUBLISHED':
      return <Trophy className="w-5 h-5 text-yellow-400" />
    case 'TOURNAMENT_FINISHED':
      return <CheckCircle className="w-5 h-5 text-green-400" />
    default:
      return null
  }
}

const NotificationItem = ({
  notification,
  isExpanded,
  onToggle,
  onAction,
}: {
  notification: Notification
  isExpanded: boolean
  onToggle: () => void
  onAction: (chainId: string) => void
}) => {
  const [contentHeight, setContentHeight] = React.useState(0)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [notification])

  const formatTime = (timestamp: number) => {
    const diff = Date.now() / 1000 - timestamp
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    return 'Recently'
  }

  const renderContent = () => {
    switch (notification.notificationType) {
      case 'FRIENDLY_MATCH':
        return (
          <div className="space-y-3">
            <p className="text-zinc-300">
              You've received a friendly match invitation
              {notification.data && ` from ${notification.data}`}
              {notification.sender && ` in ${notification.sender} mode`}.
            </p>
            {notification.chainId && (
              <button
                onClick={() => onAction(notification.chainId!)}
                className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600
                  text-white text-sm font-medium rounded-lg transition-colors
                  active:scale-95 transform duration-100"
              >
                Accept Match
              </button>
            )}
          </div>
        )

      case 'TOURNAMENT_PUBLISHED':
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              {notification.title && (
                <p className="text-zinc-300 font-medium">
                  {notification.title}
                </p>
              )}
              {/*{notification.prize && (
                <p className="text-sm text-zinc-400">
                  Prize Pool: {data.prize}
                </p>
              )}*/}
              {notification.createdAt && (
                <p className="text-sm text-zinc-400">
                  Created: {microsToDatetimeLocal(notification.createdAt)}
                </p>
              )}
            </div>
            {notification.chainId && (
              <button
                onClick={() => onAction(notification.chainId!)}
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600
                  text-black text-sm font-medium rounded-lg transition-colors
                  active:scale-95 transform duration-100"
              >
                Add Chain to your wallet
              </button>
            )}
          </div>
        )

      case 'TOURNAMENT_FINISHED':
        return (
          <div className="space-y-2">
            {/*{notification.tournamentName && (
              <p className="text-zinc-300 font-medium">{data.tournamentName}</p>
            )}
            {notification.position && (
              <p className="text-sm text-zinc-400">
                You finished in position #{data.position}
              </p>
            )}
            {data.prize && (
              <p className="text-sm text-green-400">Reward: {data.prize}</p>
            )}*/}
          </div>
        )

      default:
        return <p className="text-zinc-400 text-sm">{notification.data}</p>
    }
  }

  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-950
        transition-all duration-200 ${notification.read ? 'opacity-60' : ''}
        ${isExpanded ? 'shadow-lg shadow-zinc-900/50' : ''}`}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-3 text-left
          hover:bg-zinc-900/50 transition-colors rounded-t-lg"
      >
        <div className="mt-0.5">
          <NotificationIcon type={notification.notificationType} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-zinc-100 line-clamp-2">
              {notification.title}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5
                transition-transform duration-300 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
            />
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">
            {formatTime(notification.createdAt)}
          </span>
        </div>

        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </button>

      {/* Expandable Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-3 pb-3 pl-11">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    title: 'Friendly Match Invitation',
    notificationType: NotificationType.FriendlyMatch,
    createdAt: Date.now() / 1000 - 3600,
    read: false,
    data: 'Player123',
    sender: 'Deathmatch',
    chainId: 'chain-001',
  },
  {
    title: 'New Tournament Published!',
    notificationType: NotificationType.TournamentPublished,
    createdAt: Date.now() / 1000 - 7200,
    read: true,
    chainId: 'chain-002',
    data: 'Spring Championship',
    sender: '',
  },
]

export const Notifications = ({ onReadAll }: { onReadAll?: () => void }) => {
  const [notifications, setNotifications] =
    React.useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const assignChain = useWalletStore((s) => s.assignChainAsync)

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const handleAction = async (chainId: string) => {
    try {
      await assignChain(chainId)
    } catch (e) {
      console.log(e)
    }
  }

  React.useEffect(() => {
    const fetchNotifications = async () => {
      const data = await getNofitications()
      const parsed = JSON.parse(data)
      setNotifications(parsed.data.notifications)
    }

    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    onReadAll?.()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div
      className="absolute right-0 top-12 z-50 w-[360px] h-[500px]
      bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-100">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-medium rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-blue-400 hover:text-blue-300 transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {notifications.length === 0 && (
          <div className="text-sm text-zinc-500 text-center py-20">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="w-12 h-12 text-zinc-700" />
              <p>No notifications</p>
            </div>
          </div>
        )}

        {notifications.map((n, index) => (
          <NotificationItem
            key={`${n.title}-${index}`}
            notification={n}
            isExpanded={expandedId === n.title}
            onToggle={() => handleToggle(n.title)}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  )
}
