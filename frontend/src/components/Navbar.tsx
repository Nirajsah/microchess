export default function Navbar() {
  const ownerId = window.sessionStorage.getItem('owner') ?? ''
  return (
    <div className="border-b border-gray-500 w-full px-20 py-6 flex items-center justify-between">
      <div className="text-2xl tracking-wide font-semibold">Stella</div>
      <div>{ownerId}</div>
    </div>
  )
}
