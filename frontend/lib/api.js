export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Helper function to parse JSON response safely
async function parseJSONResponse(res) {
  const contentType = res.headers.get("content-type");
  
  if (!contentType || !contentType.includes("application/json")) {
    const text = await res.text();
    // If it's HTML, it's likely an error page
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(`Server returned HTML instead of JSON. Status: ${res.status}. The backend server may not be running or the endpoint doesn't exist.`);
    }
    throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 200)}`);
  }
  
  try {
    return await res.json();
  } catch (error) {
    const text = await res.text();
    throw new Error(`Failed to parse JSON response: ${error.message}. Response: ${text.substring(0, 200)}`);
  }
}

// Send OTP
export async function sendOTP(mobileNumber) {
  try {
    const res = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: `+91${mobileNumber}` })
    });
    
    const json = await parseJSONResponse(res);
    
    if (!res.ok) {
      throw new Error(json.error || json.message || 'Failed to send OTP');
    }
    
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    throw error;
  }
}

// Verify OTP
export async function verifyOTP(mobileNumber, otp) {
  try {
    const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mobileNumber: `+91${mobileNumber}`, otp })
    });
    
    const json = await parseJSONResponse(res);
    
    if (!res.ok) {
      throw new Error(json.error || json.message || 'OTP verification failed');
    }
    
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    throw error;
  }
}

// Submit user details and get results
export async function submitUserDetails(payload) {
  try {
    const res = await fetch(`${API_URL}/api/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    const json = await parseJSONResponse(res);
    
    if (!res.ok) {
      throw new Error(json.error || json.message || 'Submission failed');
    }
    
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    throw error;
  }
}

// Get user submissions
export async function getUserSubmissions(mobileNumber) {
  try {
    const res = await fetch(`${API_URL}/api/submissions/${mobileNumber}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    const json = await parseJSONResponse(res);
    
    if (!res.ok) {
      throw new Error(json.error || json.message || 'Failed to fetch submissions');
    }
    
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    throw error;
  }
}

// Admin: Get all star/problem mappings
export async function getStarProblemMappings() {
  try {
    const res = await fetch(`${API_URL}/api/admin/star-problems`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });
    
    const json = await parseJSONResponse(res);
    
    // Return the response as-is (includes success and data/error fields)
    // Component will handle both success and error cases
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    // If it's a database error, provide a helpful message
    if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      throw new Error("Database connection error: " + error.message + ". Please check your DATABASE_URL configuration.");
    }
    throw error;
  }
}

// Admin: Add/Update star/problem mapping
export async function saveStarProblemMapping(mapping) {
  try {
    const res = await fetch(`${API_URL}/api/admin/star-problems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mapping)
    });
    
    const json = await parseJSONResponse(res);
    
    if (!res.ok) {
      throw new Error(json.error || json.message || 'Failed to save mapping');
    }
    
    return json;
  } catch (error) {
    if (error.message.includes("fetch")) {
      throw new Error("Cannot connect to backend server. Please make sure the backend is running on " + API_URL);
    }
    throw error;
  }
}
