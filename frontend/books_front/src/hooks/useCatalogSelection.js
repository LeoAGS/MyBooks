import { useMemo, useState } from 'react';

export function useCatalogSelection({ allWorks, filteredItems, scopeFilter }) {
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [selectedCopyId, setSelectedCopyId] = useState(null);

  const selectedItem = useMemo(
    () =>
      filteredItems.find((item) => (scopeFilter === 'library' ? item.copyId === selectedCopyId : item.id === selectedWorkId)) ||
      filteredItems[0] ||
      null,
    [filteredItems, scopeFilter, selectedCopyId, selectedWorkId]
  );

  const selectedWork = useMemo(
    () => (scopeFilter === 'library' ? allWorks.find((work) => work.id === selectedItem?.workId) || null : selectedItem),
    [allWorks, scopeFilter, selectedItem]
  );

  const selectedCopy = scopeFilter === 'library' ? selectedItem?.copy || null : null;

  function selectListItem(item) {
    if (scopeFilter === 'library') {
      setSelectedCopyId(item.copyId);
      setSelectedWorkId(item.workId);
      return;
    }

    setSelectedWorkId(item.id);
    setSelectedCopyId(null);
  }

  return {
    selectedCopy,
    selectedCopyId,
    selectedItem,
    selectedWork,
    selectedWorkId,
    selectListItem,
    setSelectedCopyId,
    setSelectedWorkId,
  };
}
