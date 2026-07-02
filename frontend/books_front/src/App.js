import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5043';

const readingStatusLabels = {
  WantToRead: 'Quero ler',
  Reading: 'Lendo',
  Read: 'Lido',
  Abandoned: 'Abandonado',
  Paused: 'Pausado',
};

const copyFormatLabels = {
  Physical: 'Fisico',
  Ebook: 'Ebook',
  Audiobook: 'Audiobook',
};

const acquisitionTypeLabels = {
  Bought: 'Comprado',
  Gift: 'Presente',
  Inherited: 'Herdado',
  Download: 'Download',
  Unknown: 'Nao informado',
};

const sortOptions = {
  recent: 'Recentes',
  title: 'Titulo',
  author: 'Autor',
  year: 'Ano',
  genre: 'Genero',
  copies: 'Exemplares',
};

const emptyWorkModalForm = {
  title: '',
  author: '',
  originalTitle: '',
  originalYear: '',
  genre: '',
  description: '',
  coverUrl: '',
};

const emptyCopyForm = {
  format: 'Physical',
  publisher: '',
  edition: '',
  isbn: '',
  publishedYear: '',
  language: '',
  pageCount: '',
  condition: '',
  location: '',
  acquisitionDate: '',
  acquisitionType: 'Unknown',
  pricePaid: '',
  currency: 'BRL',
  isGift: false,
  isSigned: false,
  notes: '',
};

const emptyReadingForm = {
  status: 'Read',
  startedAt: '',
  finishedAt: '',
  rating: '',
  review: '',
  notes: '',
  isFavorite: false,
  wantToReRead: false,
};

function App() {
  const [catalog, setCatalog] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('recent');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [workModal, setWorkModal] = useState(null);
  const [readingModal, setReadingModal] = useState(null);
  const [copyModal, setCopyModal] = useState(null);
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  async function loadCatalog() {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog`);
      if (!response.ok) {
        throw new Error('Falha ao carregar catalogo.');
      }

      const data = await response.json();
      setCatalog(data);
      setSelectedWorkId((currentId) => currentId || data.readings?.[0]?.id || data.library?.[0]?.id || null);
      setNotice('');
    } catch (error) {
      setNotice('Nao foi possivel conectar a API. Inicie o backend em http://localhost:5043.');
    } finally {
      setIsLoading(false);
    }
  }

  const allWorks = useMemo(() => {
    if (!catalog) {
      return [];
    }

    const byId = new Map();
    [...(catalog.works || []), ...catalog.readings, ...catalog.library].forEach((work) => byId.set(work.id, work));
    return [...byId.values()];
  }, [catalog]);

  const filteredWorks = useMemo(() => {
    return allWorks
      .filter((work) => {
        const searchable = `${work.title} ${work.author} ${work.genre || ''}`.toLowerCase();
        const matchesQuery = searchable.includes(query.toLowerCase());
        const matchesScope =
          scopeFilter === 'all' ||
          (scopeFilter === 'read' && work.readings?.some((reading) => reading.status === 'Read')) ||
          (scopeFilter === 'library' && work.copies?.length > 0);

        return matchesQuery && matchesScope;
      })
      .sort((first, second) => compareWorks(first, second, sortMode));
  }, [allWorks, query, scopeFilter, sortMode]);

  const selectedWork = filteredWorks.find((work) => work.id === selectedWorkId) || filteredWorks[0] || null;
  const suggestions = useMemo(() => {
    const values = {
      authors: new Set(),
      genres: new Set(),
      publishers: new Set(),
      editions: new Set(),
      locations: new Set(),
      languages: new Set(),
      conditions: new Set(),
      currencies: new Set(),
    };

    allWorks.forEach((work) => {
      addSuggestion(values.authors, work.author);
      addSuggestion(values.genres, work.genre);
      work.copies?.forEach((copy) => {
        addSuggestion(values.publishers, copy.publisher);
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
  }, [allWorks]);


  async function updateReadingStatus(work, status) {
    const reading = work.reading || {};
    await saveReading(work.id, {
      status,
      rating: reading.rating,
      review: reading.review,
      notes: reading.notes,
      startedAt: reading.startedAt,
      finishedAt: reading.finishedAt,
      isFavorite: reading.isFavorite || false,
      wantToReRead: reading.wantToReRead || false,
    });
  }

  async function updateRating(work, rating) {
    const reading = work.reading || { status: 'WantToRead' };
    await saveReading(work.id, {
      ...reading,
      rating: toNumber(rating),
      isFavorite: reading.isFavorite || false,
      wantToReRead: reading.wantToReRead || false,
    });
  }

  async function saveReading(workId, reading) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/works/${workId}/reading`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading),
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar leitura.');
      }

      setNotice('Leitura atualizada.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui atualizar a leitura.');
    }
  }

  function openCreateWorkModal() {
    setWorkModal({
      mode: 'create',
      work: null,
      form: emptyWorkModalForm,
    });
  }

  function openEditWorkModal(work) {
    setWorkModal({
      mode: 'edit',
      work,
      form: workToForm(work),
    });
  }

  function closeWorkModal() {
    setWorkModal(null);
  }

  async function handleWorkSubmit(event) {
    event.preventDefault();
    if (!workModal) {
      return;
    }

    setIsSaving(true);
    const isEditing = workModal.mode === 'edit';
    const url = isEditing ? `${API_BASE_URL}/api/works/${workModal.work.id}` : `${API_BASE_URL}/api/works`;
    const payload = isEditing
      ? workFormToPayload(workModal.form)
      : {
          ...workFormToPayload(workModal.form),
          reading: null,
          copy: null,
        };

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar obra.');
      }

      const saved = await response.json();
      setSelectedWorkId(saved.id || workModal.work.id);
      setNotice(isEditing ? 'Obra atualizada.' : 'Obra adicionada ao catalogo.');
      closeWorkModal();
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui salvar a obra.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteWork(work) {
    const confirmed = window.confirm(`Remover "${work.title}" e todos os seus registros?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/works/${work.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover obra.');
      }

      setSelectedWorkId(null);
      setNotice('Obra removida.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui remover a obra.');
    }
  }

  function openCreateReadingModal(work) {
    setReadingModal({
      mode: 'create',
      work,
      reading: null,
      form: emptyReadingForm,
    });
  }

  function openEditReadingModal(work, reading) {
    setReadingModal({
      mode: 'edit',
      work,
      reading,
      form: readingToForm(reading),
    });
  }

  function closeReadingModal() {
    setReadingModal(null);
  }

  async function handleReadingSubmit(event) {
    event.preventDefault();
    if (!readingModal) {
      return;
    }

    setIsSaving(true);
    const isEditing = readingModal.mode === 'edit';
    const url = isEditing
      ? `${API_BASE_URL}/api/works/${readingModal.work.id}/readings/${readingModal.reading.id}`
      : `${API_BASE_URL}/api/works/${readingModal.work.id}/readings`;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(readingFormToPayload(readingModal.form)),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar leitura.');
      }

      setSelectedWorkId(readingModal.work.id);
      setScopeFilter('read');
      setNotice(isEditing ? 'Leitura atualizada.' : 'Leitura registrada.');
      closeReadingModal();
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui salvar a leitura.');
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteReading(work, reading) {
    const confirmed = window.confirm(`Remover esta leitura de "${work.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/works/${work.id}/readings/${reading.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover leitura.');
      }

      setSelectedWorkId(work.id);
      setNotice('Leitura removida.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui remover a leitura.');
    }
  }

  function openCreateCopyModal(work) {
    setCopyModal({
      mode: 'create',
      work,
      copy: null,
      form: emptyCopyForm,
    });
  }

  function openEditCopyModal(work, copy) {
    setCopyModal({
      mode: 'edit',
      work,
      copy,
      form: copyToForm(copy),
    });
  }

  function closeCopyModal() {
    setCopyModal(null);
  }

  async function handleCopySubmit(event) {
    event.preventDefault();
    if (!copyModal) {
      return;
    }

    setIsSaving(true);
    const payload = copyFormToPayload(copyModal.form);
    const isEditing = copyModal.mode === 'edit';
    const url = isEditing
      ? `${API_BASE_URL}/api/works/${copyModal.work.id}/copies/${copyModal.copy.id}`
      : `${API_BASE_URL}/api/works/${copyModal.work.id}/copies`;

    try {
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar exemplar.');
      }

      setSelectedWorkId(copyModal.work.id);
      setScopeFilter('library');
      setNotice(isEditing ? 'Exemplar atualizado.' : 'Exemplar adicionado a biblioteca.');
      closeCopyModal();
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui salvar o exemplar.');
    } finally {
      setIsSaving(false);
    }
  }


  async function downloadCopiesBackup() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/backups/copies.csv`);
      if (!response.ok) {
        throw new Error('Falha ao gerar backup.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mybooks-exemplares-backup.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setNotice('Backup dos exemplares gerado em CSV.');
    } catch (error) {
      setNotice('Nao consegui gerar o backup CSV dos exemplares.');
    }
  }

  async function deleteCopy(work, copy) {
    const confirmed = window.confirm(`Remover este exemplar de "${work.title}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/works/${work.id}/copies/${copy.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Falha ao remover exemplar.');
      }

      setSelectedWorkId(work.id);
      setNotice('Exemplar removido.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui remover o exemplar.');
    }
  }

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <p className="eyebrow">MyBooks</p>
          <h1>Catalogo pessoal</h1>
          <p className="intro">
            Separe obras que voce leu, quer ler ou esta lendo dos exemplares que realmente existem na sua biblioteca.
          </p>
        </div>
        <div className="header-actions">
          <button className="primary-button" onClick={openCreateWorkModal} type="button">
            Nova obra
          </button>
          <button className="ghost-button" onClick={downloadCopiesBackup} type="button">
            Backup CSV
          </button>
          <button className="ghost-button" onClick={loadCatalog} type="button">
            Atualizar
          </button>
        </div>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="metric-bar" aria-label="Resumo do catalogo">
        <MetricButton
          active={scopeFilter === 'all'}
          label="Obras"
          onClick={() => setScopeFilter('all')}
          value={catalog?.stats?.totalWorks || 0}
        />
        <MetricButton
          active={scopeFilter === 'read'}
          label="Lidas"
          onClick={() => setScopeFilter('read')}
          value={catalog?.stats?.readWorks || 0}
        />
        <MetricButton
          active={scopeFilter === 'library'}
          label="Na biblioteca"
          onClick={() => setScopeFilter('library')}
          value={catalog?.stats?.ownedCopies ?? catalog?.stats?.ownedWorks ?? 0}
        />
      </section>

      <section className="workspace">
        <section className="panel list-panel">
          <div className="toolbar">
            <label className="toolbar-control">
              Pesquisar
              <input
                className="search-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por titulo, autor ou genero"
              />
            </label>
            <label className="toolbar-control">
              Ordenar
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
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
          ) : filteredWorks.length === 0 ? (
            <div className="empty-state">Nenhum registro encontrado.</div>
          ) : (
            <div className="work-list">
              {filteredWorks.map((work) => (
                <button
                  className={`work-row ${selectedWork?.id === work.id ? 'selected' : ''}`}
                  key={work.id}
                  onClick={() => setSelectedWorkId(work.id)}
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
          )}
        </section>

        <section className="panel detail-panel">
          {selectedWork ? (
            <WorkDetail
              onCopyCreate={openCreateCopyModal}
              onCopyDelete={deleteCopy}
              onCopyEdit={openEditCopyModal}
              onReadingCreate={openCreateReadingModal}
              onReadingDelete={deleteReading}
              onReadingEdit={openEditReadingModal}
              onRatingChange={updateRating}
              onStatusChange={updateReadingStatus}
              onWorkDelete={deleteWork}
              onWorkEdit={openEditWorkModal}
              work={selectedWork}
            />
          ) : (
            <div className="empty-state">Selecione uma obra para ver os detalhes.</div>
          )}
        </section>
      </section>

      {workModal && (
        <WorkModal
          modal={workModal}
          suggestions={suggestions}
          onChange={(field, value) =>
            setWorkModal((current) => ({
              ...current,
              form: { ...current.form, [field]: value },
            }))
          }
          onClose={closeWorkModal}
          onSubmit={handleWorkSubmit}
          saving={isSaving}
        />
      )}

      {readingModal && (
        <ReadingModal
          modal={readingModal}
          onChange={(field, value) =>
            setReadingModal((current) => ({
              ...current,
              form: { ...current.form, [field]: value },
            }))
          }
          onClose={closeReadingModal}
          onSubmit={handleReadingSubmit}
          saving={isSaving}
        />
      )}

      {copyModal && (
        <CopyModal
          modal={copyModal}
          suggestions={suggestions}
          onChange={(field, value) =>
            setCopyModal((current) => ({
              ...current,
              form: { ...current.form, [field]: value },
            }))
          }
          onClose={closeCopyModal}
          onSubmit={handleCopySubmit}
          saving={isSaving}
        />
      )}
    </main>
  );
}

function WorkDetail({
  onCopyCreate,
  onCopyDelete,
  onCopyEdit,
  onReadingCreate,
  onReadingDelete,
  onReadingEdit,
  onRatingChange,
  onStatusChange,
  onWorkDelete,
  onWorkEdit,
  work,
}) {
  return (
    <>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">{work.genre || 'Sem genero'}</p>
          <h2>{work.title}</h2>
          <p>
            {work.author}
            {work.originalYear ? `, ${work.originalYear}` : ''}
          </p>
        </div>
        <div className="copy-actions">
          <button className="text-button" onClick={() => onWorkEdit(work)} type="button">
            Editar
          </button>
          <button className="danger-button" onClick={() => onWorkDelete(work)} type="button">
            Remover
          </button>
        </div>
      </div>

      {work.description && <p className="description">{work.description}</p>}

      <div className="detail-section">
        <div className="section-heading">
          <h3>Leituras</h3>
          <button className="text-button" onClick={() => onReadingCreate(work)} type="button">
            Nova leitura
          </button>
        </div>
        <div className="inline-controls">
          <label>
            Status
            <select value={work.reading?.status || 'WantToRead'} onChange={(event) => onStatusChange(work, event.target.value)}>
              {Object.entries(readingStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Nota
            <select value={work.reading?.rating || ''} onChange={(event) => onRatingChange(work, event.target.value)}>
              <option value="">Sem nota</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </label>
        </div>
        {work.reading?.review && <p>{work.reading.review}</p>}
        {work.reading?.notes && <p className="muted">{work.reading.notes}</p>}
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
                    <button className="danger-button" onClick={() => onReadingDelete(work, reading)} type="button">
                      Remover
                    </button>
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
          <h3>Biblioteca</h3>
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
            {work.copies.map((copy) => (
              <article className="copy-item" key={copy.id}>
                <div className="copy-item-header">
                  <div>
                    <strong>{copyFormatLabels[copy.format] || copy.format}</strong>
                    <span>{[copy.publisher, copy.edition].filter(Boolean).join(' · ') || 'Edicao nao informada'}</span>
                  </div>
                  <div className="copy-actions">
                    <button className="text-button" onClick={() => onCopyEdit(work, copy)} type="button">
                      Editar
                    </button>
                    <button className="danger-button" onClick={() => onCopyDelete(work, copy)} type="button">
                      Remover
                    </button>
                  </div>
                </div>
                <div className="copy-meta">
                  {copy.isbn && <span>ISBN {copy.isbn}</span>}
                  {copy.publishedYear && <span>{copy.publishedYear}</span>}
                  {copy.language && <span>{copy.language}</span>}
                  {copy.pageCount && <span>{copy.pageCount} paginas</span>}
                  {copy.condition && <span>{copy.condition}</span>}
                  {copy.location && <span>{copy.location}</span>}
                  {copy.isGift && <span>Presente</span>}
                  {copy.isSigned && <span>Autografado</span>}
                </div>
                {copy.notes && <p className="muted">{copy.notes}</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

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
              Edicao
              <input
                list="edition-suggestions"
                value={modal.form.edition}
                onChange={(event) => onChange('edition', event.target.value)}
                placeholder="Capa dura, bolso, comemorativa"
              />
              <SuggestionList id="edition-suggestions" options={suggestions.editions} />
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
                  Idioma
                  <input
                    list="language-suggestions"
                    value={modal.form.language}
                    onChange={(event) => onChange('language', event.target.value)}
                  />
                  <SuggestionList id="language-suggestions" options={suggestions.languages} />
                </label>
              </div>

              <div className="form-row">
                <label>
                  Paginas
                  <input
                    inputMode="numeric"
                    value={modal.form.pageCount}
                    onChange={(event) => onChange('pageCount', event.target.value)}
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


function SuggestionList({ id, options }) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option} value={option} />
      ))}
    </datalist>
  );
}

function MetricButton({ active, label, onClick, value }) {
  return (
    <button className={`metric-button ${active ? 'active' : ''}`} onClick={onClick} type="button">
      <strong>{value}</strong>
      <span>{label}</span>
    </button>
  );
}



function compareWorks(first, second, sortMode) {
  const byTitle = compareText(first.title, second.title);

  if (sortMode === 'title') {
    return byTitle;
  }

  if (sortMode === 'author') {
    return compareText(first.author, second.author) || byTitle;
  }

  if (sortMode === 'year') {
    return compareNumber(first.originalYear, second.originalYear) || byTitle;
  }

  if (sortMode === 'genre') {
    return compareText(first.genre, second.genre) || byTitle;
  }

  if (sortMode === 'copies') {
    return (second.copyCount || 0) - (first.copyCount || 0) || byTitle;
  }

  return compareDate(second.updatedAt, first.updatedAt) || byTitle;
}

function compareText(first, second) {
  return normalizeSortValue(first).localeCompare(normalizeSortValue(second));
}

function compareNumber(first, second) {
  if (first == null && second == null) {
    return 0;
  }

  if (first == null) {
    return 1;
  }

  if (second == null) {
    return -1;
  }

  return first - second;
}

function compareDate(first, second) {
  return new Date(first || 0).getTime() - new Date(second || 0).getTime();
}

function normalizeSortValue(value) {
  return (value || '').trim().toLocaleLowerCase('pt-BR');
}

function addSuggestion(set, value) {
  const normalized = value?.trim();
  if (normalized) {
    set.add(normalized);
  }
}

function workToForm(work) {
  return {
    title: work.title || '',
    author: work.author || '',
    originalTitle: work.originalTitle || '',
    originalYear: work.originalYear || '',
    genre: work.genre || '',
    description: work.description || '',
    coverUrl: work.coverUrl || '',
  };
}

function workFormToPayload(form) {
  return {
    title: form.title,
    author: form.author,
    originalTitle: emptyToNull(form.originalTitle),
    originalYear: toNumber(form.originalYear),
    genre: emptyToNull(form.genre),
    description: emptyToNull(form.description),
    coverUrl: emptyToNull(form.coverUrl),
  };
}

function readingToForm(reading) {
  return {
    status: reading.status || 'Read',
    startedAt: reading.startedAt || '',
    finishedAt: reading.finishedAt || '',
    rating: reading.rating || '',
    review: reading.review || '',
    notes: reading.notes || '',
    isFavorite: reading.isFavorite || false,
    wantToReRead: reading.wantToReRead || false,
  };
}

function readingFormToPayload(form) {
  return {
    status: form.status,
    startedAt: emptyToNull(form.startedAt),
    finishedAt: emptyToNull(form.finishedAt),
    rating: toNumber(form.rating),
    review: emptyToNull(form.review),
    notes: emptyToNull(form.notes),
    isFavorite: form.isFavorite,
    wantToReRead: form.wantToReRead,
  };
}

function copyToForm(copy) {
  return {
    format: copy.format || 'Physical',
    publisher: copy.publisher || '',
    edition: copy.edition || '',
    isbn: copy.isbn || '',
    publishedYear: copy.publishedYear || '',
    language: copy.language || '',
    pageCount: copy.pageCount || '',
    condition: copy.condition || '',
    location: copy.location || '',
    acquisitionDate: copy.acquisitionDate || '',
    acquisitionType: copy.acquisitionType || 'Unknown',
    pricePaid: copy.pricePaid || '',
    currency: copy.currency || 'BRL',
    isGift: copy.isGift || false,
    isSigned: copy.isSigned || false,
    notes: copy.notes || '',
  };
}

function copyFormToPayload(form) {
  return {
    format: form.format,
    publisher: emptyToNull(form.publisher),
    edition: emptyToNull(form.edition),
    isbn: emptyToNull(form.isbn),
    publishedYear: toNumber(form.publishedYear),
    language: emptyToNull(form.language),
    pageCount: toNumber(form.pageCount),
    condition: emptyToNull(form.condition),
    location: emptyToNull(form.location),
    acquisitionDate: emptyToNull(form.acquisitionDate),
    acquisitionType: form.acquisitionType,
    pricePaid: toNumber(String(form.pricePaid).replace(',', '.')),
    currency: emptyToNull(form.currency) || 'BRL',
    isGift: form.isGift,
    isSigned: form.isSigned,
    notes: emptyToNull(form.notes),
  };
}

function emptyToNull(value) {
  return value === '' || value === null || value === undefined ? null : value;
}

function formatDate(value) {
  if (!value) {
    return '';
  }

  return value.split('-').reverse().join('/');
}

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default App;
