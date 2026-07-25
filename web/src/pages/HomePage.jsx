import { useEffect, useState, useCallback } from 'react';
import FiltersBar from '../components/FiltersBar.jsx';
import JobList from '../components/JobList.jsx';
import { getJobs, patchJobStatus, getSyncStatus } from '../api.js';

const DEFAULT_FILTERS = { destination: '', category: '', status: '', search: '', housingOnly: false };

export default function HomePage({ destinations }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  const loadJobs = useCallback(() => {
    setLoading(true);
    setError(null);
    getJobs({ ...filters, housingOnly: filters.housingOnly ? 'true' : '' })
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    getSyncStatus().then(setSyncStatus).catch(() => {});
  }, []);

  async function handleStatusChange(jobId, status) {
    const previous = jobs;
    setJobs((current) => current.map((j) => (j.id === jobId ? { ...j, status } : j)));
    try {
      await patchJobStatus(jobId, status);
    } catch (err) {
      setJobs(previous);
      setError(err.message);
    }
  }

  return (
    <div>
      {syncStatus?.usingMockData && (
        <p className="sync-status">
          Mode démonstration : offres fictives (aucune clé France Travail configurée dans .env).
        </p>
      )}
      <FiltersBar destinations={destinations} filters={filters} onChange={setFilters} />
      <JobList jobs={jobs} loading={loading} error={error} onStatusChange={handleStatusChange} />
    </div>
  );
}
