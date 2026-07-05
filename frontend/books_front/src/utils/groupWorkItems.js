import { normalizeGroupValue, splitGroupValues } from './groupHelpers';

export function getWorkGroupLabels(work, groupMode, emptyLabel) {
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
