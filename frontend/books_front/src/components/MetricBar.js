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
        detail={`${stats?.readingNow || 0} lendo`}
        label="Leituras"
        onClick={() => onScopeChange('read')}
        value={stats?.readingWorks ?? stats?.readWorks ?? 0}
      />
      <MetricButton
        active={scopeFilter === 'library'}
        detail={`${stats?.ownedVolumes || 0} volumes`}
        label="Na biblioteca"
        onClick={() => onScopeChange('library')}
        value={stats?.ownedCopies ?? stats?.ownedWorks ?? 0}
      />
    </section>
  );
}

function MetricButton({ active, detail, label, onClick, value }) {
  return (
    <button className={`metric-button ${active ? 'active' : ''}`} onClick={onClick} type="button">
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </button>
  );
}

export default MetricBar;
