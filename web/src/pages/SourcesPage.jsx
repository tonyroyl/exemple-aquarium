import { useEffect, useState } from 'react';
import { getLinks } from '../api.js';
import { JOB_CATEGORIES } from '../constants.js';

export default function SourcesPage({ destinations }) {
  const [destinationKey, setDestinationKey] = useState('');
  const [categoryKey, setCategoryKey] = useState('');
  const [housingOnly, setHousingOnly] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getLinks({ destination: destinationKey, category: categoryKey, housingOnly: String(housingOnly) })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [destinationKey, categoryKey, housingOnly]);

  const selectedDestination = destinations.find((d) => d.key === destinationKey);

  return (
    <div>
      <div className="filters">
        <select value={destinationKey} onChange={(e) => setDestinationKey(e.target.value)}>
          <option value="">Toutes destinations</option>
          {destinations.map((d) => (
            <option key={d.key} value={d.key}>{d.label}</option>
          ))}
        </select>
        <select value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
          <option value="">Tous postes</option>
          {JOB_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <label className="checkbox">
          <input type="checkbox" checked={housingOnly} onChange={(e) => setHousingOnly(e.target.checked)} />
          Inclure "logé" dans la recherche
        </label>
      </div>

      {selectedDestination && !selectedDestination.ftCoverage && (
        <p className="smart-link-note">
          Note : France Travail ne couvre pas (ou peu) {selectedDestination.label} — les liens intelligents
          ci-dessous sont d’autant plus utiles pour cette destination.
        </p>
      )}

      {loading && <p className="empty-state">Chargement des liens…</p>}
      {error && <p className="empty-state">Erreur : {error}</p>}

      {data && (
        <>
          <h2 className="section-title">Liens intelligents</h2>
          <div className="link-group">
            {data.smartLinks.map((link) => (
              <div key={link.source}>
                <a className="smart-link-button" href={link.url} target="_blank" rel="noreferrer">
                  <span>{link.source}</span>
                  <span>→</span>
                </a>
                {link.note && <p className="smart-link-note">{link.note}</p>}
              </div>
            ))}
          </div>

          {data.employerLinks.length > 0 && (
            <>
              <h2 className="section-title">Espaces de recrutement directs</h2>
              <div className="link-group">
                {data.employerLinks.map((link) => (
                  <a key={link.url} className="smart-link-button" href={link.url} target="_blank" rel="noreferrer">
                    <span>{link.label}</span>
                    <span>→</span>
                  </a>
                ))}
              </div>
            </>
          )}

          <h2 className="section-title">Sources manuelles (à consulter vous-même)</h2>
          <div className="link-group">
            {data.manualSources.map((source) => (
              <div key={source.label} className="manual-source">
                <strong>{source.label}</strong>
                {source.hint}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
