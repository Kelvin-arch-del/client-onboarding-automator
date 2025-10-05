import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Client {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  caseType?: string
  notes?: string
  status?: string
  onboardingProgress?: number
  onboarding?: {
    status: string
    currentStep: number
    steps: Array<{ name: string; required?: boolean; completed?: boolean; completedAt?: Date }>
    progress: number
  }
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => { loadClients() }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get<Client[]>('/api/clients')
      setClients(data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const startOnboarding = async (clientId: string) => {
    try {
      await axios.post(`/api/onboarding/start/${clientId}`)
      alert(`Onboarding started for ${clientId}`)
      loadClients()
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.message || 'Failed to start onboarding'}`)
    }
  }

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const form = new FormData()
    form.append('file', e.target.files[0])
    try {
      const { data } = await axios.post<{ text: string }>(
        '/api/documents',
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      alert('Extracted text: ' + data.text.substring(0, 200) + '...')
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.message || 'Unknown error'}`)
    }
  }

  if (loading) return <div style={{ padding: '20px' }}>Loading clients...</div>
  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>

  return (
    <div style={{ padding: '20px' }}>
      <h2>Client Onboarding Dashboard</h2>
      {clients.length === 0 ? (
        <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
          <p>No clients found. Seed test data with:</p>
          <code style={{ backgroundColor: '#e9ecef', padding: '5px', borderRadius: '4px' }}>
            docker-compose exec server npm run seed
          </code>
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {clients.map(c => (
            <li key={c._id} style={{
              border: '1px solid #ddd',
              padding: '15px',
              margin: '10px 0',
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>{c.firstName} {c.lastName}</h4>
              <p>Email: {c.email}</p>
              {c.phone && <p>Phone: {c.phone}</p>}
              {c.company && <p>Company: {c.company}</p>}
              {c.caseType && <p>Case Type: {c.caseType}</p>}
              {c.status && (
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: c.status === 'active' ? '#28a745' : '#ffc107',
                  color: c.status === 'active' ? 'white' : 'black',
                  marginRight: '10px'
                }}>
                  {c.status.toUpperCase()}
                </span>
              )}
              {c.onboarding && (
                <span>Progress: {c.onboarding.progress}%</span>
              )}
              <div style={{ marginTop: '10px' }}>
                <button onClick={() => startOnboarding(c._id)} style={{
                  padding: '8px 16px',
                  marginRight: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}>
                  Start Onboarding
                </button>
                <input
                  type="file"
                  onChange={uploadDocument}
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                  style={{ marginLeft: '10px' }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default ClientsPage
