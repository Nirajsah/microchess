import React, { useEffect, useState } from 'react'
import Navbar from '../ChessBoard/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import {
  Users,
  Trophy,
  Clock,
  Shield,
  Eye,
  Settings,
  Link as LinkIcon,
  Upload,
  ChevronLeft,
  Save,
  Sparkles,
  Target,
  Gamepad2,
  Calendar,
  DollarSign,
  Tag,
  Image,
  AlertCircle,
  Check,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { hostTournament } from '@/api'
import { useUserStore } from '@/store/microchess'
import { toast } from 'sonner'

// Define input types matching the GraphQL schema
export interface TimeControlInput {
  baseMinutes: number
  incrementSeconds: number
}

export interface TournamentInput {
  organiserName: string
  tournamentName: string
  tournamentDescription: string
  tournamentFormat: TournamentFormat
  matchType: MatchType
  gameMode: GameMode
  timeControl: TimeControlInput
  maxPlayers: number
  minPlayers: number
  startingTime: number // ISO timestamp
  endTime: number // ISO timestamp
  prizeType: PrizeType
  prizePool: number
  prizePoolDescription?: string
  visibility: Visibility
  bannerImageUrl?: string
  sponsorLogoUrl?: string
  status: TournamentStatus
  customTags: string[]
}

// Enums matching GraphQL schema
export enum TournamentFormat {
  SWISS = 'SWISS',
  ROUND_ROBIN = 'ROUND_ROBIN',
  ARENA = 'ARENA',
  SINGLE_ELIM = 'SINGLE_ELIM',
  DOUBLE_ELIM = 'DOUBLE_ELIM',
}

export enum MatchType {
  BO_1 = 'BO_1',
  BO_3 = 'BO_3',
  BO_5 = 'BO_5',
}

export enum GameMode {
  MICROCHESS = 'MICROCHESS',
  STANDARD = 'STANDARD',
  CRAZYHOUSE = 'CRAZYHOUSE',
}

export enum PrizeType {
  NFT = 'NFT',
  TOKENS = 'TOKENS',
}

export enum Visibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum TournamentStatus {
  DRAFT = 'DRAFT',
  REGISTRATION_OPEN = 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED = 'REGISTRATION_CLOSED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Validation errors type
type ValidationErrors = {
  [key: string]: string
}

export default function CreateTournament() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(0)
  const [previewMode, setPreviewMode] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const name = useUserStore((s) => s.userProfile.state?.name)

  const [formData, setFormData] = useState<TournamentInput>({
    organiserName: name || '',
    tournamentName: '',
    tournamentDescription: '',
    tournamentFormat: TournamentFormat.SWISS,
    matchType: MatchType.BO_1,
    gameMode: GameMode.STANDARD,
    timeControl: {
      baseMinutes: 10,
      incrementSeconds: 5,
    },
    maxPlayers: 16,
    minPlayers: 4,
    startingTime: 0,
    endTime: 0,
    prizeType: PrizeType.TOKENS,
    prizePool: 0,
    prizePoolDescription: '',
    visibility: Visibility.PUBLIC,
    bannerImageUrl: '',
    sponsorLogoUrl: '',
    status: TournamentStatus.DRAFT,
    customTags: [],
  })

  useEffect(() => {
    if (name) {
      setFormData((prev) => ({ ...prev, organiserName: name }))
    }
  }, [name])

  const steps = [
    { id: 'basics', title: 'Basic Info', icon: Target },
    { id: 'format', title: 'Format & Rules', icon: Gamepad2 },
    { id: 'schedule', title: 'Schedule', icon: Calendar },
    { id: 'prizes', title: 'Prizes', icon: Trophy },
    { id: 'branding', title: 'Branding', icon: Image },
  ]

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    // Required fields validation
    if (!formData.organiserName.trim()) {
      newErrors.organiserName = 'Organiser name is required'
    }
    if (!formData.tournamentName.trim()) {
      newErrors.tournamentName = 'Tournament name is required'
    }
    if (!formData.gameMode) {
      newErrors.gameMode = 'Game mode is required'
    }
    if (formData.prizePool < 0) {
      newErrors.prizePool = 'Prize pool cannot be negative'
    }
    if (!formData.visibility) {
      newErrors.visibility = 'Visibility is required'
    }

    // Optional but logical validations
    if (formData.minPlayers && formData.maxPlayers) {
      if (formData.minPlayers > formData.maxPlayers) {
        newErrors.minPlayers = 'Min players cannot exceed max players'
      }
    }
    if (formData.startingTime && formData.endTime) {
      if (formData.startingTime > formData.endTime) {
        newErrors.endTime = 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Validate current step
  const validateCurrentStep = (): boolean => {
    const newErrors: ValidationErrors = {}

    switch (currentStep) {
      case 0: // Basic Info
        if (!formData.organiserName.trim()) {
          newErrors.organiserName = 'Organiser name is required'
        }
        if (!formData.tournamentName.trim()) {
          newErrors.tournamentName = 'Tournament name is required'
        }
        break
      case 1: // Format & Rules
        if (!formData.gameMode) {
          newErrors.gameMode = 'Game mode is required'
        }
        break
      case 2: // Schedule
        if (formData.startingTime && formData.endTime) {
          if (formData.startingTime > formData.endTime) {
            newErrors.endTime = 'End time must be after start time'
          }
        }
        break
      case 3: // Prizes
        if (formData.prizePool < 0) {
          newErrors.prizePool = 'Prize pool cannot be negative'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    setFormData((prev) => {
      if (type === 'checkbox') {
        return {
          ...prev,
          [name]: (e.target as HTMLInputElement).checked,
        }
      } else if (type === 'number') {
        return {
          ...prev,
          [name]: Number(value),
        }
      } else if (name === 'customTags') {
        return {
          ...prev,
          [name]: value.split(',').map((s) => s.trim()),
        }
      } else {
        return { ...prev, [name]: value }
      }
    })
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1)
      } else {
        setPreviewMode(true)
      }
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (asDraft: boolean = false) => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors')
      return
    }

    if (!formData.organiserName) {
      toast.error('Organiser name is required. Please update your profile.')
      return
    }

    setIsSubmitting(true)

    const submitData = {
      ...formData,
      prizePool: Number(formData.prizePool),
      status: asDraft ? TournamentStatus.DRAFT : TournamentStatus.REGISTRATION_OPEN,
      customTags: Array.isArray(formData.customTags) ? formData.customTags : [],
    }

    try {
      await hostTournament(submitData)
      toast.success(asDraft ? 'Saved as Draft' : 'Tournament Created!')
      navigate('/tournaments/my')
    } catch (error) {
      console.error('Failed to create tournament:', error)
      toast.error('Failed to create tournament')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation selection:bg-yellow-500/30">
      <Navbar />

      <div className="flex-1 w-full max-w-6xl mx-auto p-6 md:p-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-[#333] pb-6">
          <div>
            <div
              className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-300 transition-colors cursor-pointer"
              onClick={() => navigate('/tournaments')}
            >
              <ChevronLeft className="w-4 h-4" /> Back to Tournaments
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              {previewMode ? 'Review Tournament' : 'Create Tournament'}
            </h1>
            <p className="text-gray-400 mt-2">
              {previewMode
                ? 'Review your tournament details before publishing'
                : 'Set up your competitive event'}
            </p>
          </div>

          {/* Mode Toggle */}
          {!previewMode && (
            <div className="flex items-center bg-[#262626] p-1.5 rounded-xl border border-[#333]">
              <button
                onClick={() => setPreviewMode(false)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${!previewMode
                  ? 'bg-[#333] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Settings className="w-4 h-4" /> Editor
              </button>
              <button
                onClick={() => {
                  if (validateForm()) setPreviewMode(true)
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${previewMode
                  ? 'bg-[#333] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <Eye className="w-4 h-4" /> Preview
              </button>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          {previewMode ? (
            <TournamentPreview
              data={formData}
              onBack={() => setPreviewMode(false)}
              onPublish={() => handleSubmit(false)}
              onSaveDraft={() => handleSubmit(true)}
              isSubmitting={isSubmitting}
            />
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Steps Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-4 sticky top-6">
                  <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 px-2">
                    Steps
                  </h3>
                  <div className="space-y-1">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon
                      const isActive = currentStep === index
                      const isCompleted = currentStep > index

                      return (
                        <button
                          key={step.id}
                          onClick={() => {
                            if (index < currentStep || validateCurrentStep()) {
                              setCurrentStep(index)
                            }
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${isActive
                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
                            : isCompleted
                              ? 'text-gray-300 hover:bg-[#262626]'
                              : 'text-gray-500 hover:bg-[#262626] hover:text-gray-300'
                            }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive
                              ? 'bg-yellow-500/20'
                              : isCompleted
                                ? 'bg-emerald-500/20'
                                : 'bg-[#333]'
                              }`}
                          >
                            {isCompleted ? (
                              <Check className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <StepIcon
                                className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-gray-500'}`}
                              />
                            )}
                          </div>
                          <span className="text-sm font-medium">
                            {step.title}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Step Content */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {currentStep === 0 && (
                      <StepBasicInfo
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        handleChange={handleChange}
                      />
                    )}
                    {currentStep === 1 && (
                      <StepFormatRules
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        handleChange={handleChange}
                      />
                    )}
                    {currentStep === 2 && (
                      <StepSchedule
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        handleChange={handleChange}
                      />
                    )}
                    {currentStep === 3 && (
                      <StepPrizes
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                        handleChange={handleChange}
                      />
                    )}
                    {currentStep === 4 && (
                      <StepBranding
                        formData={formData}
                        setFormData={setFormData}
                        errors={errors}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-6 border-t border-[#333]">
                  <Button
                    variant="outline"
                    onClick={handlePrev}
                    disabled={currentStep === 0}
                    className="bg-transparent border-[#444] text-gray-300 hover:bg-[#333] hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSubmit(true)}
                      className="bg-transparent border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={handleNext}
                      className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold"
                    >
                      {currentStep === steps.length - 1 ? (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Preview
                        </>
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Step Components
function StepBasicInfo({
  formData,
  setFormData,
  errors,
  handleChange,
}: {
  formData: TournamentInput
  setFormData: React.Dispatch<React.SetStateAction<TournamentInput>>
  errors: ValidationErrors
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Target className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Basic Information</h2>
          <p className="text-gray-500 text-sm">
            Set up the core details of your tournament
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FormField
          label="Tournament Name"
          required
          error={errors.tournamentName}
        >
          <Input
            name="tournamentName"
            value={formData.tournamentName}
            onChange={handleChange}
            placeholder="Ex: Winter Championship 2024"
            className={`h-12 bg-[#262626] border-[#333] focus:border-yellow-500/50 text-base rounded-xl text-white placeholder:text-gray-500 ${errors.tournamentName ? 'border-red-500' : ''}`}
          />
        </FormField>

        <FormField label="Organiser Name" required error={errors.organiserName}>
          <Input
            name="organiserName"
            value={formData.organiserName}
            onChange={handleChange}
            placeholder="Your name or organization"
            className={`h-12 bg-[#262626] border-[#333] focus:border-yellow-500/50 text-base rounded-xl text-white placeholder:text-gray-500 ${errors.organiserName ? 'border-red-500' : ''}`}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be displayed as the tournament host
          </p>
        </FormField>

        <FormField label="Description" hint="Optional but recommended">
          <textarea
            name="tournamentDescription"
            value={formData.tournamentDescription}
            onChange={handleChange}
            placeholder="Tell players about the format, rules, and what makes this tournament special..."
            className="w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-500/50 min-h-[160px] resize-y placeholder:text-gray-500 transition-colors"
          />
        </FormField>

        <FormField label="Visibility" required>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                value: Visibility.PUBLIC,
                label: 'Public',
                desc: 'Anyone can view and join',
                icon: Users,
              },
              {
                value: Visibility.PRIVATE,
                label: 'Private',
                desc: 'Invite-only tournament',
                icon: Shield,
              },
            ].map((opt) => {
              const Icon = opt.icon
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      visibility: opt.value,
                    }))
                  }
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${formData.visibility === opt.value
                    ? 'bg-yellow-500/10 border-yellow-500/50 text-white'
                    : 'bg-[#262626] border-[#333] text-gray-400 hover:border-[#444]'
                    }`}
                >
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${formData.visibility === opt.value ? 'text-yellow-500' : 'text-gray-500'}`}
                  />
                  <div>
                    <p className="font-medium">{opt.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </FormField>
      </div>
    </div>
  )
}

function StepFormatRules({
  formData,
  setFormData,
  errors,
  handleChange,
}: {
  formData: TournamentInput
  setFormData: React.Dispatch<React.SetStateAction<TournamentInput>>
  errors: ValidationErrors
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Gamepad2 className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Format & Rules</h2>
          <p className="text-gray-500 text-sm">
            Configure how the tournament will be played
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FormField label="Game Mode" required error={errors.gameMode}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: GameMode.STANDARD, label: 'Standard', desc: 'Classic chess' },
              { value: GameMode.MICROCHESS, label: 'Microchess', desc: '5x5 board' },
              { value: GameMode.CRAZYHOUSE, label: 'Crazyhouse', desc: 'Drop pieces' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, gameMode: opt.value }))
                }
                className={`p-4 rounded-xl border-2 text-center transition-all ${formData.gameMode === opt.value
                  ? 'bg-yellow-500/10 border-yellow-500/50 text-white'
                  : 'bg-[#262626] border-[#333] text-gray-400 hover:border-[#444]'
                  }`}
              >
                <p className="font-medium">{opt.label}</p>
                <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Tournament Format" hint="Optional">
            <Select
              name="tournamentFormat"
              value={formData.tournamentFormat}
              onChange={handleChange}
              options={[
                { label: 'Swiss System', value: TournamentFormat.SWISS },
                { label: 'Round Robin', value: TournamentFormat.ROUND_ROBIN },
                { label: 'Single Elimination', value: TournamentFormat.SINGLE_ELIM },
                { label: 'Double Elimination', value: TournamentFormat.DOUBLE_ELIM },
                { label: 'Arena', value: TournamentFormat.ARENA },
              ]}
            />
          </FormField>

          <FormField label="Match Type" hint="Optional">
            <Select
              name="matchType"
              value={formData.matchType}
              onChange={handleChange}
              options={[
                { label: 'Best of 1', value: MatchType.BO_1 },
                { label: 'Best of 3', value: MatchType.BO_3 },
                { label: 'Best of 5', value: MatchType.BO_5 },
              ]}
            />
          </FormField>
        </div>

        <FormField label="Time Control" hint="Optional">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Base Time (minutes)
              </label>
              <Input
                type="number"
                value={formData.timeControl.baseMinutes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeControl: {
                      ...prev.timeControl,
                      baseMinutes: Number(e.target.value),
                    },
                  }))
                }
                className="bg-[#262626] border-[#333] rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                Increment (seconds)
              </label>
              <Input
                type="number"
                value={formData.timeControl.incrementSeconds}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    timeControl: {
                      ...prev.timeControl,
                      incrementSeconds: Number(e.target.value),
                    },
                  }))
                }
                className="bg-[#262626] border-[#333] rounded-xl"
              />
            </div>
          </div>
        </FormField>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Minimum Players" hint="Optional">
            <Input
              name="minPlayers"
              type="number"
              value={formData.minPlayers}
              onChange={handleChange}
              className={`bg-[#262626] border-[#333] rounded-xl ${errors.minPlayers ? 'border-red-500' : ''}`}
            />
            {errors.minPlayers && (
              <p className="text-xs text-red-400 mt-1">{errors.minPlayers}</p>
            )}
          </FormField>

          <FormField label="Maximum Players" hint="Optional">
            <Input
              name="maxPlayers"
              type="number"
              value={formData.maxPlayers}
              onChange={handleChange}
              className="bg-[#262626] border-[#333] rounded-xl"
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}

function StepSchedule({
  formData,
  setFormData,
  errors,
}: {
  formData: TournamentInput
  setFormData: React.Dispatch<React.SetStateAction<TournamentInput>>
  errors: ValidationErrors
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Schedule</h2>
          <p className="text-gray-500 text-sm">
            Set when your tournament will take place
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Start Date & Time" hint="Optional">
            <Input
              name="startingTime"
              type="datetime-local"
              value={
                formData.startingTime
                  ? new Date(formData.startingTime).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  startingTime: new Date(e.target.value).getTime(),
                }))
              }
              className="bg-[#262626] border-[#333] rounded-xl"
            />
          </FormField>

          <FormField label="End Date & Time" hint="Optional" error={errors.endTime}>
            <Input
              name="endTime"
              type="datetime-local"
              value={
                formData.endTime
                  ? new Date(formData.endTime).toISOString().slice(0, 16)
                  : ''
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  endTime: new Date(e.target.value).getTime(),
                }))
              }
              className={`bg-[#262626] border-[#333] rounded-xl ${errors.endTime ? 'border-red-500' : ''}`}
            />
          </FormField>
        </div>

        <div className="bg-[#262626] rounded-xl p-4 border border-[#333]">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-white font-medium">Schedule Tips</p>
              <ul className="text-sm text-gray-400 mt-2 space-y-1">
                <li>• Leave dates empty if you want to announce them later</li>
                <li>• Give players enough time to register before the start</li>
                <li>• Consider time zones of your expected participants</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepPrizes({
  formData,
  setFormData,
  errors,
  handleChange,
}: {
  formData: TournamentInput
  setFormData: React.Dispatch<React.SetStateAction<TournamentInput>>
  errors: ValidationErrors
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Trophy className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Prizes & Rewards</h2>
          <p className="text-gray-500 text-sm">
            What are players competing for?
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Prize Type" hint="Optional">
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: PrizeType.TOKENS, label: 'Tokens', icon: DollarSign },
                { value: PrizeType.NFT, label: 'NFT', icon: Sparkles },
              ].map((opt) => {
                const Icon = opt.icon
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, prizeType: opt.value }))
                    }
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${formData.prizeType === opt.value
                      ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500'
                      : 'bg-[#262626] border-[#333] text-gray-400 hover:border-[#444]'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{opt.label}</span>
                  </button>
                )
              })}
            </div>
          </FormField>

          <FormField
            label="Prize Pool"
            required
            error={errors.prizePool}
            hint="Total value in USD"
          >
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                name="prizePool"
                type="number"
                value={formData.prizePool}
                onChange={handleChange}
                placeholder="1000"
                className={`pl-8 bg-[#262626] border-[#333] rounded-xl ${errors.prizePool ? 'border-red-500' : ''}`}
              />
            </div>
          </FormField>
        </div>

        <FormField label="Prize Distribution" hint="Optional">
          <textarea
            name="prizePoolDescription"
            value={formData.prizePoolDescription}
            onChange={handleChange}
            placeholder="1st Place: $500&#10;2nd Place: $300&#10;3rd Place: $200"
            className="w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-500/50 min-h-[120px] resize-y placeholder:text-gray-500 transition-colors"
          />
          <p className="text-xs text-gray-500 mt-1">
            Describe how prizes will be distributed among winners
          </p>
        </FormField>
      </div>
    </div>
  )
}

function StepBranding({
  formData,
  setFormData,
}: {
  formData: TournamentInput
  setFormData: React.Dispatch<React.SetStateAction<TournamentInput>>
  errors: ValidationErrors
}) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <Image className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Branding</h2>
          <p className="text-gray-500 text-sm">
            Make your tournament stand out
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ImageUploadInput
            label="Banner Image"
            name="bannerImageUrl"
            value={formData.bannerImageUrl || ''}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, bannerImageUrl: val }))
            }
            aspect="aspect-[3/1]"
            hint="Recommended: 1200x400px"
          />
          <ImageUploadInput
            label="Sponsor Logo"
            name="sponsorLogoUrl"
            value={formData.sponsorLogoUrl || ''}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, sponsorLogoUrl: val }))
            }
            aspect="aspect-square"
            hint="Recommended: 200x200px"
          />
        </div>

        <FormField label="Tags" hint="Comma separated">
          <div className="relative">
            <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              name="customTags"
              value={formData.customTags?.join(', ')}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  customTags: e.target.value.split(',').map((s) => s.trim()),
                }))
              }
              placeholder="competitive, blitz, beginner-friendly"
              className="pl-10 bg-[#262626] border-[#333] rounded-xl"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Help players discover your tournament
          </p>
        </FormField>
      </div>
    </div>
  )
}

// Preview Component
function TournamentPreview({
  data,
  onBack,
  onPublish,
  onSaveDraft,
  isSubmitting,
}: {
  data: TournamentInput
  onBack: () => void
  onPublish: () => void
  onSaveDraft: () => void
  isSubmitting: boolean
}) {
  return (
    <motion.div
      key="preview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      {/* Hero Preview */}
      <div className="relative w-full h-80 rounded-2xl overflow-hidden bg-[#262626] border border-[#333] group">
        {data.bannerImageUrl ? (
          <>
            <img
              src={data.bannerImageUrl}
              alt="Banner"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161616]/90 via-[#161616]/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#262626] to-[#1a1a1a]">
            <Trophy className="w-20 h-20 text-[#333]" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-6">
          {data.sponsorLogoUrl && (
            <div className="w-20 h-20 rounded-xl bg-[#161616] border-2 border-[#333] overflow-hidden flex-shrink-0">
              <img
                src={data.sponsorLogoUrl}
                alt="Sponsor"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <div className="flex gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-500 text-xs font-bold uppercase">
                {data.tournamentFormat}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase">
                {data.visibility}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              {data.tournamentName || 'Untitled Tournament'}
            </h1>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">About</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {data.tournamentDescription || 'No description provided.'}
            </p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreviewCard label="Game Mode" value={data.gameMode} />
            <PreviewCard label="Match Type" value={data.matchType} />
            <PreviewCard
              label="Time Control"
              value={`${data.timeControl.baseMinutes}+${data.timeControl.incrementSeconds}`}
            />
            <PreviewCard
              label="Players"
              value={`${data.minPlayers} - ${data.maxPlayers}`}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#262626] to-[#1f1f1f] border border-[#333] rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">Prize Pool</p>
            <p className="text-4xl font-black text-yellow-500">
              ${data.prizePool}
            </p>
            <span className="text-xs text-gray-500 uppercase">
              {data.prizeType}
            </span>
          </div>

          <div className="bg-[#1f1f1f] border border-[#333] rounded-2xl p-6">
            <p className="text-gray-400 text-sm mb-2">Organized by</p>
            <p className="text-white font-bold">{data.organiserName}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[#333]">
        <Button
          variant="outline"
          onClick={onBack}
          className="bg-transparent border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Editor
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onSaveDraft}
            disabled={isSubmitting}
            className="bg-transparent border-[#444] text-gray-300 hover:bg-[#333] hover:text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={onPublish}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold px-8"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Publish Tournament
              </>
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

// Helper Components
function FormField({
  label,
  required = false,
  hint,
  error,
  children,
}: {
  label: string
  required?: boolean
  hint?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400">*</span>}
        {hint && <span className="text-gray-500 font-normal">({hint})</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  )
}

function Select({
  name,
  value,
  onChange,
  options,
}: {
  name: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="relative">
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="w-full h-11 bg-[#262626] border border-[#333] rounded-xl px-4 text-white text-sm focus:border-yellow-500/50 appearance-none outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronLeft className="w-4 h-4 text-gray-600 -rotate-90" />
      </div>
    </div>
  )
}

function ImageUploadInput({
  label,
  value,
  onChange,
  aspect = 'aspect-video',
  hint,
}: {
  label: string
  name: string
  value: string
  aspect?: string
  hint?: string
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
        <div>
          <label className="text-sm font-medium text-gray-300 block">
            {label}
          </label>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        <div className="flex gap-1 bg-[#262626] p-1 rounded-lg">
          <button
            onClick={() => setMode('link')}
            className={`text-xs px-3 py-1.5 rounded-md transition-all ${mode === 'link' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <LinkIcon className="w-3 h-3 inline mr-1" />
            URL
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`text-xs px-3 py-1.5 rounded-md transition-all ${mode === 'upload' ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
          >
            <Upload className="w-3 h-3 inline mr-1" />
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
              referrerPolicy="no-referrer"
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
                  className="h-9 text-xs bg-[#1f1f1f] border-[#333] text-center rounded-lg"
                  placeholder="Paste image URL..."
                  onChange={(e) => onChange(e.target.value)}
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

function PreviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#1f1f1f] border border-[#333] rounded-xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-white font-bold">{value}</p>
    </div>
  )
}
