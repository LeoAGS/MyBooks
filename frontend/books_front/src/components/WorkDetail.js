import { copyFormatLabels, readingStatusLabels } from '../constants/labels';
import { formatDate } from '../utils/format';
import BookCover from './BookCover';

function WorkDetail({
  onCopyCreate,
  onCopyDelete,
  onCopyEdit,
  onReadingCreate,
  onReadingDelete,
  onReadingEdit,
  onWorkDelete,
  onWorkEdit,
  selectedCopyId,
  work,
}) {
  if (!work) {
    return <div className="empty-state">Selecione uma obra para ver os detalhes.</div>;
  }

  const copyTotal = work.copies.length;
  const volumeTotal = work.copies.reduce((total, copy) => total + Math.max(1, copy.volumeCount || 1), 0);
  const workChips = [
    work.category,
    work.genre,
    [work.collectionName, work.collectionNumber].filter(Boolean).join(' #'),
  ].filter(Boolean);
  const displayedCopies = [...work.copies].sort((first, second) => {
    if (first.id === selectedCopyId) {
      return -1;
    }
    if (second.id === selectedCopyId) {
      return 1;
    }
    return (first.copyTitle || '').localeCompare(second.copyTitle || '') || first.id.localeCompare(second.id);
  });

  return (
    <>
      <div className="detail-heading">
        <div className="detail-title-group">
          <BookCover author={work.author} className="book-cover-large" title={work.title} url={work.coverUrl} />
          <div>
            <p className="eyebrow">{work.genre || 'Sem genero'}</p>
            <h2>{work.title}</h2>
            <p>
              {work.author}
              {work.originalYear ? `, ${work.originalYear}` : ''}
            </p>
          </div>
        </div>
        <div className="copy-actions">
          <button className="text-button" onClick={() => onWorkEdit(work)} type="button">
            Editar
          </button>
          <details className="action-menu">
            <summary aria-label="Mais acoes da obra" title="Mais acoes">...</summary>
            <div className="action-menu-popover">
              <button className="action-menu-danger" onClick={() => onWorkDelete(work)} type="button">
                Excluir
              </button>
            </div>
          </details>
        </div>
      </div>

      {workChips.length > 0 && (
        <div className="copy-meta work-meta detail-chip-row">
          {workChips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      )}

      {work.description && <p className="description">{work.description}</p>}

      <div className="detail-section">
        <div className="section-heading">
          <h3>Leituras</h3>
          <button className="text-button" onClick={() => onReadingCreate(work)} type="button">
            Nova leitura
          </button>
        </div>
        {work.readings.length === 0 ? (
          <div className="empty-card">
            <p>Nenhuma leitura registrada para esta obra.</p>
            <button className="ghost-button" onClick={() => onReadingCreate(work)} type="button">
              Registrar leitura
            </button>
          </div>
        ) : (
          <div className="reading-list">
            {work.readings.map((reading) => (
              <article className="reading-item" key={reading.id}>
                <div className="copy-item-header">
                  <div>
                    <strong>{readingStatusLabels[reading.status] || reading.status}</strong>
                    <span>
                      {[formatDate(reading.startedAt), formatDate(reading.finishedAt)].filter(Boolean).join(' - ') ||
                        'Sem datas'}
                    </span>
                  </div>
                  <div className="copy-actions">
                    <button className="text-button" onClick={() => onReadingEdit(work, reading)} type="button">
                      Editar
                    </button>
                    <details className="action-menu">
                      <summary aria-label="Mais acoes da leitura" title="Mais acoes">...</summary>
                      <div className="action-menu-popover">
                        <button className="action-menu-danger" onClick={() => onReadingDelete(work, reading)} type="button">
                          Excluir
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="copy-meta">
                  {reading.rating && <span>{reading.rating} estrelas</span>}
                  {reading.isFavorite && <span>Favorito</span>}
                  {reading.wantToReRead && <span>Quero reler</span>}
                </div>
                {reading.review && <p>{reading.review}</p>}
                {reading.notes && <p className="muted">{reading.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <div className="section-heading">
          <div>
            <h3>Biblioteca</h3>
            {copyTotal > 0 && (
              <p className="section-summary">
                {copyTotal} exemplar{copyTotal === 1 ? '' : 'es'} · {volumeTotal} volume{volumeTotal === 1 ? '' : 's'}
              </p>
            )}
          </div>
          <button className="text-button" onClick={() => onCopyCreate(work)} type="button">
            Novo exemplar
          </button>
        </div>
        {work.copies.length === 0 ? (
          <div className="empty-card">
            <p>Nenhum exemplar cadastrado para esta obra.</p>
            <button className="ghost-button" onClick={() => onCopyCreate(work)} type="button">
              Adicionar exemplar
            </button>
          </div>
        ) : (
          <div className="copy-list">
            {displayedCopies.map((copy) => (
              <article className={`copy-item ${copy.id === selectedCopyId ? 'selected-copy-item' : ''}`} key={copy.id}>
                <div className="copy-item-header">
                  <div>
                    <strong>{copy.copyTitle || copyFormatLabels[copy.format] || copy.format}</strong>
                    <span>
                      {[copy.publisher, copy.editorialCollection, copy.edition].filter(Boolean).join(' · ') ||
                        (copy.copyTitle ? copyFormatLabels[copy.format] || copy.format : 'Edicao nao informada')}
                    </span>
                  </div>
                  <div className="copy-actions">
                    <button className="text-button" onClick={() => onCopyEdit(work, copy)} type="button">
                      Editar
                    </button>
                    <details className="action-menu">
                      <summary aria-label="Mais acoes do exemplar" title="Mais acoes">...</summary>
                      <div className="action-menu-popover">
                        <button className="action-menu-danger" onClick={() => onCopyDelete(work, copy)} type="button">
                          Excluir
                        </button>
                      </div>
                    </details>
                  </div>
                </div>
                <div className="copy-meta">
                  {copy.isbn && <span>ISBN {copy.isbn}</span>}
                  {copy.publishedYear && <span>{copy.publishedYear}</span>}
                  {copy.language && <span>{copy.language}</span>}
                  {copy.pageCount && <span>{copy.pageCount} paginas</span>}
                  {copy.volumeCount > 1 && <span>{copy.volumeCount} volumes</span>}
                  {copy.condition && <span>{copy.condition}</span>}
                  {copy.location && <span>{copy.location}</span>}
                  {copy.isGift && <span>Presente</span>}
                  {copy.isSigned && <span>Autografado</span>}
                  {copy.containedWorks?.length > 1 && <span>Contem {copy.containedWorks.length} obras</span>}
                </div>
                {copy.containedWorks?.length > 1 && (
                  <div className="contained-copy-works">
                    <strong>Obras contidas</strong>
                    <span>{copy.containedWorks.map((containedWork) => containedWork.title).join(' · ')}</span>
                  </div>
                )}
                {copy.notes && <p className="muted">{copy.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default WorkDetail;
