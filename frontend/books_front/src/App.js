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

const emptyWorkForm = {
  title: '',
  author: '',
  originalYear: '',
  genre: '',
  description: '',
  addReading: true,
  readingStatus: 'WantToRead',
  rating: '',
  notes: '',
  addCopy: false,
  format: 'Physical',
  publisher: '',
  edition: '',
  isbn: '',
  location: '',
  condition: '',
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

function App() {
  const [catalog, setCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState('readings');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [workForm, setWorkForm] = useState(emptyWorkForm);
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
    [...catalog.readings, ...catalog.library].forEach((work) => byId.set(work.id, work));
    return [...byId.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [catalog]);

  const currentList = activeTab === 'readings' ? catalog?.readings || [] : catalog?.library || [];

  const filteredWorks = useMemo(() => {
    return currentList.filter((work) => {
      const searchable = `${work.title} ${work.author} ${work.genre || ''}`.toLowerCase();
      const matchesQuery = searchable.includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || work.reading?.status === statusFilter;
      return matchesQuery && (activeTab === 'library' || matchesStatus);
    });
  }, [activeTab, currentList, query, statusFilter]);

  const selectedWork = allWorks.find((work) => work.id === selectedWorkId) || filteredWorks[0] || allWorks[0];

  async function handleCreateWork(event) {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      title: workForm.title,
      author: workForm.author,
      originalYear: toNumber(workForm.originalYear),
      genre: workForm.genre || null,
      description: workForm.description || null,
      reading: workForm.addReading
        ? {
            status: workForm.readingStatus,
            rating: toNumber(workForm.rating),
            notes: workForm.notes || null,
            isFavorite: false,
            wantToReRead: false,
          }
        : null,
      copy: workForm.addCopy
        ? {
            format: workForm.format,
            publisher: workForm.publisher || null,
            edition: workForm.edition || null,
            isbn: workForm.isbn || null,
            location: workForm.location || null,
            condition: workForm.condition || null,
            acquisitionType: 'Unknown',
            currency: 'BRL',
            isGift: false,
            isSigned: false,
          }
        : null,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Falha ao salvar obra.');
      }

      const created = await response.json();
      setWorkForm(emptyWorkForm);
      setSelectedWorkId(created.id);
      setNotice('Obra adicionada ao catalogo.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui salvar. Verifique se o backend esta rodando.');
    } finally {
      setIsSaving(false);
    }
  }

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
      setActiveTab('library');
      setNotice(isEditing ? 'Exemplar atualizado.' : 'Exemplar adicionado a biblioteca.');
      closeCopyModal();
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui salvar o exemplar.');
    } finally {
      setIsSaving(false);
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
          <button className="ghost-button" onClick={loadCatalog} type="button">
            Atualizar
          </button>
        </div>
      </section>

      {notice && <div className="notice">{notice}</div>}

      <section className="stats-grid" aria-label="Resumo do catalogo">
        <StatCard label="Obras" value={catalog?.stats?.totalWorks || 0} />
        <StatCard label="Lidas" value={catalog?.stats?.readWorks || 0} />
        <StatCard label="Na biblioteca" value={catalog?.stats?.ownedWorks || 0} />
        <StatCard label="Lendo agora" value={catalog?.stats?.readingNow || 0} />
      </section>

      <section className="workspace">
        <aside className="panel form-panel">
          <h2>Nova obra</h2>
          <form onSubmit={handleCreateWork}>
            <label>
              Titulo
              <input
                required
                value={workForm.title}
                onChange={(event) => setFormValue(setWorkForm, 'title', event.target.value)}
                placeholder="Ex: Grande Sertao: Veredas"
              />
            </label>
            <label>
              Autor
              <input
                required
                value={workForm.author}
                onChange={(event) => setFormValue(setWorkForm, 'author', event.target.value)}
                placeholder="Ex: Guimaraes Rosa"
              />
            </label>
            <div className="form-row">
              <label>
                Ano original
                <input
                  inputMode="numeric"
                  value={workForm.originalYear}
                  onChange={(event) => setFormValue(setWorkForm, 'originalYear', event.target.value)}
                />
              </label>
              <label>
                Genero
                <input value={workForm.genre} onChange={(event) => setFormValue(setWorkForm, 'genre', event.target.value)} />
              </label>
            </div>
            <label>
              Observacao
              <textarea
                value={workForm.description}
                onChange={(event) => setFormValue(setWorkForm, 'description', event.target.value)}
                rows="3"
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={workForm.addReading}
                onChange={(event) => setFormValue(setWorkForm, 'addReading', event.target.checked)}
              />
              Registrar em leituras
            </label>
            {workForm.addReading && (
              <div className="nested-fields">
                <label>
                  Status
                  <select
                    value={workForm.readingStatus}
                    onChange={(event) => setFormValue(setWorkForm, 'readingStatus', event.target.value)}
                  >
                    {Object.entries(readingStatusLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Nota
                  <input
                    inputMode="numeric"
                    max="5"
                    min="1"
                    value={workForm.rating}
                    onChange={(event) => setFormValue(setWorkForm, 'rating', event.target.value)}
                    placeholder="1 a 5"
                  />
                </label>
                <label>
                  Notas pessoais
                  <textarea
                    value={workForm.notes}
                    onChange={(event) => setFormValue(setWorkForm, 'notes', event.target.value)}
                    rows="2"
                  />
                </label>
              </div>
            )}

            <label className="check-row">
              <input
                type="checkbox"
                checked={workForm.addCopy}
                onChange={(event) => setFormValue(setWorkForm, 'addCopy', event.target.checked)}
              />
              Tambem possuo um exemplar
            </label>
            {workForm.addCopy && (
              <div className="nested-fields">
                <div className="form-row">
                  <label>
                    Formato
                    <select
                      value={workForm.format}
                      onChange={(event) => setFormValue(setWorkForm, 'format', event.target.value)}
                    >
                      {Object.entries(copyFormatLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Localizacao
                    <input value={workForm.location} onChange={(event) => setFormValue(setWorkForm, 'location', event.target.value)} />
                  </label>
                </div>
                <label>
                  Editora
                  <input value={workForm.publisher} onChange={(event) => setFormValue(setWorkForm, 'publisher', event.target.value)} />
                </label>
                <label>
                  Edicao
                  <input value={workForm.edition} onChange={(event) => setFormValue(setWorkForm, 'edition', event.target.value)} />
                </label>
              </div>
            )}

            <button className="primary-button" disabled={isSaving} type="submit">
              {isSaving ? 'Salvando...' : 'Adicionar'}
            </button>
          </form>
        </aside>

        <section className="panel list-panel">
          <div className="toolbar">
            <div className="tabs" role="tablist" aria-label="Areas do catalogo">
              <button
                className={activeTab === 'readings' ? 'active' : ''}
                onClick={() => setActiveTab('readings')}
                type="button"
              >
                Leituras
              </button>
              <button
                className={activeTab === 'library' ? 'active' : ''}
                onClick={() => setActiveTab('library')}
                type="button"
              >
                Biblioteca
              </button>
            </div>
            <input
              className="search-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por titulo, autor ou genero"
            />
            {activeTab === 'readings' && (
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="All">Todos</option>
                {Object.entries(readingStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            )}
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
                  <span className="row-meta">
                    {activeTab === 'library'
                      ? `${work.copyCount} exemplar${work.copyCount === 1 ? '' : 'es'}`
                      : readingStatusLabels[work.reading?.status] || 'Sem leitura'}
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
              onRatingChange={updateRating}
              onStatusChange={updateReadingStatus}
              work={selectedWork}
            />
          ) : (
            <div className="empty-state">Selecione uma obra para ver os detalhes.</div>
          )}
        </section>
      </section>

      {copyModal && (
        <CopyModal
          modal={copyModal}
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

function WorkDetail({ onCopyCreate, onCopyDelete, onCopyEdit, onRatingChange, onStatusChange, work }) {
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
        <button className="ghost-button" onClick={() => onCopyCreate(work)} type="button">
          Adicionar exemplar
        </button>
      </div>

      {work.description && <p className="description">{work.description}</p>}

      <div className="detail-section">
        <h3>Leitura</h3>
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

function CopyModal({ modal, onChange, onClose, onSubmit, saving }) {
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
                value={modal.form.location}
                onChange={(event) => onChange('location', event.target.value)}
                placeholder="Estante sala / Prateleira 2"
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Editora
              <input value={modal.form.publisher} onChange={(event) => onChange('publisher', event.target.value)} />
            </label>
            <label>
              Edicao
              <input
                value={modal.form.edition}
                onChange={(event) => onChange('edition', event.target.value)}
                placeholder="Capa dura, bolso, comemorativa"
              />
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
                value={modal.form.condition}
                onChange={(event) => onChange('condition', event.target.value)}
                placeholder="Novo, bom, gasto"
              />
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
                  <input value={modal.form.language} onChange={(event) => onChange('language', event.target.value)} />
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
                <input value={modal.form.currency} onChange={(event) => onChange('currency', event.target.value)} />
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

function StatCard({ label, value }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function setFormValue(setForm, field, value) {
  setForm((current) => ({ ...current, [field]: value }));
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

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default App;
