import { readingStatusLabels, sortOptions } from '../constants/labels';
import { groupWorks } from '../utils/groupWorks';

function WorkList({
  groupMode,
  isLoading,
  onQueryChange,
  onSelectWork,
  onSortModeChange,
  query,
  selectedWork,
  sortMode,
  works,
}) {
  const groupedWorks = groupWorks(works, groupMode);

  return (
    <section className="panel list-panel">
      <div className="toolbar">
        <label className="toolbar-control">
          Pesquisar
          <input
            className="search-input"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar por titulo, autor, genero ou categoria"
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
            <div className="work-group" key={group.key}>
              {groupMode !== 'all' && (
                <div className="work-group-heading">
                  <span>{group.label}</span>
                  <small>{group.works.length}</small>
                </div>
              )}
              {group.works.map((work) => (
                <button
                  className={`work-row ${selectedWork?.id === work.id ? 'selected' : ''}`}
                  key={work.id}
                  onClick={() => onSelectWork(work.id)}
                  type="button"
                >
                  <span>
                    <strong>{work.title}</strong>
                    <small>{work.author}</small>
                  </span>
                  <span className="row-tags">
                    <span className="row-meta">{readingStatusLabels[work.reading?.status] || 'Sem leitura'}</span>
                    <span className="row-meta">
                      {work.copyCount} exemplar{work.copyCount === 1 ? '' : 'es'}
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

export default WorkList;
