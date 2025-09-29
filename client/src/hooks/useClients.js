import { useQuery } from 'react-query';

async function fetchClients(token) {
  const res = await fetch('/api/clients', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to fetch clients');
  return res.json();
}

export default function useClients(token) {
  return useQuery(['clients', token], () => fetchClients(token), {
    enabled: !!token
  });
}
