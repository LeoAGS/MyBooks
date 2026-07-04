function AppHeader({ onBackup, onRefresh, onWorkCreate }) {
  return (
    <section className="page-header">
      <div>
        <p className="eyebrow">MyBooks</p>
        <h1>Catalogo pessoal</h1>
        <p className="intro">
          Separe obras que voce leu, quer ler ou esta lendo dos exemplares que realmente existem na sua biblioteca.
        </p>
      </div>
      <div className="header-actions">
        <button className="primary-button" onClick={onWorkCreate} type="button">
          Nova obra
        </button>
        <button className="ghost-button" onClick={onBackup} type="button">
          Backup CSV
        </button>
        <button className="ghost-button" onClick={onRefresh} type="button">
          Atualizar
        </button>
      </div>
    </section>
  );
}

export default AppHeader;
