const API_BASE = '';

function getHeaders(customHeaders = {}) {
  const headers = { 'Content-Type': 'application/json', ...customHeaders };
  const userKey = localStorage.getItem('gemini_api_key');
  if (userKey) {
    headers['X-Gemini-API-Key'] = userKey;
  }
  return headers;
}

export async function createJob(jobData) {
  const res = await fetch(`${API_BASE}/jobs/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(jobData),
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

export async function uploadCandidateCV(formData) {
  const headers = {};
  const userKey = localStorage.getItem('gemini_api_key');
  if (userKey) {
    headers['X-Gemini-API-Key'] = userKey;
  }

  const res = await fetch(`${API_BASE}/candidates/upload-cv/`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || Object.values(errorData).flat().join(', ') || 'Failed to upload CV');
  }
  return res.json();
}

export async function getInterviews() {
  const res = await fetch(`${API_BASE}/interviews/`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch interviews');
  return res.json();
}

export async function startInterviewSession(candidateId, jobPostingId) {
  const res = await fetch(`${API_BASE}/interviews/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      candidate: candidateId,
      job_posting: jobPostingId,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start interview session');
  }
  return res.json();
}

export async function submitQuestionAnswer(sessionId, answerText) {
  const res = await fetch(`${API_BASE}/interviews/answer/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      answer: answerText,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit answer');
  }
  return res.json();
}

export async function evaluateInterviewSession(sessionId) {
  const res = await fetch(`${API_BASE}/interviews/evaluate/`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to evaluate interview session');
  }
  return res.json();
}

