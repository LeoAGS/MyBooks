function GroupBar({ groupMode, groupOptions, onGroupModeChange, visible }) {
  if (!visible) {
    return null;
  }

  return (
    <nav className="group-bar" aria-label="Agrupar obras">
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
