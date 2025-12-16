import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { hostTournament, myTournament, updateTournament } from '@/api'
import { PrizeType, TournamentStatus, Visibility } from './CreateTournament'
import { toast } from 'sonner'

export type TournamentUpdate = {
  tournamentName?: string
  tournamentDescription?: string
  bannerImageUrl?: string
  sponsorLogoUrl?: string
  customTags?: string[]
  status: TournamentStatus
  prizePool: number
  prizeType?: PrizeType
  visibility: Visibility
}

export default function ManageTournament() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tournament, setTournament] = useState<any>(null)
  const [formData, setFormData] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMyTournament = async () => {
      try {
        const response = await myTournament(id!)
        const data = JSON.parse(response.result).data.myTournament
        setTournament(data)
        setFormData(data)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching my tournaments:', error)
      }
    }
    fetchMyTournament()
  }, [id])

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
    setHasChanges(true)
  }

  const handleUpdate = () => {
    // Mock update API call
    setTournament(formData)
    setHasChanges(false)
    const submitData = {
      ...formData,
      prizeType: formData.prizeType || PrizeType.TOKENS,
      prizePool: Number(formData.prizePool),
      customTags: Array.isArray(formData.customTags) ? formData.customTags : [],
    }

    updateTournament(tournament.tournamentId, submitData)
      .then(() => {
        toast.success('Tournament Update Saved')
      })
      .catch(() => {
        toast.error('Failed to Update')
      })
  }

  const handlePublish = async () => {
    // Mock publish API call
    const submitData = {
      ...formData,
      prizePool: Number(formData.prizePool),
      status: TournamentStatus.REGISTRATION_OPEN,
      customTags: Array.isArray(formData.customTags) ? formData.customTags : [],
    }
    try {
      await hostTournament(submitData)
      setTournament(submitData)
      toast.success('Tournament Created')
    } catch (error) {
      console.error('Failed to create tournament:', error)
    }
  }

  const deleteTournament = () => {
    // if (confirm('Are you sure you want to delete this tournament?')) {
    //   alert('Tournament deleted')
    //   navigate('/tournaments/my')
    // }
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

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation selection:bg-yellow-500/30 p-6 md:p-8">
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
            {!formData.status && formData.status == 'DRAFT' && (
              <Button
                className="bg-yellow-600 hover:bg-yellow-500 text-white shadow-lg shadow-yellow-900/20"
                onClick={handlePublish}
              >
                <Share2 className="w-4 h-4 mr-2" /> Publish Now
              </Button>
            )}
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
                <div className="space-y-2">
                  <Label>Tournament Name</Label>
                  <Input
                    name="tournamentName"
                    value={formData.tournamentName}
                    onChange={handleChange}
                    className="h-12 bg-[#262626] border-[#333] focus:border-yellow-600/50 text-base rounded-xl text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <textarea
                    name="tournamentDescription"
                    value={formData.tournamentDescription || ''}
                    onChange={handleChange}
                    className="w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-600/50 min-h-[160px] resize-y placeholder:text-gray-500 transition-colors"
                  />
                </div>
              </div>
            </Section>

            <Section title="Branding" description="Update tournament assets.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ImageUploadInput
                  label="Banner Image"
                  name="bannerImageUrl"
                  value={formData.bannerImageUrl}
                  onChange={(val) => {
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
                  onChange={(val) => {
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
                      : 'bg-yellow-500/20 text-yellow-500'
                  }`}
                >
                  {formData.status}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select
                    name="tournamentFormat"
                    value={formData.tournamentFormat}
                    onChange={handleChange}
                    options={[
                      'Swiss',
                      'Round Robin',
                      'Single Elimination',
                      'Arena',
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Players</Label>
                    <Input
                      name="maxPlayers"
                      type="number"
                      value={formData.maxPlayers}
                      onChange={handleChange}
                      className="bg-[#1f1f1f] border-[#333] rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      name="timeControl"
                      value={formData.timeControl}
                      onChange={handleChange}
                      className="bg-[#1f1f1f] border-[#333] rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    name="startingTime"
                    type="datetime-local"
                    value={formData.starting_time}
                    onChange={handleChange}
                    className="bg-[#1f1f1f] border-[#333] text-sm rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prize Pool ($)</Label>
                  <Input
                    name="prizePool"
                    value={formData.prizePool}
                    onChange={handleChange}
                    className="bg-[#1f1f1f] border-[#333] rounded-xl"
                  />
                </div>

                <div className="pt-4 border-t border-[#333]">
                  <Label>Visibility</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.values(Visibility).map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            visibility: opt, // Sets actual enum value (e.g., "PUBLIC")
                          }))
                          setHasChanges(true)
                        }}
                        className={`py-2 text-sm font-medium rounded-lg border transition-all ${
                          formData.visibility === opt
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                            : 'bg-[#1f1f1f] border-[#333] text-gray-500 hover:border-[#444]'
                        }`}
                      >
                        {/* Display human-readable version */}
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

const Select = ({ name, value, onChange, options }: any) => (
  <div className="relative">
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full h-10 bg-[#262626] border border-[#333] rounded-xl px-3 text-white text-sm focus:border-yellow-600/50 appearance-none outline-none cursor-pointer"
    >
      {options.map((opt: string) => (
        <option key={opt}>{opt}</option>
      ))}
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
}: {
  label: string
  name: string
  value: string
  aspect?: string
  onChange: (val: string) => void
}) {
  const [mode, setMode] = useState<'link' | 'upload'>('link')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onChange(URL.createObjectURL(e.target.files[0]))
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('link')}
            className={`text-xs px-2 py-1 rounded ${mode === 'link' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'}`}
          >
            Link
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`text-xs px-2 py-1 rounded ${mode === 'upload' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'}`}
          >
            Upload
          </button>
        </div>
      </div>

      <div
        className={`w-full ${aspect} bg-[#262626] border-2 border-dashed border-[#333] rounded-xl overflow-hidden relative group hover:border-[#444] transition-colors`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onChange('')}
              >
                Remove
              </Button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-6">
            {mode === 'link' ? (
              <div className="w-full max-w-xs space-y-2">
                <LinkIcon className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <Input
                  className="h-8 text-xs bg-[#1f1f1f] border-[#333] text-center rounded-lg"
                  placeholder="Paste URL..."
                  onChange={(e) => onChange(e.target.value)}
                  autoFocus
                />
              </div>
            ) : (
              <label className="cursor-pointer text-center">
                <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <span className="text-xs">Click to upload</span>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
