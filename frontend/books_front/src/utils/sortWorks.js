export function compareWorks(first, second, sortMode) {
  const byTitle = compareText(first.title, second.title);

  if (sortMode === 'title') {
    return byTitle;
  }

  if (sortMode === 'author') {
    return compareText(first.author, second.author) || byTitle;
  }

  if (sortMode === 'year') {
    return compareNumber(first.originalYear, second.originalYear) || byTitle;
  }

  if (sortMode === 'genre') {
    return compareText(first.genre, second.genre) || byTitle;
  }

  if (sortMode === 'copies') {
    return getCopySortValue(second) - getCopySortValue(first) || byTitle;
  }

  return compareDate(second.updatedAt, first.updatedAt) || byTitle;
}

function compareText(first, second) {
  return normalizeSortValue(first).localeCompare(normalizeSortValue(second));
}

function compareNumber(first, second) {
  if (first == null && second == null) {
    return 0;
  }

  if (first == null) {
    return 1;
  }

  if (second == null) {
    return -1;
  }

  return first - second;
}

function compareDate(first, second) {
  return new Date(first || 0).getTime() - new Date(second || 0).getTime();
}

function normalizeSortValue(value) {
  return (value || '').trim().toLocaleLowerCase('pt-BR');
}

function getCopySortValue(work) {
  return work.volumeCount || work.copyCount || 0;
}
