const BASE = '/api';

async function request(path, options) {
  const res = await fetch(`${BASE}${path}`, {
    headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getJobs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  const qs = params.toString();
  return request(`/jobs${qs ? `?${qs}` : ''}`);
}

export function patchJobStatus(id, status) {
  return request(`/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function getDestinations() {
  return request('/destinations');
}

export function createDestination(payload) {
  return request('/destinations', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateDestination(key, payload) {
  return request(`/destinations/${key}`, { method: 'PATCH', body: JSON.stringify(payload) });
}

export function deleteDestination(key) {
  return request(`/destinations/${key}`, { method: 'DELETE' });
}

export function getLinks(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/links${qs ? `?${qs}` : ''}`);
}

export function getBadge() {
  return request('/meta/badge');
}

export function markVisited() {
  return request('/meta/mark-visited', { method: 'POST' });
}

export function getSyncStatus() {
  return request('/meta/sync-status');
}

export function runSyncNow() {
  return request('/meta/sync-run', { method: 'POST' });
}
