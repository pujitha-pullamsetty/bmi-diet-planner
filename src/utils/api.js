const API_BASE = "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed: ${response.status}`
    );
  }

  return data;
}

export function saveUserProfile(user) {
  return request("/api/users", {
    method: "POST",
    body: JSON.stringify(user),
  });
}

export function getUserRecommendation(userId) {
  return request(`/api/users/${userId}/recommend`, {
    method: "GET",
  });
}

export function askAI(message) {
  return request("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function getAIRecommendation(data) {
  return request("/api/ai/recommend", {
    method: "POST",
    body: JSON.stringify(data),
  });
}