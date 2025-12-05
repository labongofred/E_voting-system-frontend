import React, { useState, useEffect } from 'react';
import fetchWithAuth from '../../services/api'; 

function OfficerReview() {
  const [nominations, setNominations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [currentAction, setCurrentAction] = useState(null); // 'APPROVE' or 'REJECT'

  const API_BASE_URL = 'http://localhost:5000/api'; // Direct fetch for this flow

  // --- 1. Fetch Nominations ---
  const fetchNominations = async () => {
    setIsLoading(true);
    try {
      // NOTE: We'll add a new BE endpoint GET /api/candidate for this, 
      // but for now, we'll fetch all and filter client-side for simplicity, 
      // or assume the backend will implement a GET /api/officer/nominations endpoint
      // Let's assume a simplified endpoint for M2: GET /api/candidate/pending
      const data = await fetchWithAuth('/candidate'); // Assuming this returns all nominations
      // Filtering client-side for PENDING status for the initial view
      setNominations(data.filter(n => n.status === 'PENDING'));
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load nominations for review.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNominations();
  }, []);


  // --- 2. Handle Decision Submission ---
  const handleDecision = async (candidateId, action, reason = null) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/candidate/${candidateId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action, reason: reason }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Decision submission failed.');
      }
      
      // Remove the processed nomination from the list
      setNominations(nominations.filter(n => n.id !== candidateId));
      
      // Close modal and reset state
      setIsModalOpen(false);
      setSelectedCandidate(null);
      setCurrentAction(null);
      setRejectionReason('');

      alert(`Nomination for ${result.candidate.name} ${action.toLowerCase()}ed.`);
      
    } catch (err) {
      setError(err.message || "An error occurred while processing the decision.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDecisionModal = (candidate, action) => {
    setSelectedCandidate(candidate);
    setCurrentAction(action);
    setIsModalOpen(true);
  };
  
  const submitDecision = (e) => {
      e.preventDefault();
      if (currentAction === 'REJECT' && !rejectionReason.trim()) {
          setError("Rejection reason is mandatory.");
          return;
      }
      handleDecision(selectedCandidate.id, currentAction, rejectionReason);
  };

  const getFileLink = (path) => {
      // Access files served statically by the backend
      return `http://localhost:5000${path}`;
  };

  // --- 3. Render ---
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Returning Officer: Nomination Review</h1>
      <p className="mb-6 text-gray-600">Review and decide on pending candidate submissions.</p>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      
      {isLoading ? (
        <p>Loading pending nominations...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nominations.length === 0 ? (
            <p className="md:col-span-3 text-center text-xl text-gray-500">
                🎉 No pending nominations for review!
            </p>
          ) : (
            nominations.map(candidate => (
              <div key={candidate.id} className="bg-white border rounded-lg shadow-md p-5 flex flex-col">
                <h2 className="text-xl font-semibold mb-2">{candidate.name}</h2>
                <p className="text-sm text-gray-600 mb-3">Position ID: {candidate.position_id} | Reg No: {candidate.voter_reg_no}</p>
                
                <div className="flex space-x-3 mb-4">
                    <a href={getFileLink(candidate.photo_url)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">View Photo</a>
                    <a href={getFileLink(candidate.manifesto_url)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">View Manifesto (PDF)</a>
                </div>

                <div className="mt-auto flex justify-between space-x-4 pt-3 border-t">
                  <button
                    onClick={() => openDecisionModal(candidate, 'APPROVE')}
                    className="flex-1 bg-green-600 text-white py-2 rounded text-sm hover:bg-green-700 transition"
                    disabled={isLoading}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => openDecisionModal(candidate, 'REJECT')}
                    className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700 transition"
                    disabled={isLoading}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* --- Decision Modal --- */}
      {isModalOpen && selectedCandidate && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex justify-center items-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-lg">
            <h2 className={`text-2xl font-bold mb-4 ${currentAction === 'APPROVE' ? 'text-green-700' : 'text-red-700'}`}>
              {currentAction} Nomination
            </h2>
            <p className="mb-4">Are you sure you want to **{currentAction.toLowerCase()}** the nomination for **{selectedCandidate.name}**?</p>

            <form onSubmit={submitDecision}>
              {currentAction === 'REJECT' && (
                <div className="mb-4">
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700">Reason for Rejection (Required)</label>
                  <textarea
                    id="reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2"
                    required
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded text-white ${currentAction === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : currentAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OfficerReview;