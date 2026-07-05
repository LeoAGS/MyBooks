import { useEffect, useState } from 'react';
import { readingStatusLabels, sortOptions } from '../constants/labels';
import BookCover from './BookCover';
import { groupWorks } from '../utils/groupWorks';

function WorkList({
  groupMode,
  isLoading,
  onQueryChange,
  onSelectWork,
  onSortModeChange,
  query,
  scopeFilter,
  selectedWork,
  sortMode,
  works,
}) {
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());
  const groupedWorks = groupWorks(works, groupMode, scopeFilter);

  useEffect(() => {
    setCollapsedGroups(new Set());
  }, [groupMode, scopeFilter, works]);

  function toggleGroup(groupKey) {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  return (
    <section className="panel list-panel">
      <div className="toolbar">
        <label className="toolbar-control">
          Pesquisar
          <input
            className="search-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={scopeFilter === 'library' ? 'Buscar por exemplar, obra, autor, editora ou ISBN' : 'Buscar por titulo, autor, genero ou categoria'}
          />
        </label>
        <label className="toolbar-control">
          Ordenar
          <select value={sortMode} onChange={(event) => onSortModeChange(event.target.value)}>
            {Object.entries(sortOptions).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="empty-state">Carregando catalogo...</div>
      ) : works.length === 0 ? (
        <div className="empty-state">Nenhum registro encontrado.</div>
      ) : (
        <div className="work-list">
          {groupedWorks.map((group) => (
            <div className={`work-group work-group-${groupMode}`} key={group.key}>
              {groupMode !== 'all' && (
                <button
                  className="work-group-heading"
                  onClick={() => toggleGroup(group.key)}
                  type="button"
                  aria-expanded={!collapsedGroups.has(group.key)}
                >
                  <span className="group-heading-main">
                    <span className="group-toggle-arrow" aria-hidden="true">
                      {collapsedGroups.has(group.key) ? '>' : 'v'}
                    </span>
                    <span>{group.label}</span>
                  </span>
                  <small>{group.works.length}</small>
                </button>
              )}
              {!collapsedGroups.has(group.key) &&
                group.works.map((work) => (
                  <button
                    className={`work-row ${selectedWork?.id === work.id ? 'selected' : ''}`}
                    key={work.id}
                    onClick={() => onSelectWork(work)}
                    type="button"
                  >
                    <BookCover author={work.author} className="book-cover-small" title={work.title} url={work.coverUrl} />
                    <span className="work-row-main">
                      <strong>{work.displayTitle || work.title}</strong>
                      <small>{work.subtitle || work.author}</small>
                      <span className="row-tags">
                        {getRowMeta(work, scopeFilter).map((meta) => (
                          <span className="row-meta" key={meta}>
                            {meta}
                          </span>
                        ))}
                      </span>
                    </span>
                  </button>
                ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}


function getRowMeta(work, scopeFilter) {
  if (scopeFilter === 'library' && work.rowMeta?.length) {
    return work.rowMeta;
  }

  return [
    readingStatusLabels[work.reading?.status] || 'Sem leitura',
    `${work.copyCount} exemplar${work.copyCount === 1 ? '' : 'es'}`,
  ];
}

export default WorkList;
