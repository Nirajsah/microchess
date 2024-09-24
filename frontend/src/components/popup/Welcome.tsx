import PlayerSelect from './PlayerSelect'

export const Welcome = () => {
  return (
    <div className="flex gap-3 w-full h-full max-w-[600px] max-h-[300px] bg-white rounded-xl p-3">
      <div>
        <h1 className="font-bold text-2xl">Welcome to MicroChess</h1>
        <span>
          MicroChess is a decentralised chess game. Built using Linera
          Microchains architecture. The Game is currently under development
          <br />
          <br />
          If you notice any bugs or have any suggestions, please let us know
        </span>
        <br />
        <br />
        <div className="flex items-center gap-4 bg-red-200 px-3 py-2 rounded-xl">
          <h1>Please select a Player: </h1>
          <PlayerSelect />
        </div>
      </div>
    </div>
  )
}
