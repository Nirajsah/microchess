export default function PlayerSelect() {
  const player1 = {
    port: '8080',
    chainId: '',
    owner: '',
  }
  const player2 = {
    port: '8081',
    chainId: '',
    owner: '',
  }

  const handlePlayer = (player: number) => {
    if (player === 1) {
      sessionStorage.setItem('port', player1.port)
      sessionStorage.setItem('chainId', player1.chainId)
      sessionStorage.setItem('owner', player1.owner)
    } else if (player === 2) {
      sessionStorage.setItem('port', player2.port)
      sessionStorage.setItem('chainId', player2.chainId)
      sessionStorage.setItem('owner', player2.owner)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div className="bg-red-500 rounded-xl px-3 py-2 text-sm">
        <button onClick={() => handlePlayer(1)}>Player 1</button>
      </div>
      <div className="bg-red-500 rounded-xl px-3 py-2 text-sm">
        <button onClick={() => handlePlayer(2)}>Player 2</button>
      </div>
    </div>
  )
}
