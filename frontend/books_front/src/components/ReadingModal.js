import { readingStatusLabels } from '../constants/labels';

function ReadingModal({ modal, onChange, onClose, onSubmit, saving }) {
  const title = modal.mode === 'edit' ? 'Editar leitura' : 'Nova leitura';

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="reading-modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{modal.work.title}</p>
            <h2 id="reading-modal-title">{title}</h2>
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={onClose} type="button">
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>
              Status
              <select value={modal.form.status} onChange={(event) => onChange('status', event.target.value)}>
                {Object.entries(readingStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Nota
              <select value={modal.form.rating} onChange={(event) => onChange('rating', event.target.value)}>
                <option value="">Sem nota</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              Inicio
              <input type="date" value={modal.form.startedAt} onChange={(event) => onChange('startedAt', event.target.value)} />
            </label>
            <label>
              Fim
              <input type="date" value={modal.form.finishedAt} onChange={(event) => onChange('finishedAt', event.target.value)} />
            </label>
          </div>
          <div className="check-grid">
            <label className="check-row">
              <input
                type="checkbox"
                checked={modal.form.isFavorite}
                onChange={(event) => onChange('isFavorite', event.target.checked)}
              />
              Favorito
            </label>
            <label className="check-row">
              <input
                type="checkbox"
                checked={modal.form.wantToReRead}
                onChange={(event) => onChange('wantToReRead', event.target.checked)}
              />
              Quero reler
            </label>
          </div>
          <label>
            Resenha
            <textarea value={modal.form.review} onChange={(event) => onChange('review', event.target.value)} rows="4" />
          </label>
          <label>
            Notas
            <textarea value={modal.form.notes} onChange={(event) => onChange('notes', event.target.value)} rows="3" />
          </label>
          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Salvando...' : 'Salvar leitura'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default ReadingModal;
