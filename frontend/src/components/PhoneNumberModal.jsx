import { useState, useContext, useEffect } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'
import { MdPhone, MdArrowForward, MdClose, MdCheckCircle } from 'react-icons/md'
import { AuthContext } from '../context/AuthContext'
import './PhoneNumberModal.css'

export default function PhoneNumberModal() {
  const { user, saveProfile, updateUser } = useContext(AuthContext)
  const [step, setStep] = useState(1) // 1: Number, 2: OTP
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [demoOtp, setDemoOtp] = useState('')

  const shouldShow = user && !user.isPhoneVerified

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setError('')
    const cleanNum = phoneNumber.replace(/\D/g, '')
    if (cleanNum.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)
    try {
      const fullNumber = `+91${cleanNum}`
      const res = await axios.post('/api/auth/request-otp', 
        { phoneNumber: fullNumber },
        { headers: { 'x-user-id': user._id } }
      )
      
      if (res.data.success) {
        if (res.data.otp) setDemoOtp(res.data.otp)
        setStep(2)
      } else {
        setError(res.data.message || 'Failed to send OTP')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    const otpValue = otp.join('')
    if (otpValue.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/auth/verify-otp',
        { otp: otpValue },
        { headers: { 'x-user-id': user._id } }
      )

      if (res.data.success) {
        updateUser(res.data.user)
        setSuccess(true)
      } else {
        setError(res.data.message || 'Verification failed')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (val, index) => {
    if (isNaN(val)) return
    const newOtp = [...otp]
    newOtp[index] = val.slice(-1)
    setOtp(newOtp)

    if (val && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus()
    }
  }

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus()
    }
  }

  if (!shouldShow) return null

  return (
    <AnimatePresence>
      <motion.div 
        className="pnm-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="pnm-card"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {success ? (
            <div className="pnm-success">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
              >
                <MdCheckCircle size={64} color="var(--success)" />
              </motion.div>
              <h2>Phone Verified!</h2>
              <p>Your account is now secure. You can now use all location sharing features.</p>
              <motion.button 
                className="pnm-btn pnm-btn-success"
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Continue to Dashboard
              </motion.button>
            </div>
          ) : step === 1 ? (
            <>
              <div className="pnm-header">
                <div className="pnm-icon-wrap">
                  <MdPhone size={32} color="var(--primary)" />
                </div>
                <h1>Verify your phone</h1>
                <p>Add your number for two-factor authentication and emergency SOS alerts.</p>
              </div>

              <form onSubmit={handleSendOtp} className="pnm-form">
                <div className="pnm-input-group">
                  <span className="pnm-prefix">🇮🇳 +91</span>
                  <input 
                    type="tel"
                    className={`pnm-input ${error ? 'has-error' : ''}`}
                    placeholder="Enter phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    autoFocus
                    maxLength={10}
                  />
                </div>

                {error && <p className="pnm-error"><MdClose size={14} /> {error}</p>}

                <button 
                  type="submit" 
                  className="pnm-submit"
                  disabled={loading || phoneNumber.length < 10}
                >
                  {loading ? 'Sending OTP...' : 'Send Verification Code'}
                  {!loading && <MdArrowForward size={18} />}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="pnm-header">
                <div className="pnm-icon-wrap">
                  <MdCheckCircle size={32} color="var(--primary)" />
                </div>
                <h1>Enter OTP</h1>
                <p>We've sent a 6-digit code to <b>+91 {phoneNumber}</b></p>
                {demoOtp && <p style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '10px' }}>Demo Mode OTP: <b>{demoOtp}</b></p>}
              </div>

              <form onSubmit={handleVerifyOtp} className="pnm-form">
                <div className="otp-container">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      className="otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      maxLength={1}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {error && <p className="pnm-error"><MdClose size={14} /> {error}</p>}

                <button 
                  type="submit" 
                  className="pnm-submit"
                  disabled={loading || otp.join('').length < 6}
                >
                  {loading ? 'Verifying...' : 'Verify & Complete'}
                  {!loading && <MdArrowForward size={18} />}
                </button>

                <button type="button" className="resend-btn" onClick={handleSendOtp}>
                  Resend Code
                </button>
              </form>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
