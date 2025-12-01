import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Play,
  Pause,
} from 'lucide-react'

interface GameControlsProps {
  onNext?: () => void
  onBack?: () => void
  onPlay?: () => void
  onStart?: () => void
  onEnd?: () => void
  onStop?: () => void
  isPlaying?: boolean
}

export const GameControls = ({
  onNext,
  onBack,
  onPlay,
  onStart,
  onEnd,
  onStop,
  isPlaying = false,
}: GameControlsProps) => {
  const Button = ({
    onClick,
    icon: Icon,
    label,
  }: {
    onClick?: () => void
    icon: any
    label: string
  }) => (
    <button
      onClick={onClick}
      className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors focus:outline-none"
      title={label}
    >
      <Icon className="w-6 h-6" />
    </button>
  )

  return (
    <div className="flex items-center justify-center gap-2 w-full bg-[#262626] rounded-xl px-4 mb-2">
      <Button onClick={onStart} icon={ChevronsLeft} label="Starting Position" />
      <Button onClick={onBack} icon={ChevronLeft} label="Previous Move" />

      {isPlaying ? (
        <Button onClick={onStop} icon={Pause} label="Pause" />
      ) : (
        <Button onClick={onPlay} icon={Play} label="Auto Play" />
      )}

      <Button onClick={onNext} icon={ChevronRight} label="Next Move" />
      <Button onClick={onEnd} icon={ChevronsRight} label="End Position" />
    </div>
  )
}
