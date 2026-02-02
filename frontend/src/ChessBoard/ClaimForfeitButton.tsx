import React from 'react'
import { Button } from '@/components/ui/button'
import { claimForfeit } from '@/api'
import { toast } from 'sonner'

interface ClaimForfeitButtonProps {
  canClaim: boolean
}

const ClaimForfeitButton: React.FC<ClaimForfeitButtonProps> = ({ canClaim }) => {
  const handleClaimForfeit = async () => {
    try {
      await claimForfeit()
      toast.success('Forfeit claimed successfully')
    } catch (error) {
      toast.error('Failed to claim forfeit')
      console.error('Error claiming forfeit:', error)
    }
  }

  if (!canClaim) return null

  return (
    <Button
      onClick={handleClaimForfeit}
      className="w-full bg-red-600 hover:bg-red-700 text-white"
      variant="destructive"
    >
      Claim Win (Opponent Timed Out)
    </Button>
  )
}

export default ClaimForfeitButton