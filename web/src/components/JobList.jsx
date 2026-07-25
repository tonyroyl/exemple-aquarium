import JobCard from './JobCard.jsx';

export default function JobList({ jobs, loading, error, onStatusChange }) {
  if (loading) return <p className="empty-state">Chargement des offres…</p>;
  if (error) return <p className="empty-state">Erreur : {error}</p>;
  if (!jobs.length) {
    return (
      <p className="empty-state">
        Aucune offre ne correspond à ces filtres pour le moment. Essayez d’élargir la recherche ou consultez
        l’onglet « Liens & sources ».
      </p>
    );
  }

  return (
    <div className="job-list">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}
