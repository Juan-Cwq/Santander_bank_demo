import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { supabase, type Profile } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import './index.css'

type View = 'landing' | 'signup' | 'login' | 'dashboard' | 'transfer' | 'profile' | 'transfers-history'
type AuthStep = 'welcome' | 'biometric' | 'sms-send' | 'sms-verify' | 'success'

function App() {
  const [view, setView] = useState<View>('landing')
  const [step, setStep] = useState<AuthStep>('welcome')
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [transferAmount, setTransferAmount] = useState('')
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferSuccess, setTransferSuccess] = useState(false)
  const [balance, setBalance] = useState(24831.50)
  
  // Profile editing state
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        setView('dashboard')
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (data) setProfile(data)
  }

  const fadeSlide = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  }

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !phone) {
      setError('Please fill in all fields')
      return
    }
    if (phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    
    setError('')
    setIsLoading(true)

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    setIsLoading(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }

    if (data.user) {
      // Update profile with phone if provided
      if (phone) {
        await supabase.from('profiles').update({ phone }).eq('id', data.user.id)
      }
      setSuccess('Account created! You can now sign in.')
      setTimeout(() => {
        setView('login')
        setSuccess('')
      }, 2000)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter your email and password')
      return
    }

    setError('')
    setIsLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    setIsLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    if (data.user) {
      await fetchProfile(data.user.id)
      setStep('success')
      setTimeout(() => {
        setView('dashboard')
      }, 1500)
    }
  }

  const handleBiometricLogin = async () => {
    setStep('biometric')
    setIsLoading(true)
    
    // Simulate biometric verification
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // For demo, try to sign in with stored credentials
    if (email && password) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      setIsLoading(false)
      
      if (signInError) {
        setError('Biometric verification failed. Please use SMS code.')
        setStep('welcome')
        return
      }
      
      if (data.user) {
        await fetchProfile(data.user.id)
        setStep('success')
        setTimeout(() => setView('dashboard'), 1500)
      }
    } else {
      setIsLoading(false)
      setStep('success')
      setTimeout(() => setView('dashboard'), 1500)
    }
  }

  const handleSendCode = async () => {
    if (phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }
    setError('')
    setIsLoading(true)
    
    // Simulate sending SMS
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    setStep('sms-verify')
  }

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)
    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus()
    }
  }

  const handleVerifyCode = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits')
      return
    }
    setError('')
    setIsLoading(true)
    
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo purposes, accept any 6-digit code and sign in
    if (email && password) {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      setIsLoading(false)
      
      if (signInError) {
        setError('Verification failed. Please try again.')
        return
      }
      
      if (data.user) {
        await fetchProfile(data.user.id)
        setStep('success')
        setTimeout(() => setView('dashboard'), 1500)
      }
    } else {
      setIsLoading(false)
      setStep('success')
      setTimeout(() => setView('dashboard'), 1500)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    resetForm()
    setView('landing')
  }

  const resetForm = () => {
    setStep('welcome')
    setEmail('')
    setPassword('')
    setFullName('')
    setPhone('')
    setCode(['', '', '', '', '', ''])
    setError('')
    setSuccess('')
  }

  const openSignUp = () => {
    resetForm()
    setView('signup')
  }

  const openLogin = () => {
    resetForm()
    setView('login')
    setStep('welcome')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-santander-red/30 border-t-santander-red rounded-full"
        />
      </div>
    )
  }

  // Mock recipients for transfer
  const mockRecipients = [
    { id: '1', name: 'Eleanor Pendelton', account: '****4521', type: 'Family' },
    { id: '2', name: 'Michael Pendelton', account: '****8832', type: 'Family' },
    { id: '3', name: 'Sarah Pendelton', account: '****2109', type: 'Family' },
    { id: '4', name: 'External Savings', account: '****7745', type: 'My Account' },
  ]

  const handleTransfer = async () => {
    if (!transferRecipient || !transferAmount) {
      setError('Please select a recipient and enter an amount')
      return
    }
    const amount = parseFloat(transferAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (amount > balance) {
      setError('Insufficient funds')
      return
    }

    setError('')
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setBalance(prev => prev - amount)
    setIsLoading(false)
    setTransferSuccess(true)
  }

  // Transfer View
  if (view === 'transfer' && user) {
    const selectedRecipient = mockRecipients.find(r => r.id === transferRecipient)
    
    if (transferSuccess) {
      return (
        <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
              className="w-28 h-28 mx-auto mb-8 rounded-full bg-success flex items-center justify-center"
            >
              <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            
            <h1 className="font-serif text-3xl text-near-black mb-3">Transfer Complete</h1>
            <p className="text-xl text-charcoal/80 mb-2">
              ${parseFloat(transferAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} sent to
            </p>
            <p className="text-2xl font-semibold text-near-black mb-8">{selectedRecipient?.name}</p>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTransferSuccess(false)
                setTransferAmount('')
                setTransferRecipient('')
                setView('dashboard')
              }}
              className="px-8 py-4 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-full shadow-lg"
            >
              Back to Dashboard
            </motion.button>
          </motion.div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <button 
                onClick={() => { setView('dashboard'); setError(''); }}
                className="flex items-center gap-2 text-charcoal hover:text-santander-red transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <Logo />
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-3xl text-near-black mb-2">Transfer Money</h1>
            <p className="text-lg text-charcoal/70">
              Available: ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/10 mb-6"
          >
            <label className="block text-lg font-medium text-near-black mb-4">Send to</label>
            <div className="space-y-3">
              {mockRecipients.map((recipient) => (
                <motion.button
                  key={recipient.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTransferRecipient(recipient.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    transferRecipient === recipient.id 
                      ? 'border-santander-red bg-santander-red/5' 
                      : 'border-charcoal/20 hover:border-charcoal/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center text-santander-red font-semibold text-lg">
                      {recipient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-near-black">{recipient.name}</p>
                      <p className="text-sm text-charcoal/60">{recipient.type} • {recipient.account}</p>
                    </div>
                  </div>
                  {transferRecipient === recipient.id && (
                    <div className="w-6 h-6 rounded-full bg-santander-red flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/10 mb-6"
          >
            <label className="block text-lg font-medium text-near-black mb-4">Amount</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl text-charcoal/60">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={transferAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, '')
                  if (val.split('.').length <= 2) setTransferAmount(val)
                }}
                placeholder="0.00"
                className="w-full py-5 pl-12 pr-6 text-3xl text-center bg-cream border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 text-santander-red text-base font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTransfer}
            disabled={isLoading || !transferRecipient || !transferAmount}
            className="w-full py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner /> : 'Send Money'}
          </motion.button>
        </main>
      </div>
    )
  }

  // Mock transfer history data
  const transferHistory = [
    { id: '1', recipient: 'Eleanor Pendelton', amount: 500.00, date: '2026-04-28', type: 'outgoing', status: 'completed' },
    { id: '2', recipient: 'Michael Pendelton', amount: 1200.00, date: '2026-04-25', type: 'outgoing', status: 'completed' },
    { id: '3', recipient: 'External Savings', amount: 2000.00, date: '2026-04-20', type: 'outgoing', status: 'completed' },
    { id: '4', recipient: 'Sarah Pendelton', amount: 150.00, date: '2026-04-18', type: 'outgoing', status: 'completed' },
    { id: '5', recipient: 'Eleanor Pendelton', amount: 300.00, date: '2026-04-15', type: 'outgoing', status: 'completed' },
    { id: '6', recipient: 'External Savings', amount: 5000.00, date: '2026-04-10', type: 'outgoing', status: 'completed' },
    { id: '7', recipient: 'Michael Pendelton', amount: 250.00, date: '2026-04-05', type: 'outgoing', status: 'completed' },
    { id: '8', recipient: 'Sarah Pendelton', amount: 75.00, date: '2026-04-01', type: 'outgoing', status: 'completed' },
  ]

  // Transfers History View
  if (view === 'transfers-history' && user) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-charcoal hover:text-santander-red transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <Logo />
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-3xl text-near-black mb-2">Transfer History</h1>
            <p className="text-lg text-charcoal/70">Your recent transfers</p>
          </motion.div>

          {/* Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/10 mb-6"
          >
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-charcoal/60 mb-1">Total Transferred (This Month)</p>
                <p className="text-2xl font-bold text-near-black">$9,475.00</p>
              </div>
              <div>
                <p className="text-sm text-charcoal/60 mb-1">Number of Transfers</p>
                <p className="text-2xl font-bold text-near-black">8</p>
              </div>
            </div>
          </motion.div>

          {/* Transfer List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-charcoal/10 overflow-hidden"
          >
            <div className="divide-y divide-charcoal/10">
              {transferHistory.map((transfer, index) => (
                <motion.div
                  key={transfer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="p-5 hover:bg-cream/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-santander-red/10 flex items-center justify-center text-santander-red">
                        <SendIcon />
                      </div>
                      <div>
                        <p className="font-medium text-near-black text-lg">{transfer.recipient}</p>
                        <p className="text-sm text-charcoal/60">
                          {new Date(transfer.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-near-black text-lg">
                        -${transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-success flex items-center justify-end gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Completed
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setView('transfer')}
            className="w-full mt-6 py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3"
          >
            <SendIcon /> New Transfer
          </motion.button>
        </main>
      </div>
    )
  }

  // Profile View
  if (view === 'profile' && user) {
    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProfilePicture(reader.result as string)
        }
        reader.readAsDataURL(file)
      }
    }

    const handleSaveProfile = async () => {
      setIsLoading(true)
      setError('')
      
      // Update profile in Supabase
      const updates: Record<string, string> = {}
      if (editName) updates.full_name = editName
      if (editPhone) updates.phone = editPhone
      
      if (Object.keys(updates).length > 0 || editEmail) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
        
        if (updateError) {
          setError('Failed to update profile')
          setIsLoading(false)
          return
        }
        
        // Update local profile state
        if (profile) {
          setProfile({
            ...profile,
            full_name: editName || profile.full_name,
            phone: editPhone || profile.phone,
          })
        }
      }
      
      setIsLoading(false)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 3000)
    }

    const initials = (profile?.full_name || editName || user.email || 'U')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <button 
                onClick={() => { setView('dashboard'); setError(''); setProfileSaved(false); }}
                className="flex items-center gap-2 text-charcoal hover:text-santander-red transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <Logo />
              <div className="w-16" />
            </div>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="font-serif text-3xl text-near-black mb-2">Your Profile</h1>
            <p className="text-lg text-charcoal/70">Manage your account information</p>
          </motion.div>

          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center shadow-lg">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{initials}</span>
                )}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <span className="text-white text-sm font-medium">Change Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
              </label>
              <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white border-2 border-cream flex items-center justify-center shadow">
                <CameraIcon className="w-5 h-5 text-santander-red" />
              </div>
            </div>
            <p className="mt-4 text-sm text-charcoal/60">Tap to change your profile picture</p>
          </motion.div>

          {/* Profile Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/10 space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Full Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder={profile?.full_name || 'Enter your name'}
                className="w-full py-4 px-5 text-lg bg-cream border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Email Address</label>
              <input
                type="email"
                value={editEmail || user.email || ''}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full py-4 px-5 text-lg bg-cream border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
                disabled
              />
              <p className="mt-1 text-xs text-charcoal/50">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Phone Number</label>
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, ''))}
                placeholder={profile?.phone || 'Enter phone number'}
                className="w-full py-4 px-5 text-lg bg-cream border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal/70 mb-2">Preferred Sign-in Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    if (profile) setProfile({ ...profile, preferred_auth_method: 'sms' })
                  }}
                  className={`py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                    profile?.preferred_auth_method === 'sms'
                      ? 'border-santander-red bg-santander-red/5 text-santander-red'
                      : 'border-charcoal/20 text-charcoal hover:border-charcoal/40'
                  }`}
                >
                  <PhoneIcon /> SMS Code
                </button>
                <button
                  onClick={() => {
                    if (profile) setProfile({ ...profile, preferred_auth_method: 'biometric' })
                  }}
                  className={`py-3 px-4 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-2 ${
                    profile?.preferred_auth_method === 'biometric'
                      ? 'border-santander-red bg-santander-red/5 text-santander-red'
                      : 'border-charcoal/20 text-charcoal hover:border-charcoal/40'
                  }`}
                >
                  <FaceIcon className="w-5 h-5" /> Face ID
                </button>
              </div>
            </div>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-charcoal/10 mt-6"
          >
            <h3 className="text-lg font-semibold text-near-black mb-4">Account Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-charcoal/10">
                <span className="text-charcoal/60">Account Type</span>
                <span className="font-medium text-near-black">High Yield Savings</span>
              </div>
              <div className="flex justify-between py-2 border-b border-charcoal/10">
                <span className="text-charcoal/60">Account Number</span>
                <span className="font-medium text-near-black">****4521</span>
              </div>
              <div className="flex justify-between py-2 border-b border-charcoal/10">
                <span className="text-charcoal/60">Routing Number</span>
                <span className="font-medium text-near-black">021000021</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-charcoal/60">Member Since</span>
                <span className="font-medium text-near-black">
                  {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-santander-red text-base font-medium text-center"
            >
              {error}
            </motion.p>
          )}

          {profileSaved && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-success text-base font-medium text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Profile saved successfully!
            </motion.p>
          )}

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveProfile}
            disabled={isLoading}
            className="w-full mt-6 py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isLoading ? <LoadingSpinner /> : 'Save Changes'}
          </motion.button>
        </main>
      </div>
    )
  }

  // Dashboard View
  if (view === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16 md:h-20">
              <Logo />
              <div className="flex items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditName(profile?.full_name || '')
                    setEditPhone(profile?.phone || '')
                    setEditEmail(user.email || '')
                    setView('profile')
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-cream transition-colors"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-white">
                        {(profile?.full_name || user.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <span className="text-charcoal hidden sm:block font-medium">
                    {profile?.full_name?.split(' ')[0] || 'Profile'}
                  </span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="px-4 py-2 text-charcoal hover:text-santander-red transition-colors"
                >
                  Sign out
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-3xl md:text-4xl text-near-black mb-2">
              Good {getTimeOfDay()}, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-lg text-charcoal/70">Here's your account overview</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-charcoal/10 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-charcoal/60 text-lg mb-1">Available Balance</p>
                <p className="text-5xl font-bold text-near-black">
                  ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center">
                <ShieldIcon className="w-8 h-8 text-success" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-success">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Account secured with {profile?.preferred_auth_method === 'biometric' ? 'Face ID' : 'SMS verification'}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 gap-4 mb-8"
          >
            <QuickActionLarge icon={<HistoryIcon />} label="View Transfers" description="Transfer history" onClick={() => setView('transfers-history')} />
            <QuickActionLarge icon={<SendIcon />} label="Transfer Money" description="Send to anyone" onClick={() => setView('transfer')} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-8 shadow-sm border border-charcoal/10"
          >
            <h2 className="text-xl font-semibold text-near-black mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <ActivityItem 
                icon="↓" 
                title="Direct Deposit" 
                subtitle="Employer" 
                amount="+$3,200.00" 
                positive 
              />
              <ActivityItem 
                icon="↑" 
                title="Electric Bill" 
                subtitle="Power Company" 
                amount="-$142.50" 
              />
              <ActivityItem 
                icon="↑" 
                title="Grocery Store" 
                subtitle="SuperMart" 
                amount="-$87.23" 
              />
              <ActivityItem 
                icon="↓" 
                title="Interest Payment" 
                subtitle="High Yield Savings" 
                amount="+$12.45" 
                positive 
              />
            </div>
          </motion.div>
        </main>
      </div>
    )
  }

  // Sign Up View
  if (view === 'signup') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-md">
          <motion.div {...fadeSlide} transition={{ duration: 0.4 }} className="text-center">
            <Logo />
            
            <h1 className="font-serif text-3xl md:text-4xl text-near-black mt-8 mb-3">
              Create your account
            </h1>
            <p className="text-lg text-charcoal/80 mb-8">
              Join Openbank in just a few steps
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Phone number"
                className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create password"
                className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-santander-red text-base font-medium"
              >
                {error}
              </motion.p>
            )}

            {success && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 text-success text-base font-medium"
              >
                {success}
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSignUp}
              disabled={isLoading}
              className="w-full mt-6 py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {isLoading ? <LoadingSpinner /> : 'Create Account'}
            </motion.button>

            <p className="mt-6 text-charcoal/70">
              Already have an account?{' '}
              <button onClick={openLogin} className="text-santander-red hover:underline font-medium">
                Sign in
              </button>
            </p>

            <button
              onClick={() => setView('landing')}
              className="mt-4 text-charcoal/60 hover:text-santander-red text-base transition-colors"
            >
              ← Back to home
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Login View
  if (view === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-cream">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                {...fadeSlide}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <Logo />
                
                <h1 className="font-serif text-4xl md:text-5xl text-near-black mt-8 mb-4">
                  Welcome back
                </h1>
                <p className="text-lg text-charcoal/80 mb-8">
                  Sign in to access your account
                </p>

                <div className="space-y-4 mb-6">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full py-4 px-6 text-lg bg-white border-2 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 text-santander-red text-base font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? <LoadingSpinner /> : (
                    <>
                      <PhoneIcon />
                      Sign in with SMS Code
                    </>
                  )}
                </motion.button>

                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-charcoal/20" />
                  <span className="text-charcoal/60 text-base">or</span>
                  <div className="flex-1 h-px bg-charcoal/20" />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBiometricLogin}
                  className="w-full py-5 px-8 bg-white text-charcoal text-xl font-semibold rounded-2xl border-2 border-charcoal/20 shadow-sm hover:border-santander-red hover:text-santander-red transition-all flex items-center justify-center gap-3"
                >
                  <FaceIcon className="w-7 h-7" />
                  Use Face ID Instead
                </motion.button>

                <p className="mt-6 text-charcoal/70">
                  Don't have an account?{' '}
                  <button onClick={openSignUp} className="text-santander-red hover:underline font-medium">
                    Sign up
                  </button>
                </p>

                <button
                  onClick={() => setView('landing')}
                  className="mt-4 text-charcoal/60 hover:text-santander-red text-base transition-colors"
                >
                  ← Back to home
                </button>
              </motion.div>
            )}

            {step === 'biometric' && (
              <motion.div
                key="biometric"
                {...fadeSlide}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <Logo />
                
                <div className="mt-12 mb-8">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center"
                  >
                    <FaceIcon className="w-16 h-16 text-white" />
                  </motion.div>
                </div>

                <h2 className="font-serif text-3xl text-near-black mb-3">
                  Look at your camera
                </h2>
                <p className="text-lg text-charcoal/80">
                  Hold your device at eye level
                </p>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'linear' }}
                  className="h-1 bg-santander-red rounded-full mt-10"
                />
                
                <p className="mt-4 text-base text-charcoal/60">
                  Verifying your identity...
                </p>
              </motion.div>
            )}

            {step === 'sms-verify' && (
              <motion.div
                key="sms-verify"
                {...fadeSlide}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <Logo />
                
                <h1 className="font-serif text-3xl md:text-4xl text-near-black mt-8 mb-3">
                  Enter your code
                </h1>
                <p className="text-lg text-charcoal/80 mb-8">
                  We sent a 6-digit code to your phone
                </p>

                <div className="flex justify-center gap-3">
                  {code.map((digit, index) => (
                    <motion.input
                      key={index}
                      id={`code-${index}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      whileFocus={{ scale: 1.05 }}
                      className="w-14 h-16 text-2xl text-center font-semibold bg-white border-3 border-charcoal/20 rounded-xl focus:outline-none focus:border-santander-red focus:ring-4 focus:ring-santander-red/20 transition-all"
                      style={{ borderWidth: '3px' }}
                      maxLength={1}
                    />
                  ))}
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-santander-red text-base font-medium"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleVerifyCode}
                  disabled={isLoading}
                  className="w-full mt-8 py-5 px-8 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70"
                >
                  {isLoading ? <LoadingSpinner /> : 'Verify & Sign In'}
                </motion.button>

                <button
                  onClick={() => { setCode(['', '', '', '', '', '']); setStep('welcome'); }}
                  className="mt-6 text-charcoal/60 hover:text-santander-red text-lg transition-colors"
                >
                  ← Back to sign in
                </button>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="success"
                {...fadeSlide}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="text-center"
              >
                <Logo />
                
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                  className="mt-12 mb-8"
                >
                  <div className="w-28 h-28 mx-auto rounded-full bg-success flex items-center justify-center">
                    <motion.svg
                      className="w-14 h-14 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <motion.path
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.4, duration: 0.5, ease: 'easeOut' }}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </motion.svg>
                  </div>
                </motion.div>

                <h1 className="font-serif text-3xl md:text-4xl text-near-black mb-3">
                  You're signed in
                </h1>
                <p className="text-lg text-charcoal/80">
                  Taking you to your dashboard...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  // Landing Page
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-8">
              <Logo />
              <nav className="hidden md:flex items-center gap-6">
                <button className="text-charcoal hover:text-santander-red transition-colors text-lg font-medium flex items-center gap-1">
                  Products <ChevronIcon />
                </button>
                <button className="text-charcoal hover:text-santander-red transition-colors text-lg font-medium flex items-center gap-1">
                  About us <ChevronIcon />
                </button>
              </nav>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openSignUp}
                className="px-6 py-3 bg-santander-red text-white font-semibold rounded-full hover:bg-santander-dark transition-colors"
              >
                Open an account
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openLogin}
                className="px-6 py-3 border-2 border-charcoal text-charcoal font-semibold rounded-full hover:border-santander-red hover:text-santander-red transition-colors"
              >
                Sign in
              </motion.button>
            </div>

            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <MenuIcon />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100"
            >
              <div className="px-4 py-6 space-y-4">
                <button className="block w-full text-left text-lg font-medium text-charcoal">Products</button>
                <button className="block w-full text-left text-lg font-medium text-charcoal">About us</button>
                <hr className="border-gray-200" />
                <button onClick={() => { setMobileMenuOpen(false); openSignUp(); }} className="w-full py-3 bg-santander-red text-white font-semibold rounded-full">
                  Open an account
                </button>
                <button onClick={() => { setMobileMenuOpen(false); openLogin(); }} className="w-full py-3 border-2 border-charcoal text-charcoal font-semibold rounded-full">
                  Sign in
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section className="relative overflow-hidden bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="order-2 md:order-1"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=700&fit=crop&crop=faces"
                  alt="Senior couple happily using tablet for banking"
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="order-1 md:order-2"
            >
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-near-black leading-tight mb-6">
                Banking that's{' '}
                <span className="text-santander-red">simple</span>,{' '}
                secure, and made for{' '}
                <span className="text-santander-red">you</span>.
              </h1>
              <p className="text-xl md:text-2xl text-santander-red font-semibold mb-3">
                Access on Your Terms
              </p>
              <p className="text-xl md:text-2xl text-charcoal/80 mb-8 leading-relaxed">
                No complicated passwords. No confusing codes. Just look at your phone and you're in. Your money: instantly accessible, permanently protected.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openLogin}
                  className="px-8 py-4 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-full shadow-lg"
                >
                  Sign in
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openSignUp}
                  className="px-8 py-4 border-2 border-charcoal/30 text-charcoal text-xl font-semibold rounded-full hover:border-santander-red hover:text-santander-red transition-colors"
                >
                  Open an account
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute top-20 right-0 w-64 h-64 bg-santander-red/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-santander-light/5 rounded-full blur-3xl" />
      </section>

      <section className="bg-white py-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-charcoal/60">
            <div className="flex items-center gap-2">
              <ShieldIcon className="w-6 h-6 text-success" />
              <span className="text-lg font-medium">FDIC Insured</span>
            </div>
            <div className="flex items-center gap-2">
              <LockIcon className="w-6 h-6 text-success" />
              <span className="text-lg font-medium">Bank-Grade Security</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-6 h-6 text-success" />
              <span className="text-lg font-medium">168 Years of Trust</span>
            </div>
            <div className="flex items-center gap-2">
              <HeartIcon className="w-6 h-6 text-success" />
              <span className="text-lg font-medium">100,000+ Happy Customers</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-serif text-3xl md:text-4xl text-near-black mb-4">
              Designed for <span className="text-santander-red">real people</span>
            </h2>
            <p className="text-xl text-charcoal/70 max-w-2xl mx-auto">
              We believe banking should adapt to you, not the other way around.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaceIcon className="w-10 h-10" />}
              title="One Look. You're In."
              description="No more fumbling with passwords or waiting for text codes. Your face is your key — secure, instant, and impossible to forget."
              delay={0}
            />
            <FeatureCard
              icon={<PhoneIcon className="w-10 h-10" />}
              title="SMS Codes When You Need Them"
              description="Prefer the familiar? We've got you covered with simple text message codes that actually work — no expiring timers, no rushing."
              delay={0.1}
            />
            <FeatureCard
              icon={<EyeIcon className="w-10 h-10" />}
              title="Large Text. Clear Buttons."
              description="Everything is designed to be readable and easy to tap. No squinting at tiny fonts or hunting for hidden menus."
              delay={0.2}
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-near-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-serif text-3xl md:text-4xl mb-6">
                Keeping you and your money <span className="text-santander-light">safe</span>
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Nothing is more important than keeping your money and information secure. 
                That's why Openbank offers industry-leading security from day one.
              </p>
              <ul className="space-y-4">
                <SecurityItem text="Your biometric data never leaves your device" />
                <SecurityItem text="256-bit encryption on every transaction" />
                <SecurityItem text="Real-time fraud monitoring 24/7" />
                <SecurityItem text="Instant alerts for any unusual activity" />
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center">
                  <ShieldIcon className="w-32 h-32 md:w-40 md:h-40 text-white" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-4 border-santander-light/30"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-cream">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-serif text-3xl md:text-4xl text-near-black mb-6">
              Ready to experience banking without the hassle?
            </h2>
            <p className="text-xl text-charcoal/70 mb-8">
              Join over 100,000 customers who have already made the switch.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(224, 0, 0, 0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={openSignUp}
              className="px-10 py-5 bg-gradient-to-r from-santander-red to-santander-light text-white text-xl font-semibold rounded-full shadow-lg"
            >
              Get started today
            </motion.button>
          </motion.div>
        </div>
      </section>

      <footer className="bg-footer-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <span className="font-serif text-xl">Openbank</span>
              </div>
              <p className="text-white/60 text-sm">A division of Santander Bank, N.A. Member FDIC.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Products</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">High Yield Savings</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">About us</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Our story</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security & protection</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-white/60">
                <li><a href="#" className="hover:text-white transition-colors">Help and contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-white/40 text-sm">
            <p>©2026 Santander Bank, N.A. All rights reserved. Openbank is a division of Santander Bank, N.A. Member FDIC.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Helper function
function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

// Components
function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-santander-red to-santander-light flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="font-serif text-2xl text-near-black">Openbank</span>
    </motion.div>
  )
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -5 }}
      className="bg-cream rounded-2xl p-8 text-center"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white flex items-center justify-center text-santander-red shadow-sm">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-near-black mb-3">{title}</h3>
      <p className="text-charcoal/70 text-lg leading-relaxed">{description}</p>
    </motion.div>
  )
}

function SecurityItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-white/80 text-lg">{text}</span>
    </li>
  )
}

function QuickActionLarge({ icon, label, description, onClick }: { icon: React.ReactNode; label: string; description: string; onClick?: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-6 bg-white rounded-2xl border border-charcoal/10 hover:border-santander-red hover:shadow-lg transition-all text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-santander-red/10 flex items-center justify-center text-santander-red">
        {icon}
      </div>
      <div>
        <p className="text-lg font-semibold text-near-black">{label}</p>
        <p className="text-sm text-charcoal/60">{description}</p>
      </div>
    </motion.button>
  )
}

function ActivityItem({ icon, title, subtitle, amount, positive }: { icon: string; title: string; subtitle: string; amount: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-charcoal/10 last:border-0">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${positive ? 'bg-success/10 text-success' : 'bg-charcoal/10 text-charcoal'}`}>
          {icon}
        </div>
        <div>
          <p className="font-medium text-near-black">{title}</p>
          <p className="text-sm text-charcoal/60">{subtitle}</p>
        </div>
      </div>
      <p className={`font-semibold ${positive ? 'text-success' : 'text-near-black'}`}>{amount}</p>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
      style={{ borderWidth: '3px' }}
    />
  )
}

// Icons
function FaceIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
    </svg>
  )
}

function ShieldIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function LockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  )
}

function ClockIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function HeartIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  )
}

function EyeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  )
}

function CameraIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function WalletIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  )
}

function BillIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

export default App
