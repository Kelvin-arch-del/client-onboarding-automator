import React from 'react';
import useAuth from '../hooks/useAuth';
import useClients from '../hooks/useClients';

const statusColors = {
  'Pending': 'bg-yellow-100 border-yellow-400 text-yellow-800',
  'Active': 'bg-blue-100 border-blue-700 text-blue-900',
  'Completed': 'bg-green-100 border-green-400 text-green-800',
  'Needs Attention': 'bg-red-100 border-red-400 text-red-800'
};

const statusOrder = ['Pending', 'Active', 'Needs Attention', 'Completed'];

function getStatus(client) {
  // Map backend status to dashboard sections
  if (client.status === 'inquiry' || client.status === 'consultation-scheduled') return 'Pending';
  if (client.status === 'active-litigation' || client.status === 'case-preparation' || client.status === 'documents-gathering' || client.status === 'retained') return 'Active';
  if (client.status === 'closed' || client.status === 'settlement') return 'Completed';
  if (client.status === 'declined') return 'Needs Attention';
  return 'Pending';
}

function ClientCard({ client }) {
  const status = getStatus(client);
  return (
    <div className={`border rounded-lg shadow-sm p-4 mb-4 bg-white border-l-8 ${
      status === 'Pending' ? 'border-yellow-400' :
      status === 'Active' ? 'border-blue-700' :
      status === 'Completed' ? 'border-green-400' :
      'border-red-400'
    } transition`}>  
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-navy-900 truncate">{client.name}</h3>
        <span className={`px-2 py-1 rounded text-xs font-semibold border ${statusColors[status]}`}>{status}</span>
      </div>
      <div className="text-sm text-gray-700 mb-1"><span className="font-medium">Case Type:</span> {client.caseType}</div>
      <div className="text-xs text-gray-500">Recent Activity: {client.updatedAt ? new Date(client.updatedAt).toLocaleString() : 'N/A'}</div>
    </div>
  );
}

export default function Dashboard() {
  const { token } = useAuth();
  const { data, isLoading, error } = useClients(token);

  const clientsByStatus = React.useMemo(() => {
    const grouped = { 'Pending': [], 'Active': [], 'Completed': [], 'Needs Attention': [] };
    if (data && Array.isArray(data)) {
      data.forEach(client => {
        const status = getStatus(client);
        grouped[status].push(client);
      });
    }
    return grouped;
  }, [data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-white to-gray-100 p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-bold text-navy-900 mb-8 text-center tracking-tight">Client Onboarding Dashboard</h1>
      {isLoading && <div className="text-center text-navy-900">Loading clients...</div>}
      {error && <div className="text-center text-red-600">Error: {error.message}</div>}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {statusOrder.map(status => (
            <div key={status} className="bg-white rounded-lg shadow p-4 border-t-4 border-gold-400 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-navy-900 border-b border-gray-100 pb-2 flex items-center">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                  status === 'Pending' ? 'bg-yellow-400' :
                  status === 'Active' ? 'bg-blue-700' :
                  status === 'Completed' ? 'bg-green-400' :
                  'bg-red-400'
                }`}></span>
                {status}
              </h2>
              <div className="flex-1 overflow-y-auto">
                {clientsByStatus[status].length === 0 ? (
                  <div className="text-gray-400 text-sm">No clients</div>
                ) : (
                  clientsByStatus[status].map(client => (
                    <ClientCard key={client._id} client={client} />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`
        .text-navy-900 { color: #1a2341; }
        .bg-navy-900 { background-color: #1a2341; }
        .border-gold-400 { border-color: #e6b800; }
        .bg-gold-400 { background-color: #e6b800; }
      `}</style>
    </div>
  );
}
