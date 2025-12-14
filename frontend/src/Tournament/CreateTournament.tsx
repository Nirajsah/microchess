
import React, { useState } from 'react'
import Navbar from '../ChessBoard/Navbar'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Users, Trophy, Clock, Shield, Globe, Eye, Settings, Link as LinkIcon, Upload, Calendar, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CreateTournament() {
    const navigate = useNavigate()
    const [previewMode, setPreviewMode] = useState(false)
    const [formData, setFormData] = useState({
        tournament_name: '',
        tournament_description: '',
        tournament_format: 'Swiss',
        max_players: 16,
        match_type: 'Bo1',
        time_control: '10+0',
        starting_time: '',
        prize_pool: '',
        visibility: 'Public',
        banner_image_url: '',
        sponsor_logo_url: ''
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = () => {
        console.log('Creating tournament:', formData)
        navigate('/tournaments')
    }

    return (
        <div className="min-h-screen w-full bg-[#161616] text-white flex flex-col font-sansation selection:bg-yellow-500/30">
            <Navbar />

            <div className="flex-1 w-full max-w-7xl mx-auto p-6 md:p-8">
                {/* Header Section */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-[#333] pb-8">
                    <div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 hover:text-gray-300 transition-colors cursor-pointer" onClick={() => navigate('/tournaments')}>
                            <ChevronLeft className="w-4 h-4" /> Back to Tournaments
                        </div>
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            {previewMode ? 'Preview Tournament' : 'Host a Tournament'}
                        </h1>
                        <p className="text-gray-400 mt-2 text-lg">
                            Configure your competitive event details below.
                        </p>
                    </div>

                    <div className="flex items-center bg-[#262626] p-1.5 rounded-[18px] border border-[#333]">
                        <button
                            onClick={() => setPreviewMode(false)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-medium transition-all ${!previewMode
                                ? 'bg-[#333] text-white shadow-sm ring-1 ring-white/5'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Settings className="w-4 h-4" /> Editor
                        </button>
                        <button
                            onClick={() => setPreviewMode(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-[14px] text-sm font-medium transition-all ${previewMode
                                ? 'bg-[#333] text-white shadow-sm ring-1 ring-white/5'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Eye className="w-4 h-4" /> Preview
                        </button>
                    </div>
                </header>

                {previewMode ? (
                    <TournamentPreview data={formData} onConfirm={handleSubmit} />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                    >
                        {/* Left Column: Main Info */}
                        <div className="lg:col-span-8 space-y-10">
                            <Section title="General Information" description="Basic details about your tournament.">
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Tournament Name</Label>
                                        <Input
                                            name="tournament_name"
                                            value={formData.tournament_name}
                                            onChange={handleChange}
                                            placeholder="Ex: Winter Championship 2024"
                                            className="h-12 bg-[#262626] border-[#333] focus:border-yellow-600/50 text-base rounded-xl text-white placeholder:text-gray-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <textarea
                                            name="tournament_description"
                                            value={formData.tournament_description}
                                            onChange={handleChange}
                                            placeholder="Tell players about the format, rules, and prizes..."
                                            className="w-full bg-[#262626] border border-[#333] rounded-xl p-4 text-white text-base focus:outline-none focus:border-yellow-600/50 min-h-[160px] resize-y placeholder:text-gray-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </Section>

                            <Section title="Branding" description="Upload assets to make your tournament stand out.">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <ImageUploadInput
                                        label="Banner Image"
                                        name="banner_image_url"
                                        value={formData.banner_image_url}
                                        onChange={(val) => setFormData(prev => ({ ...prev, banner_image_url: val }))}
                                        aspect="aspect-[3/1]"
                                    />
                                    <ImageUploadInput
                                        label="Sponsor Logo"
                                        name="sponsor_logo_url"
                                        value={formData.sponsor_logo_url}
                                        onChange={(val) => setFormData(prev => ({ ...prev, sponsor_logo_url: val }))}
                                        aspect="aspect-square"
                                    />
                                </div>
                            </Section>

                            <div className="pt-6 border-t border-[#333] flex justify-end">
                                <Button
                                    onClick={() => setPreviewMode(true)}
                                    className="bg-white text-black hover:bg-gray-200 px-8 py-6 rounded-[14px] font-bold text-base"
                                >
                                    Review & Publish
                                </Button>
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-[#262626] border border-[#333] rounded-[18px] p-6 shadow-sm sticky top-6">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-white">
                                    <Shield className="w-5 h-5 text-yellow-500" /> Settings
                                </h3>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Format</Label>
                                        <Select
                                            name="tournament_format"
                                            value={formData.tournament_format}
                                            onChange={handleChange}
                                            options={['Swiss', 'Round Robin', 'Single Elimination', 'Arena']}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Players</Label>
                                            <Input
                                                name="max_players"
                                                type="number"
                                                value={formData.max_players}
                                                onChange={handleChange}
                                                className="bg-[#1f1f1f] border-[#333] rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Time</Label>
                                            <Input
                                                name="time_control"
                                                value={formData.time_control}
                                                onChange={handleChange}
                                                placeholder="10+0"
                                                className="bg-[#1f1f1f] border-[#333] rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Start Date</Label>
                                        <Input
                                            name="starting_time"
                                            type="datetime-local"
                                            value={formData.starting_time}
                                            onChange={handleChange}
                                            className="bg-[#1f1f1f] border-[#333] text-sm rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Prize Pool</Label>
                                        <div className="relative">
                                            <Input
                                                name="prize_pool"
                                                value={formData.prize_pool}
                                                onChange={handleChange}
                                                placeholder="1000"
                                                className="bg-[#1f1f1f] border-[#333] pl-8 rounded-xl"
                                            />
                                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-[#333]">
                                        <Label>Visibility</Label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            {['Public', 'Private'].map(opt => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setFormData(prev => ({ ...prev, visibility: opt }))}
                                                    className={`py-2 text-sm font-medium rounded-lg border transition-all ${formData.visibility === opt
                                                        ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                                                        : 'bg-[#1f1f1f] border-[#333] text-gray-500 hover:border-[#444]'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}

function TournamentPreview({ data, onConfirm }: { data: any, onConfirm: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Hero Section */}
            <div className="w-full h-80 relative rounded-[18px] overflow-hidden bg-[#262626] border border-[#333] group">
                {data.banner_image_url ? (
                    <>
                        <img
                            src={data.banner_image_url}
                            alt="Banner"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#161616]/90 via-[#161616]/40 to-transparent" />
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[#262626]">
                        <Trophy className="w-20 h-20 text-[#333]" />
                    </div>
                )}

                <div className="absolute bottom-0 left-0 w-full p-8 flex items-end gap-6">
                    <div className="w-24 h-24 rounded-[18px] bg-[#161616] border-2 border-[#333] overflow-hidden flex-shrink-0 shadow-2xl">
                        {data.sponsor_logo_url ? (
                            <img src={data.sponsor_logo_url} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-[#202020]">
                                <Shield className="w-8 h-8 text-gray-600" />
                            </div>
                        )}
                    </div>
                    <div className="mb-2">
                        <div className="flex gap-2 mb-3">
                            <Badge className="bg-yellow-500 text-black border-none hover:bg-yellow-400">{data.tournament_format}</Badge>
                            <Badge className="bg-white/10 text-white backdrop-blur-sm border-white/10">{data.visibility}</Badge>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                            {data.tournament_name || 'Untitled Tournament'}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Column: Description & Details */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                            About this Tournament
                        </h3>
                        <div className="prose prose-invert max-w-none">
                            <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">
                                {data.tournament_description || 'No description has been provided for this tournament yet.'}
                            </p>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-[#333]">
                        <Button
                            onClick={onConfirm}
                            className="bg-yellow-600 hover:bg-yellow-500 text-white text-lg font-bold py-6 px-12 rounded-[14px] w-full md:w-auto shadow-lg shadow-yellow-900/20 active:scale-95 transition-all"
                        >
                            Host Tournament
                        </Button>
                    </div>
                </div>

                {/* Right Column: Info Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-[#262626] border border-[#333] rounded-[18px] p-6 shadow-sm">
                        <div className="mb-6 pb-6 border-b border-[#333]">
                            <div className="text-sm text-gray-500 mb-1">Total Prize Pool</div>
                            <div className="text-4xl font-black text-yellow-500 tracking-tight">
                                ${data.prize_pool || '0'}
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Start Time</span>
                                <span className="text-white font-medium">{data.starting_time ? new Date(data.starting_time).toLocaleDateString() : 'TBA'}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-500 flex items-center gap-2"><Users className="w-4 h-4" /> Max Players</span>
                                <span className="text-white font-medium">{data.max_players} Slots</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-gray-500 flex items-center gap-2"><Shield className="w-4 h-4" /> Match Type</span>
                                <span className="text-white font-medium">{data.match_type}</span>
                            </div>
                            <div className="flex justify-between items-center group">
                                ```
                                <span className="text-gray-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Time Control</span>
                                <span className="text-white font-medium">{data.time_control}</span>
                            </div>
                        </div>


                    </div>
                </div>
            </div>
        </motion.div>
    )
}

// Components
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
    <label className="text-sm font-medium text-gray-400 block mb-1.5">{children}</label>
)

const Badge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border border-[#333] text-gray-300 ${className}`}>
        {children}
    </span>
)

const Select = ({ name, value, onChange, options }: any) => (
    <div className="relative">
        <select
            name={name}
            value={value}
            onChange={onChange}
            className="w-full h-10 bg-[#262626] border border-[#333] rounded-xl px-3 text-white text-sm focus:border-yellow-600/50 appearance-none outline-none cursor-pointer"
        >
            {options.map((opt: string) => <option key={opt}>{opt}</option>)}
        </select>
        <div className="absolute right-3 top-3 pointer-events-none">
            <ChevronLeft className="w-4 h-4 text-gray-600 -rotate-90" />
        </div>
    </div>
)

function ImageUploadInput({ label, name, value, onChange, aspect = 'aspect-video' }: { label: string, name: string, value: string, aspect?: string, onChange: (val: string) => void }) {
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
                    <button onClick={() => setMode('link')} className={`text-xs px-2 py-1 rounded ${mode === 'link' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'}`}>Link</button>
                    <button onClick={() => setMode('upload')} className={`text-xs px-2 py-1 rounded ${mode === 'upload' ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'}`}>Upload</button>
                </div>
            </div>

            <div className={`w-full ${aspect} bg-[#262626] border-2 border-dashed border-[#333] rounded-xl overflow-hidden relative group hover:border-[#444] transition-colors`}>
                {value ? (
                    <>
                        <img src={value} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button variant="secondary" size="sm" onClick={() => onChange('')}>Remove</Button>
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
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
