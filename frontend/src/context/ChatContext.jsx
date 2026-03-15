import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import axios from 'axios'
import { useAuth } from './AuthContext'

export const ChatContext = createContext(null)

// Mock contacts for demo (would come from API in production)
// Simplified contacts for demo
export const MOCK_CONTACTS = [
  { _id: '1', name: 'Sarah Chen', avatar: null, initials: 'SC', isOnline: true, lastSeen: new Date(), status: 'online' },
  { _id: 'ai', name: 'Connectsphere AI', avatar: null, initials: 'AI', isOnline: true, lastSeen: new Date(), status: 'online', isAI: true },
]

export const MOCK_ROOMS = [
  {
    _id: 'rai', contactId: 'ai', name: 'Connectsphere AI', initials: 'AI',
    lastMessage: 'Hello! I am your Connectsphere AI assistant. How can I help you today?',
    lastMessageAt: new Date(),
    lastMessageStatus: 'delivered',
    unreadCount: 0, isOnline: true, pinned: true, muted: false, color: '#FF3366', isAI: true,
  }
]

export const MOCK_MESSAGES = {
  rai: [
    { _id: 'm1', text: 'Hello! I am your Connectsphere AI assistant. How can I help you today?', timestamp: new Date(), isSent: false, status: 'delivered', type: 'text' },
  ],
  r1: [
    { _id: 'm1', text: 'Hey! Just checking in 👋', timestamp: new Date(Date.now() - 3600000), isSent: false, status: 'read', type: 'text' },
    { _id: 'm2', text: 'Hi Sarah! I\'m good, how are you?', timestamp: new Date(Date.now() - 3540000), isSent: true, status: 'read', type: 'text' },
    { _id: 'm3', text: 'Great! We\'re meeting at the café, right?', timestamp: new Date(Date.now() - 3480000), isSent: false, status: 'read', type: 'text' },
    { _id: 'm4', text: 'Yes! I\'ll share my live location', timestamp: new Date(Date.now() - 3420000), isSent: true, status: 'read', type: 'text' },
    { _id: 'm5', text: 'Location shared for 30 minutes', timestamp: new Date(Date.now() - 3000000), isSent: true, status: 'delivered', type: 'location', lat: 12.9716, lng: 77.5946 },
    { _id: 'm6', text: 'Got it! I can see you on the map 🗺️', timestamp: new Date(Date.now() - 2400000), isSent: false, status: 'read', type: 'text' },
    { _id: 'm7', text: 'Perfect! ETA 10 mins', timestamp: new Date(Date.now() - 1800000), isSent: true, status: 'read', type: 'text' },
    { _id: 'm8', text: 'Are you on your way? 📍', timestamp: new Date(Date.now() - 300000), isSent: false, status: 'delivered', type: 'text' },
  ],
}

function chatReducer(state, action) {
  switch (action.type) {
    case 'SET_ROOMS': return { ...state, rooms: action.payload }
    case 'SET_ACTIVE_ROOM': return { ...state, activeRoomId: action.payload }
    case 'SET_MESSAGES': return { ...state, messages: { ...state.messages, [action.roomId]: action.payload } }
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.roomId]: [...(state.messages[action.roomId] || []), action.payload],
        },
        rooms: state.rooms.map(r =>
          r._id === action.roomId
            ? { ...r, lastMessage: action.payload.text, timestamp: action.payload.timestamp, unreadCount: r._id === state.activeRoomId ? 0 : r.unreadCount + (action.payload.isSent ? 0 : 1) }
            : r
        ),
      }
    case 'MARK_READ':
      return {
        ...state,
        rooms: state.rooms.map(r => r._id === action.roomId ? { ...r, unreadCount: 0 } : r),
      }
    case 'SET_TYPING': return { ...state, typing: { ...state.typing, [action.roomId]: action.payload } }
    case 'SET_CONNECTED': return { ...state, connected: action.payload }
    case 'DELETE_ROOM':
      const { [action.roomId]: removedMsgs, ...remainingMsgs } = state.messages
      return {
        ...state,
        rooms: state.rooms.filter(r => r._id !== action.roomId),
        messages: remainingMsgs,
        activeRoomId: state.activeRoomId === action.roomId ? null : state.activeRoomId
      }
    case 'ADD_ROOM':
      if (state.rooms.some(r => r._id === action.payload._id)) return state
      return {
        ...state,
        rooms: [action.payload, ...state.rooms]
      }
    default: return state
  }
}

export const ChatProvider = ({ children }) => {
  const { token, user } = useAuth()
  const socketRef = useRef(null)

  const [state, dispatch] = useReducer(chatReducer, {
    rooms: [], // Start empty, will fetch
    activeRoomId: null,
    messages: {}, // Start empty
    typing: {},
    connected: false,
  })

  // Fetch rooms on mount
  useEffect(() => {
    if (!token) return
    const fetchRooms = async () => {
      try {
        const res = await axios.get('/api/rooms', {
          headers: { Authorization: `Bearer ${token}` }
        })
        dispatch({ type: 'SET_ROOMS', payload: res.data })
      } catch (err) {
        console.error('Fetch rooms error:', err)
      }
    }
    fetchRooms()
  }, [token])

  // Socket.IO connection
  useEffect(() => {
    if (!token) return

    const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    socketRef.current = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    const s = socketRef.current

    s.on('connect', () => dispatch({ type: 'SET_CONNECTED', payload: true }))
    s.on('disconnect', () => dispatch({ type: 'SET_CONNECTED', payload: false }))

    s.on('receive-message', ({ roomId, message }) => {
      dispatch({ type: 'ADD_MESSAGE', roomId, payload: { ...message, isSent: false } })
    })

    s.on('typing', ({ roomId, userId }) => {
      if (userId !== user?._id) dispatch({ type: 'SET_TYPING', roomId, payload: true })
    })

    s.on('stop-typing', ({ roomId }) => {
      dispatch({ type: 'SET_TYPING', roomId, payload: false })
    })

    return () => { s.disconnect() }
  }, [token])

  const fetchAIResponse = async (roomId, userMessage) => {
    // Show typing indicator immediately
    dispatch({ type: 'SET_TYPING', roomId, payload: true })

    // Provide context about other chats and current history
    const history = (state.messages[roomId] || []).slice(-10).map(m => ({
      role: m.isSent ? 'user' : 'assistant',
      content: m.text
    }))

    // Add a summary of other chats as context
    const otherRoomsContext = state.rooms
      .filter(r => r._id !== roomId)
      .map(r => {
        const roomMsgs = (state.messages[r._id] || []).slice(-5)
        const msgsText = roomMsgs.map(m => `${m.isSent ? 'User' : r.name}: ${m.text}`).join('\n')
        return `Chat with ${r.name}:\n${msgsText}`
      }).join('\n\n')

    try {
      // Call our backend instead of Groq directly to avoid CORS issues
      const response = await axios.post('/api/ai/chat', {
        message: userMessage,
        history,
        context: otherRoomsContext
      }, {
        timeout: 15000 // 15s timeout
      })

      const aiText = response.data.text
      const msg = {
        _id: Date.now().toString(),
        text: aiText,
        timestamp: new Date(),
        isSent: false,
        status: 'delivered',
        type: 'text',
      }

      // Add actual delay for realism
      setTimeout(() => {
        dispatch({ type: 'ADD_MESSAGE', roomId, payload: msg })
        dispatch({ type: 'SET_TYPING', roomId, payload: false })
      }, 500 + Math.random() * 800)

    } catch (err) {
      console.error('AI Error:', err)
      const errorMsg = {
        _id: Date.now().toString(),
        text: "I'm having trouble connecting to my brain right now. Please ensure the backend server is running! 🧠❌",
        timestamp: new Date(),
        isSent: false,
        status: 'delivered',
        type: 'text',
      }
      setTimeout(() => {
        dispatch({ type: 'ADD_MESSAGE', roomId, payload: errorMsg })
        dispatch({ type: 'SET_TYPING', roomId, payload: false })
      }, 1000)
    }
  }

  const sendMessage = useCallback((roomId, text, type = 'text', extra = {}) => {
    const msg = {
      _id: Date.now().toString(),
      text,
      type,
      timestamp: new Date(),
      isSent: true,
      status: 'sent',
      ...extra,
    }
    dispatch({ type: 'ADD_MESSAGE', roomId, payload: msg })

    if (roomId === 'rai') {
      fetchAIResponse(roomId, text)
    } else {
      socketRef.current?.emit('send-message', { roomId, message: { text, type, ...extra } })
    }
  }, [])

  const setActiveRoom = useCallback(async (roomId) => {
    if (!roomId || roomId === 'undefined') return // Guard against invalid ID
    
    dispatch({ type: 'SET_ACTIVE_ROOM', payload: roomId })
    dispatch({ type: 'MARK_READ', roomId })
    socketRef.current?.emit('join-room', roomId)

    // Fetch messages for this room
    if (!state.messages[roomId]) {
      try {
        const res = await axios.get(`/api/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        dispatch({ type: 'SET_MESSAGES', roomId, payload: res.data })
      } catch (err) {
        console.error('Fetch messages error:', err)
      }
    }
  }, [token, state.messages])

  const startTyping = useCallback((roomId) => {
    socketRef.current?.emit('typing', { roomId })
  }, [])

  const stopTyping = useCallback((roomId) => {
    socketRef.current?.emit('stop-typing', { roomId })
  }, [])

  const deleteRoom = useCallback((roomId) => {
    if (roomId === 'rai') return // Cannot delete AI
    dispatch({ type: 'DELETE_ROOM', roomId })
    socketRef.current?.emit('leave-room', roomId)
  }, [])

  const addRoom = useCallback(async ({ name, phone }) => {
    try {
      // 1. Find user by phone
      const userRes = await axios.get(`/api/users/find/${phone}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const targetUser = userRes.data

      // 2. Create/Get room
      const roomRes = await axios.post('/api/rooms', {
        participantId: targetUser._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      const room = roomRes.data
      dispatch({ type: 'ADD_ROOM', payload: room })
      return room
    } catch (err) {
      console.error('Add room error:', err)
      alert(err.response?.data?.message || 'Failed to connect with user')
      throw err
    }
  }, [token])

  return (
    <ChatContext.Provider value={{
      ...state,
      sendMessage,
      setActiveRoom,
      startTyping,
      stopTyping,
      deleteRoom,
      addRoom,
      socket: socketRef.current,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export const useChat = () => useContext(ChatContext)
