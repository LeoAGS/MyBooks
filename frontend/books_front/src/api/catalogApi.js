const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5043';

async function requestJson(path, options = {}, errorMessage = 'Falha na requisicao.') {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getCatalog() {
  return requestJson('/api/catalog', {}, 'Falha ao carregar catalogo.');
}

export function createWork(payload) {
  return requestJson(
    '/api/works',
    { method: 'POST', body: JSON.stringify(payload) },
    'Falha ao salvar obra.'
  );
}

export function updateWork(id, payload) {
  return requestJson(
    `/api/works/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    'Falha ao atualizar obra.'
  );
}

export function deleteWork(id) {
  return requestJson(`/api/works/${id}`, { method: 'DELETE' }, 'Falha ao remover obra.');
}

export function updateCurrentReading(workId, payload) {
  return requestJson(
    `/api/works/${workId}/reading`,
    { method: 'PUT', body: JSON.stringify(payload) },
    'Falha ao atualizar leitura.'
  );
}

export function createReading(workId, payload) {
  return requestJson(
    `/api/works/${workId}/readings`,
    { method: 'POST', body: JSON.stringify(payload) },
    'Falha ao salvar leitura.'
  );
}

export function updateReading(workId, readingId, payload) {
  return requestJson(
    `/api/works/${workId}/readings/${readingId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    'Falha ao salvar leitura.'
  );
}

export function deleteReading(workId, readingId) {
  return requestJson(
    `/api/works/${workId}/readings/${readingId}`,
    { method: 'DELETE' },
    'Falha ao remover leitura.'
  );
}

export function createCopy(workId, payload) {
  return requestJson(
    `/api/works/${workId}/copies`,
    { method: 'POST', body: JSON.stringify(payload) },
    'Falha ao salvar exemplar.'
  );
}

export function updateCopy(workId, copyId, payload) {
  return requestJson(
    `/api/works/${workId}/copies/${copyId}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    'Falha ao salvar exemplar.'
  );
}

export function deleteCopy(workId, copyId) {
  return requestJson(
    `/api/works/${workId}/copies/${copyId}`,
    { method: 'DELETE' },
    'Falha ao remover exemplar.'
  );
}

export async function getCopiesBackupBlob() {
  const response = await fetch(`${API_BASE_URL}/api/backups/copies.csv`);

  if (!response.ok) {
    throw new Error('Falha ao gerar backup.');
  }

  return response.blob();
}
