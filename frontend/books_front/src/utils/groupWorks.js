export const workGroupOptions = {
  all: 'Todos',
  collections: 'Colecoes',
  authors: 'Autores',
  genres: 'Generos',
  categories: 'Categorias',
};

const emptyGroupLabels = {
  collections: 'Sem colecao',
  authors: 'Sem autor',
  genres: 'Sem genero',
  categories: 'Sem categoria',
};

export function groupWorks(works, groupMode) {
  if (groupMode === 'all') {
    return [{ key: 'all', label: '', works }];
  }

  const groups = new Map();
  works.forEach((work) => {
    const labels = getGroupLabels(work, groupMode);
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
      key: `${groupMode}:${label}`,
      label,
      works: groupedWorks,
    }));
}

function getGroupLabels(work, groupMode) {
  const emptyLabel = emptyGroupLabels[groupMode] || 'Sem grupo';

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

function splitGroupValues(value, emptyLabel) {
  const values = String(value || '')
    .split(',')
    .map((item) => normalizeGroupValue(item))
    .filter(Boolean);

  return values.length > 0 ? [...new Set(values)] : [emptyLabel];
}

function normalizeGroupValue(value) {
  return String(value || '').trim();
}

function compareGroupLabels(first, second, groupMode) {
  const emptyLabel = emptyGroupLabels[groupMode];
  if (first === emptyLabel && second !== emptyLabel) {
    return 1;
  }
  if (second === emptyLabel && first !== emptyLabel) {
    return -1;
  }
  return first.localeCompare(second);
}
