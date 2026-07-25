import { useEffect, useState, useCallback } from 'react';
import NavBar from './components/NavBar.jsx';
import HomePage from './pages/HomePage.jsx';
import SourcesPage from './pages/SourcesPage.jsx';
import DestinationsPage from './pages/DestinationsPage.jsx';
import { getDestinations, getBadge, markVisited } from './api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('offres');
  const [allDestinations, setAllDestinations] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);

  const refreshDestinations = useCallback(async () => {
    const list = await getDestinations();
    setAllDestinations(list);
    return list;
  }, []);

  const enabledDestinations = allDestinations.filter((d) => d.enabled);

  useEffect(() => {
    refreshDestinations();
    getBadge().then((b) => setBadgeCount(b.newCount)).catch(() => {});
  }, [refreshDestinations]);

  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'offres' && badgeCount > 0) {
      markVisited().then(() => setBadgeCount(0)).catch(() => {});
    }
  }

  return (
    <div className="app">
      <NavBar activeTab={activeTab} onTabChange={handleTabChange} badgeCount={badgeCount} />
      <main>
        {activeTab === 'offres' && <HomePage destinations={enabledDestinations} />}
        {activeTab === 'sources' && <SourcesPage destinations={enabledDestinations} />}
        {activeTab === 'destinations' && (
          <DestinationsPage destinations={allDestinations} onRefresh={refreshDestinations} />
        )}
      </main>
    </div>
  );
}
