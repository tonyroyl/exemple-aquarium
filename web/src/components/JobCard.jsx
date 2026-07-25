import { STATUS_OPTIONS } from '../constants.js';

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch {
    return null;
  }
}

export default function JobCard({ job, onStatusChange }) {
  const date = formatDate(job.dateCreated);

  return (
    <article className="job-card">
      <div className="job-card-header">
        <div>
          <p className="job-title">{job.title}</p>
          <p className="job-meta">
            {job.company ? `${job.company} · ` : ''}
            {job.locationLabel || 'Lieu non précisé'}
            {date ? ` · publiée le ${date}` : ''}
          </p>
        </div>
        <span className="score-pill" title="Score de pertinence">{job.score} pts</span>
      </div>

      <div className="job-tags">
        {job.isNew && <span className="tag new">Nouveau</span>}
        {job.housingMentioned && <span className="tag housing">Logé / nourri-logé</span>}
        {job.seasonal && <span className="tag seasonal">Saisonnier</span>}
        {job.contractType && !job.seasonal && <span className="tag">{job.contractType}</span>}
      </div>

      {job.description && <p className="job-description">{job.description}</p>}

      <div className="job-actions">
        {STATUS_OPTIONS.filter((s) => s.key !== 'nouvelle').map((s) => (
          <button
            key={s.key}
            type="button"
            className={job.status === s.key ? 'active-status' : ''}
            onClick={() => onStatusChange(job.id, s.key)}
          >
            {s.label}
          </button>
        ))}
        {job.url && (
          <a className="offer-link" href={job.url} target="_blank" rel="noreferrer">
            Voir l’offre
          </a>
        )}
      </div>
    </article>
  );
}
