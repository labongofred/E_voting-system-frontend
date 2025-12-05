import React, { useState, useEffect } from 'react';
import fetchWithAuth from '../../services/api'; // Use existing API service for GET positions

function CandidateNomination() {
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    candidate_name: '',
    voter_reg_no: '',
    program: '',
    position_id: '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [manifestoFile, setManifestoFile] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);


  // --- 1. Fetch Positions for Dropdown ---
  useEffect(() => {
    const fetchPositions = async () => {
      try {
        // Use the API endpoint created in Step 5 (AdminPositions)
        const data = await fetchWithAuth('/admin/positions'); 
        setPositions(data);
        if (data.length > 0) {
          // Set the default position ID to the first one available
          setFormData(prev => ({ ...prev, position_id: data[0].id.toString() }));
        }
      } catch (err) {
        setError("Could not load election positions. Please try again.");
      }
    };
    fetchPositions();
  }, []);

  // Handle changes for text inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle changes for file inputs
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'photoFile') {
      setPhotoFile(files[0]);
    } else if (name === 'manifestoFile') {
      setManifestoFile(files[0]);
    }
  };


  // --- 2. Handle Form Submission (Multipart/Form-Data) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!photoFile || !manifestoFile) {
      setError("Please upload both your photo and manifesto.");
      return;
    }

    setIsLoading(true);

    // Use the native FormData object for file uploads
    const dataToSend = new FormData();

    // Append all text fields
    Object.keys(formData).forEach(key => {
      dataToSend.append(key, formData[key]);
    });
    
    // Append files (ensure field names match backend Multer config)
    dataToSend.append('photoFile', photoFile);
    dataToSend.append('manifestoFile', manifestoFile);


    try {
      const response = await fetch('http://localhost:5000/api/candidate/nominate', {
        method: 'POST',
        // DO NOT set Content-Type header manually; FormData handles it as multipart/form-data
        // We will add an Authorization header later when implementing JWT (M3)
        body: dataToSend, 
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Nomination failed due to a server error.');
      }

      setSuccessMessage("✅ Nomination submitted successfully! You will be notified once the Returning Officer reviews it.");
      // Optional: Clear form here
      setFormData({ candidate_name: '', voter_reg_no: '', program: '', position_id: formData.position_id });
      setPhotoFile(null);
      setManifestoFile(null);

    } catch (err) {
      setError(err.message || "An unexpected error occurred during submission.");
      console.error("Submission Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">Candidate Nomination Form</h1>
      <p className="text-center text-gray-600 mb-8">
        [cite_start]Please complete all fields to submit your candidacy. Your submission will be reviewed by the Returning Officer[cite: 47].
      </p>

      {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
      {successMessage && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{successMessage}</div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* === Text Details Section === */}
        <div className="md:col-span-2">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Personal & Position Details</h2>
        </div>

        <div>
          <label htmlFor="candidate_name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input
            type="text"
            id="candidate_name"
            name="candidate_name"
            value={formData.candidate_name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="voter_reg_no" className="block text-sm font-medium text-gray-700">Voter Registration No. / ID</label>
          <input
            type="text"
            id="voter_reg_no"
            name="voter_reg_no"
            value={formData.voter_reg_no}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., DIT/22/001"
          />
        </div>
        
        <div>
          <label htmlFor="program" className="block text-sm font-medium text-gray-700">Program / Course of Study</label>
          <input
            type="text"
            id="program"
            name="program"
            value={formData.program}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="position_id" className="block text-sm font-medium text-gray-700">Position Applying For</label>
          {positions.length > 0 ? (
            <select
              id="position_id"
              name="position_id"
              value={formData.position_id}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="mt-2 text-red-500">No positions available.</p>
          )}
        </div>


        {/* === File Upload Section === */}
        <div className="md:col-span-2 mt-4">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Documents (Required)</h2>
        </div>

        <div>
          <label htmlFor="photoFile" className="block text-sm font-medium text-gray-700">Passport Photo (Image File)</label>
          <input
            type="file"
            id="photoFile"
            name="photoFile"
            accept="image/*"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {photoFile && <p className="text-xs text-gray-500 mt-1">Selected: {photoFile.name}</p>}
        </div>

        <div>
          <label htmlFor="manifestoFile" className="block text-sm font-medium text-gray-700">Manifesto Document (PDF Only)</label>
          <input
            type="file"
            id="manifestoFile"
            name="manifestoFile"
            accept=".pdf"
            onChange={handleFileChange}
            required
            className="mt-1 block w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {manifestoFile && <p className="text-xs text-gray-500 mt-1">Selected: {manifestoFile.name}</p>}
        </div>
        
        {/* === Submit Button === */}
        <div className="md:col-span-2 mt-6">
          <button
            type="submit"
            className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
            disabled={isLoading || positions.length === 0}
          >
            {isLoading ? 'Submitting Nomination...' : 'Submit Nomination'}
          </button>
        </div>

      </form>
    </div>
  );
}

export default CandidateNomination;