
const API_BASE_URL = "http://localhost:8000";

export async function fetchAnswer(prompt) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const res = await fetch(`${API_BASE_URL}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error: ${res.status} - ${errorText}`);
    }
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION')) {
      throw new Error('Cannot connect to backend server. Make sure the backend is running on http://localhost:8000');
    }
    throw error;
  }
}
