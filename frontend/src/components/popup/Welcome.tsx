import PlayerSelect from './PlayerSelect'

export const Welcome = () => {
  return (
    <div className="font-mono flex gap-3 w-full h-full max-w-[600px] lg:max-h-[300px] bg-white rounded-xl p-2 md:p-3">
      <div>
        <h1 className="font-bold font-fira text-2xl md:text-4xl text-center">
          Welcome to MicroChess
        </h1>
        <span className="text-sm">
          MicroChess is a decentralised chess game. Built using Linera
          Microchains architecture. The Game is currently under development
          <br />
          <br />
          If you notice any bugs or have any suggestions, please let us know
        </span>
        <br />
        <br />
        <div className="flex flex-col md:flex-row items-center gap-2 bg-red-200 p-2 rounded-xl text-sm">
          <h1>Please select a Player: </h1>
          <PlayerSelect />
        </div>
      </div>
    </div>
  )
}
