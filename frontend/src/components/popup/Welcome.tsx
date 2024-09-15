export const Welcome = () => {
  return (
    <div className="flex gap-3 w-[600px] h-[300px] bg-white rounded-xl p-3">
      <img className="w-full rounded-lg max-w-[250px] h-full border" />
      <div>
        <h1 className="font-bold text-2xl">Welcome to MicroChess</h1>
        <span>
          MicroChess is a decentralised chess game. Built using Linera
          Microchains architecture. The Game is currently under development
          <br />
          <br />
          If you notice any bugs or have any suggestions, please let us know
        </span>
      </div>
    </div>
  )
}
