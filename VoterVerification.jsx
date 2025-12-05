import React, { useState } from 'react';

function VoterVerification() {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Confirm OTP
  const [regNo, setRegNo] = useState('');
  const [method, setMethod] = useState('EMAIL'); // Default to EMAIL
  const [otp, setOtp] = useState('');
  
  // State to hold data returned from request-otp step
  const [verificationData, setVerificationData] = useState({
      verification_id: null,
      voter_id: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const API_BASE_URL = 'http://localhost:5000/api/verify'; 

  // --- 1. Request OTP Handler ---
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!regNo) {
      setError("Please enter your Voter Registration Number.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reg_no: regNo, method }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to request OTP.');
      }

      // Store verification ID and move to step 2
      setVerificationData({
          verification_id: result.verification_id,
          voter_id: result.voter_id
      });
      setMessage(result.message);
      setStep(2); 

    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      console.error("OTP Request Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 2. Confirm OTP Handler ---
  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            verification_id: verificationData.verification_id, 
            otp 
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed.');
      }

      // Success: Store the single-use ballot token in local storage
      // This token will be used as the bearer token for voting requests
      localStorage.setItem('ballot_token', result.ballot_token);
      localStorage.setItem('voter_id', result.voter_id);

      setMessage("✅ Verification successful! Redirecting you to the ballot...");
      
      // Navigate to the main voting page (FE-M3-04)
      // NOTE: Replace with actual routing logic later (e.g., useNavigate hook)
      setTimeout(() => {
          console.log("Redirecting to /ballot...");
          // window.location.href = '/ballot'; // Uncomment this line when routing is set up
      }, 1500);


    } catch (err) {
      setError(err.message || "An unexpected error occurred during verification.");
      console.error("OTP Confirmation Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Function ---
  return (
    <div className="max-w-xl mx-auto p-8 mt-10 bg-white shadow-2xl rounded-xl">
      <h1 className="text-3xl font-bold mb-2 text-center text-indigo-700">Voter Verification</h1>
      <p className="text-center text-gray-600 mb-6">
        {step === 1 ? 'Enter your details to receive a single-use verification code.' : 'Enter the code sent to your chosen contact method.'}
      </p>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      {message && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{message}</div>}

      {/* --- Step 1: Request OTP --- */}
      {step === 1 && (
        <form onSubmit={handleRequestOtp}>
          <div className="mb-6">
            <label htmlFor="regNo" className="block text-sm font-medium text-gray-700 mb-2">Voter Registration Number</label>
            <input
              type="text"
              id="regNo"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              required
              className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., DIT/22/001"
              disabled={isLoading}
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Method</label>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="EMAIL"
                  checked={method === 'EMAIL'}
                  onChange={() => setMethod('EMAIL')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-700">Email</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="SMS"
                  checked={method === 'SMS'}
                  onChange={() => setMethod('SMS')}
                  className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                  disabled={isLoading}
                />
                <span className="ml-2 text-gray-700">SMS (Phone)</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? 'Requesting Code...' : 'Request Verification Code'}
          </button>
        </form>
      )}

      {/* --- Step 2: Confirm OTP --- */}
      {step === 2 && (
        <form onSubmit={handleConfirmOtp}>
          <p className="mb-6 text-center text-md text-gray-700 font-semibold">
            Verification ID: <span className="text-indigo-600">{verificationData.verification_id}</span>
          </p>
          <div className="mb-6">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">Enter 6-Digit Code</label>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              maxLength="6"
              className="mt-1 block w-full text-center text-2xl tracking-widest border border-gray-300 rounded-lg shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="XXXXXX"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying Code...' : 'Confirm & Get Ballot'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full mt-4 py-2 text-sm text-indigo-600 hover:text-indigo-800"
            disabled={isLoading}
          >
            Go Back / Request New Code
          </button>
        </form>
      )}
    </div>
  );
}

export default VoterVerification;