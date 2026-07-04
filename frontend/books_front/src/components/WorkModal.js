import SuggestionList from './SuggestionList';

function WorkModal({ modal, onChange, onClose, onSubmit, saving, suggestions }) {
  const title = modal.mode === 'edit' ? 'Editar obra' : 'Nova obra';

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="work-modal-title">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Obra</p>
            <h2 id="work-modal-title">{title}</h2>
          </div>
          <button className="icon-button" aria-label="Fechar" onClick={onClose} type="button">
            x
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <label>
            Titulo
            <input required value={modal.form.title} onChange={(event) => onChange('title', event.target.value)} />
          </label>
          <label>
            Autor
            <input
              list="author-suggestions"
              required
              value={modal.form.author}
              onChange={(event) => onChange('author', event.target.value)}
            />
            <SuggestionList id="author-suggestions" options={suggestions.authors} />
          </label>
          <label>
            Titulo original
            <input value={modal.form.originalTitle} onChange={(event) => onChange('originalTitle', event.target.value)} />
          </label>
          <div className="form-row">
            <label>
              Ano original
              <input
                inputMode="numeric"
                value={modal.form.originalYear}
                onChange={(event) => onChange('originalYear', event.target.value)}
              />
            </label>
            <label>
              Genero
              <input
                list="genre-suggestions"
                value={modal.form.genre}
                onChange={(event) => onChange('genre', event.target.value)}
              />
              <SuggestionList id="genre-suggestions" options={suggestions.genres} />
            </label>
          </div>
          <div className="form-row">
            <label>
              Categoria
              <input
                list="category-suggestions"
                value={modal.form.category}
                onChange={(event) => onChange('category', event.target.value)}
                placeholder="Historia do Brasil, Literatura Francesa..."
              />
              <SuggestionList id="category-suggestions" options={suggestions.categories} />
            </label>
            <label>
              Colecao / serie
              <input
                list="collection-suggestions"
                value={modal.form.collectionName}
                onChange={(event) => onChange('collectionName', event.target.value)}
                placeholder="Ciclo dos Mosqueteiros"
              />
              <SuggestionList id="collection-suggestions" options={suggestions.collections} />
            </label>
          </div>
          <label>
            Numero na colecao
            <input
              value={modal.form.collectionNumber}
              onChange={(event) => onChange('collectionNumber', event.target.value)}
              placeholder="3, 3A, preludio..."
            />
          </label>
          <label>
            URL da capa
            <input value={modal.form.coverUrl} onChange={(event) => onChange('coverUrl', event.target.value)} />
          </label>
          <label>
            Descricao
            <textarea value={modal.form.description} onChange={(event) => onChange('description', event.target.value)} rows="4" />
          </label>
          <div className="modal-actions">
            <button className="ghost-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button" disabled={saving} type="submit">
              {saving ? 'Salvando...' : modal.mode === 'edit' ? 'Salvar obra' : 'Criar obra'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default WorkModal;
