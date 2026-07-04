import { readingStatusLabels } from '../constants/labels';

export const workGroupOptions = {
  all: 'Todos',
  collections: 'Colecoes',
  authors: 'Autores',
  genres: 'Generos',
  categories: 'Categorias',
};

export const libraryGroupOptions = {
  all: 'Todos',
  publishers: 'Editoras',
  editorialCollections: 'Colecoes',
  authors: 'Autores',
  locations: 'Localizacao',
  conditions: 'Estado',
};

export const readingGroupOptions = {
  all: 'Todos',
  statuses: 'Status',
  years: 'Ano',
  ratings: 'Nota',
  authors: 'Autores',
  genres: 'Generos',
  categories: 'Categorias',
};

export const groupOptionsByScope = {
  all: workGroupOptions,
  library: libraryGroupOptions,
  read: readingGroupOptions,
};

const emptyGroupLabels = {
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

const statusOrder = ['Reading', 'Read', 'WantToRead', 'Paused', 'Abandoned'];

export function groupWorks(works, groupMode, scope = 'all') {
  if (groupMode === 'all') {
    return [{ key: 'all', label: '', works }];
  }

  const groups = new Map();
  works.forEach((work) => {
    const labels = getGroupLabels(work, groupMode, scope);
    labels.forEach((label) => {
      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label).push(work);
    });
  });

  return [...groups.entries()]
    .sort(([first], [second]) => compareGroupLabels(first, second, groupMode))
    .map(([label, groupedWorks]) => ({
      key: `${scope}:${groupMode}:${label}`,
      label,
      works: groupedWorks,
    }));
}

function getGroupLabels(work, groupMode, scope) {
  const emptyLabel = emptyGroupLabels[groupMode] || 'Sem grupo';

  if (scope === 'library') {
    return getLibraryGroupLabels(work, groupMode, emptyLabel);
  }

  if (scope === 'read') {
    return getReadingGroupLabels(work, groupMode, emptyLabel);
  }

  return getWorkGroupLabels(work, groupMode, emptyLabel);
}

function getWorkGroupLabels(work, groupMode, emptyLabel) {
  if (groupMode === 'collections') {
    return [normalizeGroupValue(work.collectionName) || emptyLabel];
  }

  if (groupMode === 'authors') {
    return [normalizeGroupValue(work.author) || emptyLabel];
  }

  if (groupMode === 'genres') {
    return splitGroupValues(work.genre, emptyLabel);
  }

  if (groupMode === 'categories') {
    return splitGroupValues(work.category, emptyLabel);
  }

  return [emptyLabel];
}

function getLibraryGroupLabels(work, groupMode, emptyLabel) {
  if (groupMode === 'authors') {
    return [normalizeGroupValue(work.author) || emptyLabel];
  }

  if (groupMode === 'publishers') {
    return valuesFromCopies(work, 'publisher', emptyLabel);
  }

  if (groupMode === 'editorialCollections') {
    return valuesFromCopies(work, 'editorialCollection', emptyLabel);
  }

  if (groupMode === 'locations') {
    return valuesFromCopies(work, 'location', emptyLabel);
  }

  if (groupMode === 'conditions') {
    return valuesFromCopies(work, 'condition', emptyLabel);
  }

  return getWorkGroupLabels(work, groupMode, emptyLabel);
}

function getReadingGroupLabels(work, groupMode, emptyLabel) {
  if (groupMode === 'authors') {
    return [normalizeGroupValue(work.author) || emptyLabel];
  }

  if (groupMode === 'genres') {
    return splitGroupValues(work.genre, emptyLabel);
  }

  if (groupMode === 'categories') {
    return splitGroupValues(work.category, emptyLabel);
  }

  if (groupMode === 'statuses') {
    return uniqueLabels(
      work.readings?.map((reading) => readingStatusLabels[reading.status] || reading.status),
      emptyLabel
    );
  }

  if (groupMode === 'years') {
    return uniqueLabels(
      work.readings?.map((reading) => getReadingYear(reading)),
      emptyLabel
    );
  }

  if (groupMode === 'ratings') {
    return uniqueLabels(
      work.readings?.map((reading) => formatRating(reading.rating)),
      emptyLabel
    );
  }

  return [emptyLabel];
}

function valuesFromCopies(work, field, emptyLabel) {
  return uniqueLabels(
    work.copies?.flatMap((copy) => splitGroupValues(copy[field], emptyLabel, false)),
    emptyLabel
  );
}

function splitGroupValues(value, emptyLabel, fallback = true) {
  const values = String(value || '')
    .split(',')
    .map((item) => normalizeGroupValue(item))
    .filter(Boolean);

  const uniqueValues = [...new Set(values)];
  return uniqueValues.length > 0 ? uniqueValues : fallback ? [emptyLabel] : [];
}

function uniqueLabels(values, emptyLabel) {
  const labels = [...new Set((values || []).map((value) => normalizeGroupValue(value)).filter(Boolean))];
  return labels.length > 0 ? labels : [emptyLabel];
}

function normalizeGroupValue(value) {
  return String(value || '').trim();
}

function getReadingYear(reading) {
  return String(reading.finishedAt || reading.startedAt || '').slice(0, 4);
}

function formatRating(rating) {
  const value = Number(rating);
  if (!value) {
    return '';
  }
  return `${value} estrela${value === 1 ? '' : 's'}`;
}

function compareGroupLabels(first, second, groupMode) {
  const emptyLabel = emptyGroupLabels[groupMode];
  if (first === emptyLabel && second !== emptyLabel) {
    return 1;
  }
  if (second === emptyLabel && first !== emptyLabel) {
    return -1;
  }

  if (groupMode === 'statuses') {
    return compareStatusLabels(first, second);
  }

  if (groupMode === 'years') {
    return compareYearLabels(first, second);
  }

  if (groupMode === 'ratings') {
    return compareRatingLabels(first, second);
  }

  return first.localeCompare(second);
}

function compareStatusLabels(first, second) {
  const firstIndex = statusOrder.findIndex((status) => readingStatusLabels[status] === first);
  const secondIndex = statusOrder.findIndex((status) => readingStatusLabels[status] === second);

  if (firstIndex !== -1 || secondIndex !== -1) {
    return (firstIndex === -1 ? statusOrder.length : firstIndex) - (secondIndex === -1 ? statusOrder.length : secondIndex);
  }

  return first.localeCompare(second);
}

function compareYearLabels(first, second) {
  return Number(second) - Number(first) || first.localeCompare(second);
}

function compareRatingLabels(first, second) {
  return Number(second.slice(0, 1)) - Number(first.slice(0, 1)) || first.localeCompare(second);
}
