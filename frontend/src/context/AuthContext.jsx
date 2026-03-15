import { createContext, useContext, useReducer, useEffect } from 'react'
import axios from 'axios'

export const AuthContext = createContext(null)
const LOCAL_ACCOUNTS_KEY = 'cs_local_accounts'

const initialState = {
  user: JSON.parse(localStorage.getItem('cs_user')) || null,
  token: localStorage.getItem('cs_token') || null,
  loading: false,
  error: null,
}

const normalizeEmail = (email) => email.trim().toLowerCase()

const getLocalAccounts = () => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ACCOUNTS_KEY)) || []
  } catch {
    return []
  }
}

const saveLocalAccounts = (accounts) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts))
}

const makeLocalAuthPayload = (account) => ({
  token: `local-account-${account._id}`,
  user: {
    _id: account._id,
    name: account.name,
    email: account.email,
    bio: account.bio || 'Using ConnectSphere in local mode',
    status: 'online',
    createdAt: account.createdAt,
  },
})

function authReducer(state, action) {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null }
    case 'AUTH_SUCCESS':
      return { ...state, loading: false, user: action.payload.user, token: action.payload.token, error: null }
    case 'AUTH_FAIL':
      return { ...state, loading: false, error: action.payload }
    case 'LOGOUT':
      return { ...initialState, user: null, token: null }
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } }
    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Persist auth state
  useEffect(() => {
    if (state.token) {
      localStorage.setItem('cs_token', state.token)
      localStorage.setItem('cs_user', JSON.stringify(state.user))
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
    } else {
      localStorage.removeItem('cs_token')
      localStorage.removeItem('cs_user')
      delete axios.defaults.headers.common['Authorization']
    }
  }, [state.token, state.user])

  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' })
    const normalizedEmail = normalizeEmail(email)
    try {
      const res = await axios.post('/api/auth/login', { email: normalizedEmail, password })
      dispatch({ type: 'AUTH_SUCCESS', payload: res.data })
      return { success: true }
    } catch (err) {
      const localAccount = getLocalAccounts().find(account => account.email === normalizedEmail)
      if (localAccount && localAccount.password === password) {
        dispatch({ type: 'AUTH_SUCCESS', payload: makeLocalAuthPayload(localAccount) })
        return { success: true, localMode: true }
      }

      const msg = err.response?.data?.message || 'Signup/login is working in local mode only right now because the backend database is unavailable.'
      dispatch({ type: 'AUTH_FAIL', payload: msg })
      return { success: false, error: msg }
    }
  }

  const register = async (name, email, password) => {
    dispatch({ type: 'AUTH_START' })
    const normalizedEmail = normalizeEmail(email)
    const localAccounts = getLocalAccounts()

    if (localAccounts.some(account => account.email === normalizedEmail)) {
      const msg = 'Email already registered'
      dispatch({ type: 'AUTH_FAIL', payload: msg })
      return { success: false, error: msg }
    }

    try {
      const res = await axios.post('/api/auth/register', { name, email: normalizedEmail, password })
      dispatch({ type: 'AUTH_SUCCESS', payload: res.data })
      return { success: true }
    } catch (err) {
      if (!err.response || err.response.status >= 500) {
        const localAccount = {
          _id: `local-${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          password,
          bio: 'Using ConnectSphere in local mode',
          createdAt: new Date().toISOString(),
        }
        saveLocalAccounts([...localAccounts, localAccount])
        dispatch({ type: 'AUTH_SUCCESS', payload: makeLocalAuthPayload(localAccount) })
        return { success: true, localMode: true }
      }

      const msg = err.response?.data?.message || 'Unable to create account'
      dispatch({ type: 'AUTH_FAIL', payload: msg })
      return { success: false, error: msg }
    }
  }

  const loginDemo = () => {
    const demoUser = {
      _id: 'demo-user',
      name: 'Demo User',
      email: 'demo@connectsphere.app',
      bio: 'Exploring ConnectSphere in demo mode',
      status: 'online',
      createdAt: new Date('2026-03-01T00:00:00.000Z').toISOString(),
    }

    dispatch({
      type: 'AUTH_SUCCESS',
      payload: {
        user: demoUser,
        token: 'demo-token',
      }
    })

    return { success: true }
  }

  const loginGoogle = async (credential) => {
    dispatch({ type: 'AUTH_START' })
    try {
      const res = await axios.post('/api/auth/google', { credential })
      dispatch({ type: 'AUTH_SUCCESS', payload: res.data })
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed'
      dispatch({ type: 'AUTH_FAIL', payload: msg })
      return { success: false, error: msg }
    }
  }

  const logout = () => dispatch({ type: 'LOGOUT' })
  const updateUser = (data) => dispatch({ type: 'UPDATE_USER', payload: data })

  const saveProfile = async (data) => {
    try {
      const res = await axios.put('/api/users/me', data)
      dispatch({ type: 'UPDATE_USER', payload: res.data })
      return { success: true }
    } catch (err) {
      console.error('saveProfile error:', err.response?.data || err.message)
      // For local mode, just update local state
      dispatch({ type: 'UPDATE_USER', payload: data })
      return { success: true, localOnly: true }
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, loginDemo, loginGoogle, logout, updateUser, saveProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
