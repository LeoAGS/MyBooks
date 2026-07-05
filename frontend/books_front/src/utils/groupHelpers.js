export const emptyGroupLabels = {
  collections: 'Sem colecao',
  publishers: 'Sem editora',
  editorialCollections: 'Sem colecao editorial',
  authors: 'Sem autor',
  genres: 'Sem genero',
  categories: 'Sem categoria',
  locations: 'Sem localizacao',
  conditions: 'Sem estado',
  statuses: 'Sem status',
  years: 'Sem ano',
  ratings: 'Sem nota',
};

export function splitGroupValues(value, emptyLabel, fallback = true) {
  const values = String(value || '')
    .split(',')
    .map((item) => normalizeGroupValue(item))
    .filter(Boolean);

  const uniqueValues = [...new Set(values)];
  return uniqueValues.length > 0 ? uniqueValues : fallback ? [emptyLabel] : [];
}

export function uniqueLabels(values, emptyLabel) {
  const labels = [...new Set((values || []).map((value) => normalizeGroupValue(value)).filter(Boolean))];
  return labels.length > 0 ? labels : [emptyLabel];
}

export function normalizeGroupValue(value) {
  return String(value || '').trim();
}
