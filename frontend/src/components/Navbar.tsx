export default function Navbar() {
  const ownerId =
    window.sessionStorage.getItem('owner') ??
    '0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0bE'
  return (
    <div className="relative w-full gap-2 h-[80px] px-14 py-6 flex items-center justify-between">
      <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
        MicroChess
      </div>
      {ownerId ? (
        <div className="text-xl p-2 flex justify-center items-center h-full">
          {ownerId}
        </div>
      ) : (
        <div className="text-2xl p-2 flex justify-center items-center w-fit h-full">
          Connect Wallet
        </div>
      )}
    </div>
  )
}
