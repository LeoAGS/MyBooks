import { emptyGroupLabels } from './groupHelpers';
import { getLibraryGroupLabels } from './groupLibraryItems';
import { compareStatusLabels, getReadingGroupLabels } from './groupReadingItems';
import { getWorkGroupLabels } from './groupWorkItems';

export { groupOptionsByScope } from './groupOptions';

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

function compareYearLabels(first, second) {
  return Number(second) - Number(first) || first.localeCompare(second);
}

function compareRatingLabels(first, second) {
  return Number(second.slice(0, 1)) - Number(first.slice(0, 1)) || first.localeCompare(second);
}
