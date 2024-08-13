import { useLazyQuery, useSubscription } from '@apollo/client'
import { GET_BOARD, GET_PLAYER_TURN, NOTIFICATIONS } from './GraphQL/queries'
import React from 'react'
import CBoard from './components/CBoard'

export default function App() {
  const chainId = window.sessionStorage.getItem('chainId') ?? ''
  const [player, setPlayer] = React.useState('')
  const [boardState, setBoardState] = React.useState({})
  const [boardQuery] = useLazyQuery(GET_BOARD, {
    variables: {
      endpoint: 'chess',
      chainId: chainId,
    },
    onCompleted: (data) => {
      console.log(data)

      setBoardState(data.board)
    },
    fetchPolicy: 'network-only',
  })

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
      boardQuery()
    },
  })

  if (!called) {
    playerTurn()
    boardQuery()
  }

  return (
    <div className="p-5 flex justify-center items-center">
      <div>Player to Move: {player}</div>
      <CBoard boardState={boardState} active={player} />
    </div>
  )
}
