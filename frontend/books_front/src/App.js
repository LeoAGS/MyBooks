import { useEffect, useMemo, useState } from 'react';
import * as catalogApi from './api/catalogApi';
import './App.css';
import AppHeader from './components/AppHeader';
import CopyDetail from './components/CopyDetail';
import CopyModal from './components/CopyModal';
import GroupBar from './components/GroupBar';
import MetricBar from './components/MetricBar';
import ReadingModal from './components/ReadingModal';
import WorkDetail from './components/WorkDetail';
import WorkList from './components/WorkList';
import WorkModal from './components/WorkModal';
import { emptyCopyForm, emptyReadingForm, emptyWorkModalForm } from './constants/forms';
import {
  copyFormToPayload,
  copyToForm,
  readingFormToPayload,
  readingToForm,
  workFormToPayload,
  workToForm,
} from './utils/formMappers';
import { useCatalogSelection } from './hooks/useCatalogSelection';
import { buildLibraryItems } from './utils/buildLibraryItems';
import { filterCatalogItems } from './utils/filterCatalogItems';
import { buildSuggestions } from './utils/suggestions';
import { groupOptionsByScope } from './utils/groupWorks';

function App() {
  const [catalog, setCatalog] = useState(null);
  const [scopeFilter, setScopeFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState('recent');
  const [groupModes, setGroupModes] = useState({ all: 'all', read: 'all', library: 'all' });
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
      const data = await catalogApi.getCatalog();
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

  const libraryItems = useMemo(() => buildLibraryItems(allWorks), [allWorks]);

  const filteredItems = useMemo(
    () => filterCatalogItems({ allWorks, libraryItems, query, scopeFilter, sortMode }),
    [allWorks, libraryItems, query, scopeFilter, sortMode]
  );

  const activeGroupMode = groupModes[scopeFilter] || 'all';
  const activeGroupOptions = groupOptionsByScope[scopeFilter] || groupOptionsByScope.all;

  function handleGroupModeChange(groupMode) {
    setGroupModes((current) => ({ ...current, [scopeFilter]: groupMode }));
  }

  const catalogStats = useMemo(() => {
    if (!catalog?.stats) {
      return null;
    }

    const ownedVolumes =
      catalog.stats.ownedVolumes ??
      (catalog.library || []).reduce(
        (total, work) => total + (work.copies || []).reduce((copyTotal, copy) => copyTotal + Math.max(1, copy.volumeCount || 1), 0),
        0
      );

    return {
      ...catalog.stats,
      ownedVolumes,
      readingWorks: catalog.readings?.length ?? catalog.stats.readWorks,
    };
  }, [catalog]);
  const {
    selectedCopy,
    selectedItem,
    selectedWork,
    selectListItem,
    setSelectedCopyId,
    setSelectedWorkId,
  } = useCatalogSelection({ allWorks, filteredItems, scopeFilter });
  const suggestions = useMemo(() => buildSuggestions(allWorks), [allWorks]);

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
    const payload = isEditing
      ? workFormToPayload(workModal.form)
      : {
          ...workFormToPayload(workModal.form),
          reading: null,
          copy: null,
        };

    try {
      const saved = isEditing
        ? await catalogApi.updateWork(workModal.work.id, payload)
        : await catalogApi.createWork(payload);

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
      await catalogApi.deleteWork(work.id);
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
    const payload = readingFormToPayload(readingModal.form);

    try {
      if (isEditing) {
        await catalogApi.updateReading(readingModal.work.id, readingModal.reading.id, payload);
      } else {
        await catalogApi.createReading(readingModal.work.id, payload);
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
      await catalogApi.deleteReading(work.id, reading.id);
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

    try {
      const savedCopy = isEditing
        ? await catalogApi.updateCopy(copyModal.work.id, copyModal.copy.id, payload)
        : await catalogApi.createCopy(copyModal.work.id, payload);

      setSelectedWorkId(copyModal.work.id);
      setSelectedCopyId(savedCopy?.id || copyModal.copy?.id || null);
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
      const blob = await catalogApi.getCopiesBackupBlob();
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
      await catalogApi.deleteCopy(work.id, copy.id);
      setSelectedWorkId(work.id);
      setSelectedCopyId(null);
      setNotice('Exemplar removido.');
      await loadCatalog();
    } catch (error) {
      setNotice('Nao consegui remover o exemplar.');
    }
  }

  return (
    <main className="app-shell">
      <AppHeader onBackup={downloadCopiesBackup} onRefresh={loadCatalog} onWorkCreate={openCreateWorkModal} />

      {notice && <div className="notice">{notice}</div>}

      <MetricBar scopeFilter={scopeFilter} stats={catalogStats} onScopeChange={setScopeFilter} />
      <GroupBar
        groupMode={activeGroupMode}
        groupOptions={activeGroupOptions}
        scopeFilter={scopeFilter}
        visible
        onGroupModeChange={handleGroupModeChange}
      />

      <section className="workspace">
        <WorkList
          isLoading={isLoading}
          groupMode={activeGroupMode}
          scopeFilter={scopeFilter}
          onQueryChange={setQuery}
          onSelectWork={selectListItem}
          onSortModeChange={setSortMode}
          query={query}
          selectedWork={selectedItem}
          sortMode={sortMode}
          works={filteredItems}
        />

        <section className="panel detail-panel">
          {scopeFilter === 'library' ? (
            <CopyDetail
              copyItem={selectedItem}
              onCopyDelete={deleteCopy}
              onCopyEdit={openEditCopyModal}
              work={selectedWork}
            />
          ) : (
            <WorkDetail
              onCopyCreate={openCreateCopyModal}
              onCopyDelete={deleteCopy}
              onCopyEdit={openEditCopyModal}
              onReadingCreate={openCreateReadingModal}
              onReadingDelete={deleteReading}
              onReadingEdit={openEditReadingModal}
              onWorkDelete={deleteWork}
              onWorkEdit={openEditWorkModal}
              selectedCopyId={selectedCopy?.id || null}
              work={selectedWork}
            />
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
          allWorks={allWorks}
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

export default App;
