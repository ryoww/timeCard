import { useState } from 'react'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

interface TimeCard {
  id: string
  startTime: string
  pauseTime?: string | null
  resumeTime?: string | null
  endTime?: string | null
}

function App() {
  const [token, setToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [viewName, setViewName] = useState('')
  const [history, setHistory] = useState<TimeCard[]>([])
  const [error, setError] = useState('')

  const login = async () => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (res.ok) {
        setToken(data.body.data.token)
      } else {
        setError(data.message || 'login failed')
      }
    } catch (e) {
      setError('network error')
    }
  }

  const register = async () => {
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, viewName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'register failed')
      }
    } catch (e) {
      setError('network error')
    }
  }

  const call = async (path: string, method: string = 'POST') => {
    setError('')
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'error')
      }
      return data
    } catch (e) {
      setError('network error')
    }
  }

  const fetchHistory = async () => {
    const data = await call('/timecards/history', 'GET')
    if (data?.body?.data) {
      setHistory(data.body.data)
    }
  }

  if (!token) {
    return (
      <div className="login">
        <h2>Login</h2>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={login}>Login</button>
        <h2>Register</h2>
        <input
          placeholder="view name"
          value={viewName}
          onChange={(e) => setViewName(e.target.value)}
        />
        <button onClick={register}>Register</button>
        {error && <p>{error}</p>}
      </div>
    )
  }

  return (
    <div className="app">
      <h1>TimeCard</h1>
      <div className="card">
        <button onClick={() => call('/timecards/start')}>Start</button>
        <button onClick={() => call('/timecards/pause')}>Pause</button>
        <button onClick={() => call('/timecards/resume')}>Resume</button>
        <button onClick={() => call('/timecards/stop')}>Stop</button>
        <button onClick={fetchHistory}>History</button>
        <button onClick={() => setToken('')}>Logout</button>
      </div>
      {error && <p>{error}</p>}
      <ul>
        {history.map((card) => (
          <li key={card.id}>
            {new Date(card.startTime).toLocaleString()} -{' '}
            {card.endTime ? new Date(card.endTime).toLocaleString() : 'Running'}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
