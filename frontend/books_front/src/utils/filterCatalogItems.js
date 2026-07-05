import { compareWorks } from './sortWorks';

export function filterCatalogItems({ allWorks, libraryItems, query, scopeFilter, sortMode }) {
  const normalizedQuery = query.toLowerCase();

  if (scopeFilter === 'library') {
    return libraryItems
      .filter((item) => item.searchable.includes(normalizedQuery))
      .sort((first, second) => compareWorks(first, second, sortMode));
  }

  return allWorks
    .filter((work) => {
      const searchable = `${work.title} ${work.author} ${work.genre || ''} ${work.category || ''}`.toLowerCase();
      const matchesQuery = searchable.includes(normalizedQuery);
      const matchesScope = scopeFilter === 'all' || (scopeFilter === 'read' && work.readings?.length > 0);

      return matchesQuery && matchesScope;
    })
    .sort((first, second) => compareWorks(first, second, sortMode));
}
