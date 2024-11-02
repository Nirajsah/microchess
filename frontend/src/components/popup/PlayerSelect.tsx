export default function PlayerSelect() {
  const player1 = {
    port: '8080',
    owner: 'df44403a282330a8b086603516277c014c844a4b418835873aced1132a3adcd5',
    chainId: 'fc9384defb0bcd8f6e206ffda32599e24ba715f45ec88d4ac81ec47eb84fa111',
    
  }
  const player2 = {
    port: '8081',
    owner: '43c319a4eab3747afcd608d32b73a2472fcaee390ec6bed3e694b4908f55772d',
    chainId: 'fc9384defb0bcd8f6e206ffda32599e24ba715f45ec88d4ac81ec47eb84fa111',
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
