import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Shield, Bell, Trash2, Save, Camera, Lock, Mail } from 'lucide-react'
import './Settings.css' // We'll assume standard app styles or create this if needed, but inline styles/tailwind work too.

function Settings() {
    const { user, logout } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [isLoading, setIsLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')

    // Mock Form State
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        bio: 'Explorer of the unknown. Keeper of artifacts.',
        notifications: {
            email: true,
            push: false,
            marketing: false
        }
    })

    const handleSave = async () => {
        setIsLoading(true)
        // Simulate API Call
        await new Promise(r => setTimeout(r, 1000))
        setIsLoading(false)
        setSuccessMsg('Changes saved successfully!')
        setTimeout(() => setSuccessMsg(''), 3000)
    }

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'preferences', label: 'Preferences', icon: Bell },
    ]

    return (
        <div className="settings-page container py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <span className="text-legion-gold">Settings</span>
            </h1>

            <div className="settings-layout grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <aside className="settings-sidebar col-span-1">
                    <nav className="glass-panel p-2 rounded-xl flex flex-col gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all ${activeTab === tab.id
                                        ? 'bg-legion-gold text-legion-bg font-bold shadow-lg shadow-legion-gold/20'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                        <div className="h-px bg-white/10 my-2"></div>
                        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-500 hover:bg-red-500/10 transition-colors">
                            <Trash2 size={18} />
                            Delete Account
                        </button>
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="settings-content col-span-1 md:col-span-3">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="glass-panel p-6 md:p-8 rounded-xl border border-glass-border"
                        >
                            {/* --- PROFILE TAB --- */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold mb-4">Public Profile</h2>

                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="relative group cursor-pointer">
                                            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-legion-gold/30">
                                                <img
                                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}`}
                                                    alt="Avatar"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera className="text-white" size={24} />
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg">{user?.name}</h3>
                                            <p className="text-slate-400 text-sm">Legionnaire since {new Date().getFullYear()}</p>
                                            <button className="text-legion-gold text-sm hover:underline mt-1">Change Avatar</button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="form-group">
                                            <label className="block text-sm text-slate-400 mb-2">Display Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:border-legion-gold outline-none transition-colors text-white"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full bg-black/40 border border-white/5 rounded-lg pl-10 pr-4 py-3 text-slate-500 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group md:col-span-2">
                                            <label className="block text-sm text-slate-400 mb-2">Bio</label>
                                            <textarea
                                                rows={4}
                                                value={formData.bio}
                                                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:border-legion-gold outline-none transition-colors text-white resize-none"
                                            />
                                            <p className="text-xs text-slate-500 mt-2 text-right">0/150 characters</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- SECURITY TAB --- */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold mb-4">Security & Login</h2>

                                    <div className="p-4 bg-legion-gold/10 border border-legion-gold/20 rounded-lg flex items-start gap-3">
                                        <Shield className="text-legion-gold shrink-0 mt-1" size={20} />
                                        <div>
                                            <h4 className="font-bold text-legion-gold">Password Protected</h4>
                                            <p className="text-sm text-slate-300">Your account is secured with a password. Last changed 3 months ago.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="form-group">
                                            <label className="block text-sm text-slate-400 mb-2">Current Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3.5 text-slate-500" size={18} />
                                                <input type="password" placeholder="••••••••" className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-legion-gold text-white" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="form-group">
                                                <label className="block text-sm text-slate-400 mb-2">New Password</label>
                                                <input type="password" placeholder="Min 8 chars" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-legion-gold text-white" />
                                            </div>
                                            <div className="form-group">
                                                <label className="block text-sm text-slate-400 mb-2">Confirm New Password</label>
                                                <input type="password" placeholder="Repeat password" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-legion-gold text-white" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- PREFERENCES TAB --- */}
                            {activeTab === 'preferences' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold mb-4">Notifications</h2>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'email', label: 'Email Notifications', desc: 'Receive updates about your listings and orders.' },
                                            { id: 'push', label: 'Push Notifications', desc: 'Get real-time alerts on your device.' },
                                            { id: 'marketing', label: 'Marketing Emails', desc: 'Receive news about new features and promotions.' },
                                        ].map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                                                <div>
                                                    <h4 className="font-bold">{item.label}</h4>
                                                    <p className="text-sm text-slate-400">{item.desc}</p>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.notifications[item.id]}
                                                        onChange={() => setFormData({
                                                            ...formData,
                                                            notifications: { ...formData.notifications, [item.id]: !formData.notifications[item.id] }
                                                        })}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-legion-gold"></div>
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- SAVE BAR --- */}
                            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                                {successMsg ? (
                                    <span className="text-emerald-400 font-medium animate-fadeIn">✅ {successMsg}</span>
                                ) : (
                                    <span></span>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={isLoading}
                                    className="btn btn-primary px-8 flex items-center gap-2"
                                >
                                    {isLoading ? <span className="animate-spin">⏳</span> : <Save size={18} />}
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    )
}

export default Settings
