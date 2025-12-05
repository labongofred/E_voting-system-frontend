import React, { useState, useEffect } from 'react';

// NOTE: In a real app, you would use a dedicated API service with token handling.
const fetchBallot = async () => {
  const token = localStorage.getItem('ballot_token');
  if (!token) {
    throw new Error("No ballot token found. Please verify your eligibility.");
  }
  
  const API_URL = 'http://localhost:5000/api/voting/ballot';

  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to load the ballot.');
  }

  return data;
};


function BallotPage() {
  const [ballot, setBallot] = useState([]); // The structure fetched from the API
  const [selections, setSelections] = useState({}); // Stores { position_id: [candidate_id, ...], ... }
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCastingVote, setIsCastingVote] = useState(false); // Used for the final submission step

  // --- 1. Fetch Ballot Data on Load ---
  useEffect(() => {
    fetchBallot()
      .then(data => {
        setBallot(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setIsLoading(false);
      });
  }, []);

  // --- 2. Handle Candidate Selection (Multi-select Logic) ---
  const handleSelection = (positionId, candidateId, maxSeats) => {
    setSelections(prevSelections => {
      const currentSelections = prevSelections[positionId] || [];

      if (maxSeats === 1) {
        // Single seat position: Select/Deselect
        return {
          ...prevSelections,
          [positionId]: currentSelections.includes(candidateId) ? [] : [candidateId],
        };
      } else {
        // Multi-seat position: Add or remove from array
        if (currentSelections.includes(candidateId)) {
          // Deselect
          return {
            ...prevSelections,
            [positionId]: currentSelections.filter(id => id !== candidateId),
          };
        } else if (currentSelections.length < maxSeats) {
          // Select (if below limit)
          return {
            ...prevSelections,
            [positionId]: [...currentSelections, candidateId],
          };
        } else {
          // Selection limit reached, ignore click
          return prevSelections;
        }
      }
    });
  };

  // --- 3. Handle Vote Casting (Placeholder for BE-M3-05) ---
  const handleCastVote = async () => {
    // Basic validation: Check if at least one choice has been made
    const hasVoted = Object.values(selections).some(arr => arr.length > 0);
    if (!hasVoted) {
      setError("Please select at least one candidate before casting your vote.");
      return;
    }

    // Convert selections object into a flat array of vote objects for the API
    const finalVoteData = Object.keys(selections).flatMap(positionId => 
      selections[positionId].map(candidateId => ({
        position_id: parseInt(positionId),
        candidate_id: candidateId,
      }))
    );

    // --- Placeholder for POST /api/voting/cast (BE-M3-05) ---
    setIsCastingVote(true);
    setError(null);
    console.log("Vote Data to be sent:", finalVoteData);
    
    // The actual vote casting implementation will be in the next step (BE-M3-05)
    
    try {
        // Assume API call is successful (will be implemented next)
        // const response = await fetch('http://localhost:5000/api/voting/cast', { ... });
        // if (response.ok) { ... } else { ... }
        
        // Mocking success and redirection
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        alert("🎉 Vote Cast Successfully! Thank you for participating.");
        // IMPORTANT: Clear token and redirect after successful vote
        // localStorage.removeItem('ballot_token');
        // window.location.href = '/voted-confirmation';
        
    } catch (apiError) {
        setError(apiError.message || "Failed to submit vote. Please try again.");
    } finally {
        setIsCastingVote(false);
    }
  };


  // --- 4. Render UI ---
  if (isLoading) {
    return <div className="text-center p-10 text-xl">Loading Official Ballot...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-10 mt-10 bg-red-100 border-l-4 border-red-500 text-red-700 rounded">
        <h2 className="text-2xl font-bold mb-3">Ballot Access Denied</h2>
        <p>{error}. Please try the <a href="/verify" className="underline font-semibold">verification page</a> again.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-2 text-center text-gray-800">🗳️ Official Election Ballot</h1>
      <p className="text-center text-xl text-gray-600 mb-8 border-b pb-4">Select your choices and click "Cast My Vote" at the bottom.</p>

      {/* Ballot Content */}
      <div className="space-y-10">
        {ballot.map(position => {
          const maxSeats = position.seats || 1;
          const currentSelections = selections[position.id] || [];
          const selectionCount = currentSelections.length;
          
          return (
            <div key={position.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              
              {/* Position Header */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-indigo-100">
                <h2 className="text-2xl font-bold text-indigo-700">{position.name}</h2>
                <span className={`text-sm font-semibold p-2 rounded-full ${
                    selectionCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {selectionCount} of {maxSeats} Selected
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                  You may vote for up to **{maxSeats}** candidate{maxSeats > 1 ? 's' : ''} for this position.
              </p>

              {/* Candidates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {position.candidates.map(candidate => {
                  const isSelected = currentSelections.includes(candidate.id);
                  const isDisabled = !isSelected && selectionCount >= maxSeats;

                  return (
                    <div
                      key={candidate.id}
                      onClick={() => !isDisabled && handleSelection(position.id, candidate.id, maxSeats)}
                      className={`
                        p-4 border-2 rounded-lg cursor-pointer transition duration-200 
                        ${isSelected 
                            ? 'border-green-500 bg-green-50 shadow-md ring-4 ring-green-300' 
                            : isDisabled 
                            ? 'border-gray-200 bg-gray-50 opacity-60'
                            : 'border-gray-300 hover:border-indigo-400 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="text-lg font-semibold text-gray-800">{candidate.name}</div>
                      <div className="text-xs text-gray-500 mt-1 mb-2">
                        <a href={`http://localhost:5000${candidate.manifesto_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            View Manifesto
                        </a> |
                        <a href={`http://localhost:5000${candidate.photo_url}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                            View Photo
                        </a>
                      </div>
                      {isSelected && <span className="text-green-600 font-bold text-sm">✓ SELECTED</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Final Cast Vote Button */}
      <div className="mt-12 sticky bottom-0 bg-white p-4 shadow-2xl rounded-t-xl border-t-4 border-indigo-500">
        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4">{error}</div>}
        <button
          onClick={handleCastVote}
          className="w-full py-4 px-4 rounded-lg text-xl font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition duration-150 ease-in-out"
          disabled={isCastingVote || isLoading}
        >
          {isCastingVote ? 'Casting Vote Securely...' : 'Cast My Vote Now'}
        </button>
        <p className="text-center text-sm text-gray-500 mt-2">
            **WARNING: This is a single-use ballot. Once submitted, your token is consumed and you cannot vote again.**
        </p>
      </div>
    </div>
  );
}

export default BallotPage;