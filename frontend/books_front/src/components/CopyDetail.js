import { acquisitionTypeLabels, copyFormatLabels } from '../constants/labels';
import { formatDate } from '../utils/format';
import BookCover from './BookCover';

function CopyDetail({ copyItem, onCopyDelete, onCopyEdit, work }) {
  if (!copyItem || !copyItem.copy || !work) {
    return <div className="empty-state">Selecione um exemplar para ver os detalhes.</div>;
  }

  const copy = copyItem.copy;
  const title = copy.copyTitle || copy.primaryWorkTitle || work.title;
  const containedWorks = copy.containedWorks?.length ? copy.containedWorks : [{ id: work.id, title: work.title, author: work.author }];
  const volumeCount = Math.max(1, copy.volumeCount || 1);
  const copyChips = [
    copyFormatLabels[copy.format] || copy.format,
    `${volumeCount} volume${volumeCount === 1 ? '' : 's'}`,
    copy.language,
    copy.location,
    copy.condition,
  ].filter(Boolean);
  const copyFacts = [
    ['Formato', copyFormatLabels[copy.format] || copy.format],
    ['Volumes', `${volumeCount} volume${volumeCount === 1 ? '' : 's'}`],
    ['Editora', copy.publisher],
    ['Colecao editorial', copy.editorialCollection],
    ['Edicao', copy.edition],
    ['ISBN', copy.isbn],
    ['Ano', copy.publishedYear],
    ['Idioma', copy.language],
    ['Paginas', copy.pageCount],
    ['Estado', copy.condition],
    ['Localizacao', copy.location],
    ['Aquisicao', copy.acquisitionDate ? formatDate(copy.acquisitionDate) : null],
    ['Origem', copy.acquisitionType ? acquisitionTypeLabels[copy.acquisitionType] || copy.acquisitionType : null],
    ['Valor', copy.pricePaid != null ? `${copy.currency} ${copy.pricePaid}` : null],
    ['Presente', copy.isGift ? 'Sim' : null],
    ['Autografado', copy.isSigned ? 'Sim' : null],
  ].filter(([, value]) => value !== null && value !== undefined && value !== '');

  return (
    <>
      <div className="detail-heading">
        <div className="detail-title-group">
          <BookCover author={work.author} className="book-cover-large" title={title} url={work.coverUrl} />
          <div>
            <p className="eyebrow">Exemplar fisico</p>
            <h2>{title}</h2>
            <p>{copy.copyTitle ? work.title : work.author}</p>
          </div>
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

      {copyChips.length > 0 && (
        <div className="copy-meta work-meta detail-chip-row">
          {copyChips.map((chip) => (
            <span key={chip}>{chip}</span>
          ))}
        </div>
      )}

      {copy.notes && <p className="description">{copy.notes}</p>}

      <div className="detail-section">
        <div className="section-heading">
          <div>
            <h3>Dados do exemplar</h3>
            <p className="section-summary">Livro, edicao e localizacao fisica</p>
          </div>
        </div>
        {copyFacts.length === 0 ? (
          <p className="muted">Nenhum dado preenchido para este exemplar.</p>
        ) : (
          <dl className="copy-facts">
            {copyFacts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {containedWorks.length > 1 && (
        <div className="detail-section">
          <div className="section-heading">
            <div>
              <h3>Obras contidas</h3>
              <p className="section-summary">{containedWorks.length} obras referenciadas por este exemplar</p>
            </div>
          </div>
          <div className="contained-work-list">
            {containedWorks.map((containedWork) => (
              <article className="contained-work-card" key={containedWork.id}>
                <strong>{containedWork.title}</strong>
                <span>{containedWork.author}</span>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default CopyDetail;
