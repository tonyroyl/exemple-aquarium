export default function NavBar({ activeTab, onTabChange, badgeCount }) {
  const tabs = [
    { key: 'offres', label: 'Offres' },
    { key: 'sources', label: 'Liens & sources' },
    { key: 'destinations', label: 'Destinations' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-title">
        <h1>Saisonnier Logé</h1>
        {badgeCount > 0 && <span className="badge">{badgeCount} nouvelle{badgeCount > 1 ? 's' : ''}</span>}
      </div>
      <nav className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
