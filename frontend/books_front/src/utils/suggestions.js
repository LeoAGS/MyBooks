export function buildSuggestions(allWorks) {
  const values = {
    authors: new Set(),
    genres: new Set(),
    categories: new Set(),
    collections: new Set(),
    publishers: new Set(),
    editorialCollections: new Set(),
    editions: new Set(),
    locations: new Set(),
    languages: new Set(),
    conditions: new Set(),
    currencies: new Set(),
  };

  allWorks.forEach((work) => {
    addSuggestion(values.authors, work.author);
    addSuggestion(values.genres, work.genre);
    addSuggestion(values.categories, work.category);
    addSuggestion(values.collections, work.collectionName);
    work.copies?.forEach((copy) => {
      addSuggestion(values.publishers, copy.publisher);
      addSuggestion(values.editorialCollections, copy.editorialCollection);
      addSuggestion(values.editions, copy.edition);
      addSuggestion(values.locations, copy.location);
      addSuggestion(values.languages, copy.language);
      addSuggestion(values.conditions, copy.condition);
      addSuggestion(values.currencies, copy.currency);
    });
  });

  return Object.fromEntries(
    Object.entries(values).map(([key, set]) => [key, [...set].sort((a, b) => a.localeCompare(b))])
  );
}

function addSuggestion(set, value) {
  const normalized = value?.trim();
  if (normalized) {
    set.add(normalized);
  }
}
