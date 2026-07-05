import { readingStatusLabels } from '../constants/labels';
import { normalizeGroupValue, splitGroupValues, uniqueLabels } from './groupHelpers';

export const readingStatusOrder = ['Reading', 'Read', 'WantToRead', 'Paused', 'Abandoned'];

export function getReadingGroupLabels(work, groupMode, emptyLabel) {
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

export function compareStatusLabels(first, second) {
  const firstIndex = readingStatusOrder.findIndex((status) => readingStatusLabels[status] === first);
  const secondIndex = readingStatusOrder.findIndex((status) => readingStatusLabels[status] === second);

  if (firstIndex !== -1 || secondIndex !== -1) {
    return (firstIndex === -1 ? readingStatusOrder.length : firstIndex) - (secondIndex === -1 ? readingStatusOrder.length : secondIndex);
  }

  return first.localeCompare(second);
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
