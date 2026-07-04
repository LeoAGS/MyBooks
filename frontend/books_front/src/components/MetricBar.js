function MetricBar({ scopeFilter, stats, onScopeChange }) {
  return (
    <section className="metric-bar" aria-label="Resumo do catalogo">
      <MetricButton
        active={scopeFilter === 'all'}
        label="Obras"
        onClick={() => onScopeChange('all')}
        value={stats?.totalWorks || 0}
      />
      <MetricButton
        active={scopeFilter === 'read'}
        label="Lidas"
        onClick={() => onScopeChange('read')}
        value={stats?.readWorks || 0}
      />
      <MetricButton
        active={scopeFilter === 'library'}
        label="Na biblioteca"
        onClick={() => onScopeChange('library')}
        value={stats?.ownedCopies ?? stats?.ownedWorks ?? 0}
      />
    </section>
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

export default MetricBar;
