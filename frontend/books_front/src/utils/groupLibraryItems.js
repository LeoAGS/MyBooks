import { splitGroupValues, uniqueLabels, normalizeGroupValue } from './groupHelpers';
import { getWorkGroupLabels } from './groupWorkItems';

export function getLibraryGroupLabels(item, groupMode, emptyLabel) {
  if (groupMode === 'authors') {
    return [normalizeGroupValue(item.author) || emptyLabel];
  }

  if (groupMode === 'publishers') {
    return valuesFromCopies(item, 'publisher', emptyLabel);
  }

  if (groupMode === 'editorialCollections') {
    return valuesFromCopies(item, 'editorialCollection', emptyLabel);
  }

  if (groupMode === 'locations') {
    return valuesFromCopies(item, 'location', emptyLabel);
  }

  if (groupMode === 'conditions') {
    return valuesFromCopies(item, 'condition', emptyLabel);
  }

  return getWorkGroupLabels(item, groupMode, emptyLabel);
}

function valuesFromCopies(item, field, emptyLabel) {
  return uniqueLabels(
    item.copies?.flatMap((copy) => splitGroupValues(copy[field], emptyLabel, false)),
    emptyLabel
  );
}
