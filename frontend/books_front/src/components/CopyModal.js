import { acquisitionTypeLabels, copyFormatLabels } from '../constants/labels';
import SuggestionList from './SuggestionList';

function CopyModal({ modal, onChange, onClose, onSubmit, saving, suggestions }) {
  const title = modal.mode === 'edit' ? 'Editar exemplar' : 'Novo exemplar';

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="copy-modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{modal.work.title}</p>
            <h2 id="copy-modal-title">{title}</h2>
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={onClose} type="button">
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <label>
              Formato
              <select value={modal.form.format} onChange={(event) => onChange('format', event.target.value)}>
                {Object.entries(copyFormatLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Localizacao
              <input
                list="location-suggestions"
                value={modal.form.location}
                onChange={(event) => onChange('location', event.target.value)}
                placeholder="Estante sala / Prateleira 2"
              />
              <SuggestionList id="location-suggestions" options={suggestions.locations} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Editora
              <input
                list="publisher-suggestions"
                value={modal.form.publisher}
                onChange={(event) => onChange('publisher', event.target.value)}
              />
              <SuggestionList id="publisher-suggestions" options={suggestions.publishers} />
            </label>
            <label>
              Colecao editorial
              <input
                list="editorial-collection-suggestions"
                value={modal.form.editorialCollection}
                onChange={(event) => onChange('editorialCollection', event.target.value)}
                placeholder="Penguin Classics, Classicos Zahar"
              />
              <SuggestionList id="editorial-collection-suggestions" options={suggestions.editorialCollections} />
            </label>
          </div>

          <div className="form-row">
            <label>
              Edicao
              <input
                list="edition-suggestions"
                value={modal.form.edition}
                onChange={(event) => onChange('edition', event.target.value)}
                placeholder="Capa dura, bolso, comemorativa"
              />
              <SuggestionList id="edition-suggestions" options={suggestions.editions} />
            </label>
            <label>
              Idioma(s)
              <input
                list="language-suggestions"
                value={modal.form.language}
                onChange={(event) => onChange('language', event.target.value)}
                placeholder="Portugues, Frances"
              />
              <SuggestionList id="language-suggestions" options={suggestions.languages} />
            </label>
          </div>

          <div className="form-row">
            <label>
              ISBN
              <input value={modal.form.isbn} onChange={(event) => onChange('isbn', event.target.value)} />
            </label>
            <label>
              Estado
              <input
                list="condition-suggestions"
                value={modal.form.condition}
                onChange={(event) => onChange('condition', event.target.value)}
                placeholder="Novo, bom, gasto"
              />
              <SuggestionList id="condition-suggestions" options={suggestions.conditions} />
            </label>
          </div>

          <details className="extra-fields">
            <summary>Detalhes adicionais</summary>
            <div className="extra-fields-grid">
              <div className="form-row">
                <label>
                  Ano da edicao
                  <input
                    inputMode="numeric"
                    value={modal.form.publishedYear}
                    onChange={(event) => onChange('publishedYear', event.target.value)}
                  />
                </label>
                <label>
                  Paginas
                  <input
                    inputMode="numeric"
                    value={modal.form.pageCount}
                    onChange={(event) => onChange('pageCount', event.target.value)}
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Volumes
                  <input
                    inputMode="numeric"
                    min="1"
                    value={modal.form.volumeCount}
                    onChange={(event) => onChange('volumeCount', event.target.value)}
                  />
                </label>
                <label>
                  Tipo de aquisicao
                  <select value={modal.form.acquisitionType} onChange={(event) => onChange('acquisitionType', event.target.value)}>
                    {Object.entries(acquisitionTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label>
                  Data de aquisicao
                  <input
                    type="date"
                    value={modal.form.acquisitionDate}
                    onChange={(event) => onChange('acquisitionDate', event.target.value)}
                  />
                </label>
                <label>
                  Preco pago
                  <input
                    inputMode="decimal"
                    value={modal.form.pricePaid}
                    onChange={(event) => onChange('pricePaid', event.target.value)}
                    placeholder="49.90"
                  />
                </label>
              </div>

              <label>
                Moeda
                <input
                  list="currency-suggestions"
                  value={modal.form.currency}
                  onChange={(event) => onChange('currency', event.target.value)}
                />
                <SuggestionList id="currency-suggestions" options={suggestions.currencies} />
              </label>

              <div className="check-grid">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={modal.form.isGift}
                    onChange={(event) => onChange('isGift', event.target.checked)}
                  />
                  Foi presente
                </label>
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={modal.form.isSigned}
                    onChange={(event) => onChange('isSigned', event.target.checked)}
                  />
                  Autografado
                </label>
              </div>

              <label>
                Observacoes
                <textarea value={modal.form.notes} onChange={(event) => onChange('notes', event.target.value)} rows="3" />
              </label>
            </div>
          </details>

          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Salvando...' : 'Salvar exemplar'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default CopyModal;
