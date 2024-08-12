import { useLazyQuery, useSubscription } from '@apollo/client'
import CBoard from './components/CBoard'
import CzBoard from './components/CzBoard'
import { GET_PLAYER_TURN, NOTIFICATIONS } from './GraphQL/queries'
import React from 'react'

export default function App() {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const [player, setPlayer] = React.useState('')

  const [playerTurn, { called }] = useLazyQuery(GET_PLAYER_TURN, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)

      setPlayer(data.playerTurn)
    },
    fetchPolicy: 'network-only',
  })

  useSubscription(NOTIFICATIONS, {
    variables: {
      chainId: chainId,
    },
    onData: () => {
      console.log('Notification received')
      playerTurn()
    },
  })

  if (!called) {
    playerTurn()
  }

  return (
    <div className="p-5 flex justify-center items-center">
      <div>Player to Move: {player}</div>
      <CzBoard />
    </div>
  )
}
