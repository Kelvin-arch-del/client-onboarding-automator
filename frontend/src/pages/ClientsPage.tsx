import React, { useEffect, useState } from 'react'
import axios from 'axios'

interface Client {
  _id: string
  firstName: string
  lastName: string
  email: string
}

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([])

  useEffect(() => {
    axios.get<Client[]>('/api/clients').then(res => setClients(res.data))
  }, [])

  const startOnboarding = (clientId: string) => {
    axios.post(`/api/onboarding/start/${clientId}`)
      .then(() => alert(`Onboarding started for ${clientId}`))
      .catch(err => alert(`Error: ${err.response?.data?.message}`))
  }

  const uploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    const form = new FormData()
    form.append('file', e.target.files[0])
    const { data } = await axios.post<{ text: string }>(
      '/api/documents',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    alert('Extracted text: ' + data.text)
  }

  return (
    <ul>
      {clients.map(c => (
        <li key={c._id}>
          {c.firstName} {c.lastName} ({c.email})
          <button onClick={() => startOnboarding(c._id)}>Start Onboarding</button>
          <input type="file" onChange={uploadDocument} />
        </li>
      ))}
    </ul>
  )
}

export default ClientsPage
