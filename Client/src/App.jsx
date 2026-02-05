import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMessage()
  }, [])

  const fetchMessage = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/health')
      setMessage(response.data.message)
    } catch (error) {
      console.error('서버 연결 오류:', error)
      setMessage('서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>SPECIA 웹사이트</h1>
        <p>환영합니다!</p>
      </header>
      <main className="app-main">
        <div className="status-card">
          <h2>서버 상태</h2>
          {loading ? (
            <p>연결 중...</p>
          ) : (
            <p className={message ? 'success' : 'error'}>{message || '연결 실패'}</p>
          )}
          <button onClick={fetchMessage} className="refresh-btn">
            새로고침
          </button>
        </div>
      </main>
    </div>
  )
}

export default App
