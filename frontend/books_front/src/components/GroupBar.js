function GroupBar({ groupMode, groupOptions, onGroupModeChange, scopeFilter, visible }) {
  if (!visible) {
    return null;
  }

  return (
    <nav className="group-bar" aria-label={`Agrupar ${scopeFilter}`}>
      {Object.entries(groupOptions).map(([value, label]) => (
        <button
          className={`group-tab ${groupMode === value ? 'active' : ''}`}
          key={value}
          onClick={() => onGroupModeChange(value)}
          type="button"
        >
          {label}
        </button>
      ))}
    </nav>
  );
}

export default GroupBar;
