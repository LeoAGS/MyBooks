export function buildLibraryItems(works) {
  const worksById = new Map(works.map((work) => [work.id, work]));
  const copiesById = new Map();

  works.forEach((work) => {
    (work.copies || []).forEach((copy) => {
      if (!copiesById.has(copy.id)) {
        copiesById.set(copy.id, { copy, fallbackWork: work });
      }
    });
  });

  return [...copiesById.values()].map(({ copy, fallbackWork }) => {
    const primaryWork = worksById.get(copy.primaryWorkId) || fallbackWork;
    const containedTitles = (copy.containedWorks || []).map((containedWork) => containedWork.title).filter(Boolean);
    const title = copy.copyTitle || copy.primaryWorkTitle || primaryWork.title;
    const publisherLine = [copy.publisher, copy.editorialCollection, copy.edition].filter(Boolean).join(' · ');
    const volumeCount = Math.max(1, copy.volumeCount || 1);
    const coverUrl = copy.coverUrl || primaryWork.coverUrl;

    return {
      ...primaryWork,
      id: copy.id,
      workId: primaryWork.id,
      copyId: copy.id,
      itemType: 'copy',
      title,
      displayTitle: title,
      workTitle: primaryWork.title,
      subtitle: copy.copyTitle ? primaryWork.title : primaryWork.author,
      author: primaryWork.author,
      coverUrl,
      copy,
      copies: [copy],
      copyCount: 1,
      volumeCount,
      publisher: copy.publisher,
      editorialCollection: copy.editorialCollection,
      location: copy.location,
      condition: copy.condition,
      originalYear: copy.publishedYear || primaryWork.originalYear,
      updatedAt: copy.updatedAt || primaryWork.updatedAt,
      rowMeta: [
        `${volumeCount} volume${volumeCount === 1 ? '' : 's'}`,
        containedTitles.length > 1 ? `${containedTitles.length} obras` : null,
        publisherLine || null,
      ].filter(Boolean),
      searchable: `${title} ${primaryWork.title} ${primaryWork.author} ${primaryWork.genre || ''} ${primaryWork.category || ''} ${copy.publisher || ''} ${copy.editorialCollection || ''} ${copy.edition || ''} ${copy.isbn || ''} ${copy.language || ''} ${copy.location || ''} ${copy.coverUrl || ''} ${containedTitles.join(' ')}`.toLowerCase(),
    };
  });
}
