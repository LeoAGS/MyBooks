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

const emptyForm = {
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

function App() {
  const [catalog, setCatalog] = useState(null);
  const [activeTab, setActiveTab] = useState('readings');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedWorkId, setSelectedWorkId] = useState(null);
  const [form, setForm] = useState(emptyForm);
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
      title: form.title,
      author: form.author,
      originalYear: toNumber(form.originalYear),
      genre: form.genre || null,
      description: form.description || null,
      reading: form.addReading
        ? {
            status: form.readingStatus,
            rating: toNumber(form.rating),
            notes: form.notes || null,
          }
        : null,
      copy: form.addCopy
        ? {
            format: form.format,
            publisher: form.publisher || null,
            edition: form.edition || null,
            isbn: form.isbn || null,
            location: form.location || null,
            condition: form.condition || null,
            isGift: false,
            isLoaned: false,
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
      setForm(emptyForm);
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
    });
  }

  async function updateRating(work, rating) {
    const reading = work.reading || { status: 'WantToRead' };
    await saveReading(work.id, {
      ...reading,
      rating: toNumber(rating),
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

  async function addCopy(work) {
    const location = window.prompt('Onde esse exemplar fica? Ex: Estante sala / Prateleira 2');
    if (!location) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/works/${work.id}/copies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'Physical',
          location,
          isGift: false,
          isLoaned: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao adicionar exemplar.');
      }

      setActiveTab('library');
      setNotice('Exemplar adicionado a biblioteca.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui adicionar o exemplar.');
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
        <StatCard label="Emprestados" value={catalog?.stats?.loanedCopies || 0} />
      </section>

      <section className="workspace">
        <aside className="panel form-panel">
          <h2>Nova obra</h2>
          <form onSubmit={handleCreateWork}>
            <label>
              Titulo
              <input
                required
                value={form.title}
                onChange={(event) => setFormValue(setForm, 'title', event.target.value)}
                placeholder="Ex: Grande Sertao: Veredas"
              />
            </label>
            <label>
              Autor
              <input
                required
                value={form.author}
                onChange={(event) => setFormValue(setForm, 'author', event.target.value)}
                placeholder="Ex: Guimaraes Rosa"
              />
            </label>
            <div className="form-row">
              <label>
                Ano original
                <input
                  inputMode="numeric"
                  value={form.originalYear}
                  onChange={(event) => setFormValue(setForm, 'originalYear', event.target.value)}
                />
              </label>
              <label>
                Genero
                <input value={form.genre} onChange={(event) => setFormValue(setForm, 'genre', event.target.value)} />
              </label>
            </div>
            <label>
              Observacao
              <textarea
                value={form.description}
                onChange={(event) => setFormValue(setForm, 'description', event.target.value)}
                rows="3"
              />
            </label>

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.addReading}
                onChange={(event) => setFormValue(setForm, 'addReading', event.target.checked)}
              />
              Registrar em leituras
            </label>
            {form.addReading && (
              <div className="nested-fields">
                <label>
                  Status
                  <select
                    value={form.readingStatus}
                    onChange={(event) => setFormValue(setForm, 'readingStatus', event.target.value)}
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
                    value={form.rating}
                    onChange={(event) => setFormValue(setForm, 'rating', event.target.value)}
                    placeholder="1 a 5"
                  />
                </label>
                <label>
                  Notas pessoais
                  <textarea
                    value={form.notes}
                    onChange={(event) => setFormValue(setForm, 'notes', event.target.value)}
                    rows="2"
                  />
                </label>
              </div>
            )}

            <label className="check-row">
              <input
                type="checkbox"
                checked={form.addCopy}
                onChange={(event) => setFormValue(setForm, 'addCopy', event.target.checked)}
              />
              Tambem possuo um exemplar
            </label>
            {form.addCopy && (
              <div className="nested-fields">
                <div className="form-row">
                  <label>
                    Formato
                    <select value={form.format} onChange={(event) => setFormValue(setForm, 'format', event.target.value)}>
                      {Object.entries(copyFormatLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Localizacao
                    <input value={form.location} onChange={(event) => setFormValue(setForm, 'location', event.target.value)} />
                  </label>
                </div>
                <label>
                  Editora
                  <input value={form.publisher} onChange={(event) => setFormValue(setForm, 'publisher', event.target.value)} />
                </label>
                <label>
                  Edicao
                  <input value={form.edition} onChange={(event) => setFormValue(setForm, 'edition', event.target.value)} />
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
              addCopy={addCopy}
              onRatingChange={updateRating}
              onStatusChange={updateReadingStatus}
              work={selectedWork}
            />
          ) : (
            <div className="empty-state">Selecione uma obra para ver os detalhes.</div>
          )}
        </section>
      </section>
    </main>
  );
}

function WorkDetail({ addCopy, onRatingChange, onStatusChange, work }) {
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
        <button className="ghost-button" onClick={() => addCopy(work)} type="button">
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
        <h3>Biblioteca</h3>
        {work.copies.length === 0 ? (
          <p className="muted">Voce ainda nao cadastrou um exemplar desta obra.</p>
        ) : (
          <div className="copy-list">
            {work.copies.map((copy) => (
              <article className="copy-item" key={copy.id}>
                <strong>{copyFormatLabels[copy.format] || copy.format}</strong>
                <span>{copy.publisher || 'Editora nao informada'}</span>
                <span>{copy.edition || 'Edicao nao informada'}</span>
                <span>{copy.location || 'Sem localizacao'}</span>
                {copy.isLoaned && <span>Emprestado para {copy.loanedTo || 'alguem'}</span>}
              </article>
            ))}
          </div>
        )}
      </div>
    </>
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

function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export default App;
