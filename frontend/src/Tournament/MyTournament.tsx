import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Shield,
  Settings,
  Link as LinkIcon,
  Upload,
  ChevronLeft,
  Edit,
  Trash2,
  Share2,
  AlertTriangle,
  X,
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { myTournament, updateTournament, updateTournamentLocal } from '@/api'
import { toast } from 'sonner'
import {
  GameMode,
  MatchType,
  PrizeType,
  TournamentFormat,
  TournamentStatus,
  Visibility,
} from '@/graphql/graphql'
import { datetimeLocalToMicros, microsToDatetimeLocal } from './utils'
import { useWalletStore } from '@/store/wallet'

// Fields that can be updated when tournament is in REGISTRATION_OPEN state
const REGISTRATION_OPEN_EDITABLE_FIELDS = [
  'tournamentName',
  'tournamentDescription',
  'bannerImageUrl',
  'sponsorLogoUrl',
  'customTags',
  'status',
  'visibility',
]

export default function ManageTournament() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const refetch = useWalletStore((s) => s.refetch)

  // Check if tournament is in a state where status can be changed to open registration
  const isTransitioningToOpen =
    tournament?.status === TournamentStatus.Draft &&
    formData?.status === TournamentStatus.RegistrationClosed

  // Check if a field is editable based on tournament status
  const isFieldEditable = (fieldName: string): boolean => {
    if (!tournament) return false
    // In DRAFT state, all fields are editable
    if (tournament.status === TournamentStatus.Draft) return true
    // In REGISTRATION_OPEN state, only certain fields are editable
    if (tournament.status === TournamentStatus.RegistrationOpen) {
      return REGISTRATION_OPEN_EDITABLE_FIELDS.includes(fieldName)
    }
    // In other states, nothing is editable
    return false
  }

  useEffect(() => {
    const fetchMyTournament = async () => {
      try {
        const response = await myTournament(id!)
        const data = JSON.parse(response).data.myTournament
        setTournament(data)
        setFormData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching my tournaments:', error)
        setLoading(false)
      }
    }
    fetchMyTournament()
  }, [id, refetch])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target
    if (!isFieldEditable(name)) return

    setFormData((prev: any) => {
      if (type === 'number') {
        return { ...prev, [name]: Number(value) }
      } else if (name === 'customTags') {
        return {
          ...prev,
          [name]: value.split(',').map((s) => s.trim()),
        }
      }
      return { ...prev, [name]: value }
    })
    setHasChanges(true)
  }

  const handleUpdate = () => {
    // Check if transitioning from DRAFT to REGISTRATION_OPEN
    if (isTransitioningToOpen) {
      setShowPublishConfirm(true)
      return
    }

    performUpdate()
  }

  const performUpdate = () => {
    setTournament(formData)
    setHasChanges(false)
    const submitData = {
      ...formData,
      prizeType: formData.prizeType || PrizeType.Tokens,
      prizePool: Number(formData.prizePool),
      customTags: Array.isArray(formData.customTags) ? formData.customTags : [],
    }

    if (tournament.status === TournamentStatus.Draft) {
      updateTournamentLocal(tournament.tournamentId, submitData)
        .then(() => {
          toast.success('Tournament Update Saved')
          setShowPublishConfirm(false)
        })
        .catch(() => {
          toast.error('Failed to Update')
        })
    } else {
      updateTournament(tournament.tournamentId, submitData)
        .then(() => {
          toast.success('Tournament Update Saved')
          setShowPublishConfirm(false)
        })
        .catch(() => {
          toast.error('Failed to Update')
        })
    }
  }

  const deleteTournament = () => {
    // TODO: Implement delete functionality
    alert('not yet implemented')
  }

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    )
  if (!tournament)
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Tournament not found
      </div>
    )

  const isDraft = tournament.status === TournamentStatus.Draft

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation selection:bg-yellow-500/30 p-6 md:p-8">
      {/* Publish Confirmation Modal */}
      <AnimatePresence>
        {showPublishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPublishConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#262626] border border-[#333] rounded-[18px] p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Publish Tournament?
                  </h3>
                  <p className="text-gray-400 text-sm">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed">
                You are about to{' '}
                <span className="text-yellow-500 font-semibold">publish</span>{' '}
                this tournament. Once published:
              </p>

              <ul className="space-y-2 mb-8 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  The tournament will be visible to all players
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  Players can start registering immediately
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  Some settings will become locked and non-editable
                </li>
              </ul>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent border-[#444] text-gray-300 hover:bg-[#333] hover:border-[#555]"
                  onClick={() => setShowPublishConfirm(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white"
                  onClick={performUpdate}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Yes, Publish
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="max-w-7xl mx-auto w-full space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#333] pb-6">
          <div>
            <div
              className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-300 transition-colors cursor-pointer"
              onClick={() => navigate('/tournaments/my')}
            >
              <ChevronLeft className="w-4 h-4" /> Back to My Tournaments
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              <Settings className="w-8 h-8 text-yellow-500" />
              Manage: {tournament.tournamentName}
            </h1>
          </div>
          <div className="flex gap-3">
            <Button
              variant="destructive"
              className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20"
              onClick={deleteTournament}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button
              disabled={!hasChanges}
              className="bg-white text-black hover:bg-gray-200"
              onClick={handleUpdate}
            >
              <Edit className="w-4 h-4 mr-2" /> Save Changes
            </Button>
            {/* {isDraft && formData.status === TournamentStatus.DRAFT && (
              <Button
                className="bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20"
                onClick={handlePublish}
              >
                <Share2 className="w-4 h-4 mr-2" /> Publish Now
              </Button>
            )} */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Form */}
          <div className="lg:col-span-8 space-y-10">
            <Section
              title="General Information"
              description="Update the basic details of your tournament."
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tournament Name</Label>
                    <Input
                      name="tournamentName"
                      value={formData.tournamentName}
                      onChange={handleChange}
                      disabled={!isFieldEditable('tournamentName')}
                      className={`h-12 bg-[#262626] border-[#333] focus:border-yellow-600/50 text-base rounded-xl text-white ${!isFieldEditable('tournamentName') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Organiser Name</Label>
                    <Input
                      name="organiserName"
                      value={formData.organiserName || ''}
                      disabled
                      className="h-12 bg-[#262626] border-[#333] text-base rounded-xl text-white opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">
                      Cannot be changed after creation
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    name="tournamentDescription"
                    value={formData.tournamentDescription || ''}
                    onChange={handleChange}
                    disabled={!isFieldEditable('tournamentDescription')}
                    className={`w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-600/50 min-h-[160px] resize-y placeholder:text-gray-500 transition-colors ${!isFieldEditable('tournamentDescription') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
            </Section>

            <Section
              title="Prizes & Rewards"
              description="Update the prize configuration for your tournament."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Prize Type</Label>
                  {!isDraft && (
                    <span className="text-gray-500 text-xs">(Locked)</span>
                  )}
                  <Select
                    name="prizeType"
                    value={formData.prizeType || PrizeType.Tokens}
                    onChange={handleChange}
                    disabled={!isFieldEditable('prizeType')}
                    options={[
                      { label: 'Tokens', value: PrizeType.Tokens },
                      { label: 'NFT', value: PrizeType.Nft },
                    ]}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prize Pool ($)</Label>
                  {!isDraft && (
                    <span className="text-gray-500 text-xs">(Locked)</span>
                  )}
                  <Input
                    name="prizePool"
                    type="number"
                    value={formData.prizePool}
                    onChange={handleChange}
                    disabled={!isFieldEditable('prizePool')}
                    className={`bg-[#1f1f1f] border-[#333] rounded-xl ${!isFieldEditable('prizePool') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-6">
                <Label>Prize Description</Label>
                {!isDraft && (
                  <span className="text-gray-500 text-xs">(Locked)</span>
                )}
                <textarea
                  name="prizePoolDescription"
                  value={formData.prizePoolDescription || ''}
                  onChange={handleChange}
                  disabled={!isFieldEditable('prizePoolDescription')}
                  placeholder="Detailed breakdown of the prize distribution"
                  className={`w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-600/50 min-h-[100px] resize-y placeholder:text-gray-500 transition-colors ${!isFieldEditable('prizePoolDescription') ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </Section>

            <Section title="Branding" description="Update tournament assets.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUploadInput
                  label="Banner Image"
                  name="bannerImageUrl"
                  value={formData.bannerImageUrl}
                  disabled={!isFieldEditable('bannerImageUrl')}
                  onChange={(val) => {
                    if (!isFieldEditable('bannerImageUrl')) return
                    setFormData((prev: any) => ({
                      ...prev,
                      bannerImageUrl: val,
                    }))
                    setHasChanges(true)
                  }}
                  aspect="aspect-[3/1]"
                />
                <ImageUploadInput
                  label="Sponsor Logo"
                  name="sponsorLogoUrl"
                  value={formData.sponsorLogoUrl}
                  disabled={!isFieldEditable('sponsorLogoUrl')}
                  onChange={(val) => {
                    if (!isFieldEditable('sponsorLogoUrl')) return
                    setFormData((prev: any) => ({
                      ...prev,
                      sponsorLogoUrl: val,
                    }))
                    setHasChanges(true)
                  }}
                  aspect="aspect-square"
                />
              </div>
            </Section>

            <Section
              title="Custom Tags"
              description="Add tags to help players find your tournament."
            >
              <div className="space-y-2">
                <Label>Tags (Comma separated)</Label>
                <Input
                  name="customTags"
                  value={
                    Array.isArray(formData.customTags)
                      ? formData.customTags.join(', ')
                      : ''
                  }
                  onChange={handleChange}
                  disabled={!isFieldEditable('customTags')}
                  placeholder="fun, blitz, beginner"
                  className={`bg-[#1f1f1f] border-[#333] rounded-xl text-sm ${!isFieldEditable('customTags') ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </Section>
          </div>

          {/* Right Column: Settings & Status */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-[#262626] border border-[#333] rounded-[18px] p-6 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-xl flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-yellow-500" /> Configuration
                </h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    formData.status === 'DRAFT'
                      ? 'bg-green-500/20 text-green-500'
                      : formData.status === 'REGISTRATION_OPEN'
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : formData.status === 'IN_PROGRESS'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-gray-500/20 text-gray-500'
                  }`}
                >
                  {formData.status?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="space-y-6">
                {/* Status Selector - Only show in DRAFT */}
                {isDraft && (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={!isFieldEditable('status')}
                      options={[
                        { label: 'Draft', value: TournamentStatus.Draft },
                        {
                          label: 'Open Registration',
                          value: TournamentStatus.RegistrationOpen,
                        },
                        // { label: 'In Progress', value: TournamentStatus.IN_PROGRESS },
                        // {
                        //   label: 'Completed',
                        //   value: TournamentStatus.COMPLETED,
                        // },
                      ]}
                    />
                    {isTransitioningToOpen && (
                      <p className="text-xs text-yellow-500 mt-1">
                        ⚠️ Saving will publish this tournament
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>
                    Format{' '}
                    {!isDraft && (
                      <span className="text-gray-500 text-xs">(Locked)</span>
                    )}
                  </Label>
                  <Select
                    name="tournamentFormat"
                    value={formData.tournamentFormat}
                    onChange={handleChange}
                    disabled={!isFieldEditable('tournamentFormat')}
                    options={[
                      { label: 'Swiss', value: TournamentFormat.Swiss },
                      {
                        label: 'Round Robin',
                        value: TournamentFormat.RoundRobin,
                      },
                      {
                        label: 'Single Elimination',
                        value: TournamentFormat.SingleElim,
                      },
                      {
                        label: 'Double Elimination',
                        value: TournamentFormat.DoubleElim,
                      },
                      { label: 'Arena', value: TournamentFormat.Arena },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Game Mode{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Select
                      name="gameMode"
                      value={formData.gameMode}
                      onChange={handleChange}
                      disabled={!isFieldEditable('gameMode')}
                      options={[
                        { label: 'Standard', value: GameMode.Standard },
                        { label: 'Microchess', value: GameMode.Microchess },
                        { label: 'CrazyHouse', value: GameMode.Crazyhouse },
                      ]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Match Type{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Select
                      name="matchType"
                      value={formData.matchType}
                      onChange={handleChange}
                      disabled={!isFieldEditable('matchType')}
                      options={[
                        { label: 'Bo1', value: MatchType.Bo_1 },
                        { label: 'Bo3', value: MatchType.Bo_3 },
                        { label: 'Bo5', value: MatchType.Bo_5 },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Max Players{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Input
                      name="maxPlayers"
                      type="number"
                      value={formData.maxPlayers}
                      onChange={handleChange}
                      disabled={!isFieldEditable('maxPlayers')}
                      className={`bg-[#1f1f1f] border-[#333] rounded-xl ${!isFieldEditable('maxPlayers') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Min Players{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Input
                      name="minPlayers"
                      type="number"
                      value={formData.minPlayers}
                      onChange={handleChange}
                      disabled={!isFieldEditable('minPlayers')}
                      className={`bg-[#1f1f1f] border-[#333] rounded-xl ${!isFieldEditable('minPlayers') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>
                    Time Control{' '}
                    {!isDraft && (
                      <span className="text-gray-500 text-xs">(Locked)</span>
                    )}
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Base (minutes)
                      </p>
                      <Input
                        name="timeControl.baseMinutes"
                        type="number"
                        value={formData.timeControl?.baseMinutes || 0}
                        onChange={(e) => {
                          if (!isFieldEditable('timeControl')) return
                          setFormData((prev: any) => ({
                            ...prev,
                            timeControl: {
                              ...prev.timeControl,
                              baseMinutes: Number(e.target.value),
                            },
                          }))
                          setHasChanges(true)
                        }}
                        disabled={!isFieldEditable('timeControl')}
                        className={`bg-[#1f1f1f] border-[#333] rounded-xl ${!isFieldEditable('timeControl') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">
                        Increment (sec)
                      </p>
                      <Input
                        name="timeControl.incrementSeconds"
                        type="number"
                        value={formData.timeControl?.incrementSeconds || 0}
                        onChange={(e) => {
                          if (!isFieldEditable('timeControl')) return
                          setFormData((prev: any) => ({
                            ...prev,
                            timeControl: {
                              ...prev.timeControl,
                              incrementSeconds: Number(e.target.value),
                            },
                          }))
                          setHasChanges(true)
                        }}
                        disabled={!isFieldEditable('timeControl')}
                        className={`bg-[#1f1f1f] border-[#333] rounded-xl ${!isFieldEditable('timeControl') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>
                      Start Date{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Input
                      name="startingTime"
                      type="datetime-local"
                      // value={
                      //   formData.startingTime
                      //     ? new Date(formData.startingTime)
                      //         .toISOString()
                      //         .slice(0, 16)
                      //     : ''
                      // }
                      // onChange={handleChange}
                      value={microsToDatetimeLocal(formData.startingTime)}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          endTime: datetimeLocalToMicros(e.target.value)!,
                        }))
                      }
                      disabled={!isFieldEditable('startingTime')}
                      className={`bg-[#1f1f1f] border-[#333] text-sm rounded-xl ${!isFieldEditable('startingTime') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      End Date{' '}
                      {!isDraft && (
                        <span className="text-gray-500 text-xs">(Locked)</span>
                      )}
                    </Label>
                    <Input
                      name="endTime"
                      type="datetime-local"
                      // value={
                      //   formData.endTime
                      //     ? new Date(formData.endTime)
                      //         .toISOString()
                      //         .slice(0, 16)
                      //     : ''
                      // }
                      // onChange={handleChange}
                      value={microsToDatetimeLocal(formData.endTime)}
                      onChange={(e) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          endTime: datetimeLocalToMicros(e.target.value)!,
                        }))
                      }
                      disabled={!isFieldEditable('endTime')}
                      className={`bg-[#1f1f1f] border-[#333] text-sm rounded-xl ${!isFieldEditable('endTime') ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-[#333]">
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.values(Visibility).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          if (!isFieldEditable('visibility')) return
                          setFormData((prev: any) => ({
                            ...prev,
                            visibility: opt,
                          }))
                          setHasChanges(true)
                        }}
                        disabled={!isFieldEditable('visibility')}
                        className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                          formData.visibility === opt
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                            : 'bg-[#1f1f1f] border-[#333] text-gray-500 hover:border-[#444]'
                        } ${!isFieldEditable('visibility') ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {opt.toLowerCase() === 'public'
                          ? 'Public'
                          : opt.toLowerCase() === 'private'
                            ? 'Private'
                            : opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Panel for non-draft tournaments */}
            {!isDraft && (
              <div className="bg-[#1f1f1f] border border-[#333] rounded-[18px] p-4">
                <p className="text-sm text-gray-400">
                  <span className="text-yellow-500 font-medium">Note:</span>{' '}
                  Some fields are locked because this tournament is no longer in
                  draft mode. Only cosmetic settings can be modified.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Reused Components
const Section = ({ title, description, children }: any) => (
  <div className="space-y-6">
    <div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
    {children}
  </div>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <label className="text-sm font-medium text-gray-400 block mb-1.5">
    {children}
  </label>
)

const Select = ({
  name,
  value,
  onChange,
  options,
  disabled = false,
}: {
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { label: string; value: string }[] | string[]
  disabled?: boolean
}) => (
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full h-10 bg-[#262626] border border-[#333] rounded-xl px-3 text-white text-sm focus:border-yellow-600/50 appearance-none outline-none cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {options.map((opt: any) => {
        const val = typeof opt === 'object' ? opt.value : opt
        const label = typeof opt === 'object' ? opt.label : opt
        return (
          <option key={String(val)} value={val}>
            {label}
          </option>
        )
      })}
    </select>
    <div className="absolute right-3 top-3 pointer-events-none">
      <ChevronLeft className="w-4 h-4 text-gray-600 -rotate-90" />
    </div>
  </div>
)

function ImageUploadInput({
  label,
  value,
  onChange,
  aspect = 'aspect-video',
  disabled = false,
}: {
  label: string
  name: string
  value: string
  aspect?: string
  onChange: (val: string) => void
  disabled?: boolean
}) {
  const [mode, setMode] = useState<'link' | 'upload'>('link')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return
    if (e.target.files && e.target.files[0]) {
      onChange(URL.createObjectURL(e.target.files[0]))
    }
  }

  return (
    <div className={`space-y-3 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <button
            onClick={() => !disabled && setMode('link')}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded ${mode === 'link' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'} ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Link
          </button>
          <button
            onClick={() => !disabled && setMode('upload')}
            disabled={disabled}
            className={`text-xs px-2 py-1 rounded ${mode === 'upload' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'} ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            Upload
          </button>
        </div>
      </div>

      <div
        className={`w-full ${aspect} bg-[#262626] border-2 border-dashed border-[#333] rounded-xl overflow-hidden relative group hover:border-[#444] transition-colors ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onChange('')}
                >
                  Remove
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-6">
            {mode === 'link' ? (
              <div className="w-full max-w-xs space-y-2">
                <LinkIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <Input
                  className="h-8 text-xs bg-[#1f1f1f] border-[#333] text-center rounded-lg"
                  placeholder="Paste URL..."
                  onChange={(e) => !disabled && onChange(e.target.value)}
                  disabled={disabled}
                  autoFocus={!disabled}
                />
              </div>
            ) : (
              <label
                className={`${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-center`}
              >
                <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span className="text-xs">Click to upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={disabled}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
