export default function Navbar() {
  const ownerId = window.sessionStorage.getItem('owner') ?? ''
  return (
    <div className="w-full px-14 py-6 flex items-center justify-between">
      <div className="text-2xl tracking-wide font-jolly text-[#ff3636] font-semibold">
        MicroChess
      </div>
      <div>{ownerId}</div>
    </div>
  )
}
