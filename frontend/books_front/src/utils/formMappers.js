export function workToForm(work) {
  return {
    title: work.title || '',
    author: work.author || '',
    originalTitle: work.originalTitle || '',
    originalYear: work.originalYear || '',
    genre: work.genre || '',
    category: work.category || '',
    collectionName: work.collectionName || '',
    collectionNumber: work.collectionNumber || '',
    description: work.description || '',
    coverUrl: work.coverUrl || '',
  };
}

export function workFormToPayload(form) {
  return {
    title: form.title,
    author: form.author,
    originalTitle: emptyToNull(form.originalTitle),
    originalYear: toNumber(form.originalYear),
    genre: emptyToNull(form.genre),
    category: emptyToNull(form.category),
    collectionName: emptyToNull(form.collectionName),
    collectionNumber: emptyToNull(form.collectionNumber),
    description: emptyToNull(form.description),
    coverUrl: emptyToNull(form.coverUrl),
  };
}

export function readingToForm(reading) {
  return {
    status: reading.status || 'Read',
    startedAt: reading.startedAt || '',
    finishedAt: reading.finishedAt || '',
    rating: reading.rating || '',
    review: reading.review || '',
    notes: reading.notes || '',
    isFavorite: reading.isFavorite || false,
    wantToReRead: reading.wantToReRead || false,
  };
}

export function readingFormToPayload(form) {
  return {
    status: form.status,
    startedAt: emptyToNull(form.startedAt),
    finishedAt: emptyToNull(form.finishedAt),
    rating: toNumber(form.rating),
    review: emptyToNull(form.review),
    notes: emptyToNull(form.notes),
    isFavorite: form.isFavorite,
    wantToReRead: form.wantToReRead,
  };
}

export function copyToForm(copy) {
  return {
    copyTitle: copy.copyTitle || '',
    containedWorkIds: copy.containedWorks?.map((work) => work.id) || [],
    format: copy.format || 'Physical',
    publisher: copy.publisher || '',
    editorialCollection: copy.editorialCollection || '',
    edition: copy.edition || '',
    isbn: copy.isbn || '',
    publishedYear: copy.publishedYear || '',
    language: copy.language || '',
    pageCount: copy.pageCount || '',
    volumeCount: copy.volumeCount || 1,
    condition: copy.condition || '',
    location: copy.location || '',
    acquisitionDate: copy.acquisitionDate || '',
    acquisitionType: copy.acquisitionType || 'Unknown',
    pricePaid: copy.pricePaid || '',
    currency: copy.currency || 'BRL',
    isGift: copy.isGift || false,
    isSigned: copy.isSigned || false,
    notes: copy.notes || '',
  };
}

export function copyFormToPayload(form) {
  return {
    copyTitle: emptyToNull(form.copyTitle),
    containedWorkIds: form.containedWorkIds || [],
    format: form.format,
    publisher: emptyToNull(form.publisher),
    editorialCollection: emptyToNull(form.editorialCollection),
    edition: emptyToNull(form.edition),
    isbn: emptyToNull(form.isbn),
    publishedYear: toNumber(form.publishedYear),
    language: emptyToNull(form.language),
    pageCount: toNumber(form.pageCount),
    volumeCount: Math.max(1, toNumber(form.volumeCount) || 1),
    condition: emptyToNull(form.condition),
    location: emptyToNull(form.location),
    acquisitionDate: emptyToNull(form.acquisitionDate),
    acquisitionType: form.acquisitionType,
    pricePaid: toNumber(String(form.pricePaid).replace(',', '.')),
    currency: emptyToNull(form.currency) || 'BRL',
    isGift: form.isGift,
    isSigned: form.isSigned,
    notes: emptyToNull(form.notes),
  };
}

export function emptyToNull(value) {
  return value === '' || value === null || value === undefined ? null : value;
}

export function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}
