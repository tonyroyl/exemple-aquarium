import { useState } from 'react';
import { createDestination, deleteDestination, updateDestination } from '../api.js';

export default function DestinationsPage({ destinations, onRefresh }) {
  const [newLabel, setNewLabel] = useState('');
  const [newDepartments, setNewDepartments] = useState('');
  const [error, setError] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  async function toggleEnabled(destination) {
    setBusyKey(destination.key);
    try {
      await updateDestination(destination.key, { enabled: !destination.enabled });
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDelete(key) {
    setBusyKey(key);
    try {
      await deleteDestination(key);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    if (!newLabel.trim()) return;
    try {
      const ftDepartments = newDepartments
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await createDestination({ label: newLabel.trim(), ftDepartments });
      setNewLabel('');
      setNewDepartments('');
      await onRefresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <p className="job-meta">
        Activez ou désactivez les destinations suivies par la synchronisation France Travail, ou ajoutez une
        destination personnalisée (avec ses codes département si vous les connaissez).
      </p>

      {error && <p className="empty-state">Erreur : {error}</p>}

      {destinations.map((d) => (
        <div key={d.key} className="destination-row">
          <div>
            <strong>{d.label}</strong>
            <div className="ft-badge">
              {d.ftCoverage ? `France Travail : dépt. ${d.ftDepartments.join(', ') || '—'}` : 'Hors couverture France Travail'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label className="switch">
              <input
                type="checkbox"
                checked={d.enabled}
                disabled={busyKey === d.key}
                onChange={() => toggleEnabled(d)}
              />
              <span className="switch-track" />
            </label>
            <button className="delete-button" disabled={busyKey === d.key} onClick={() => handleDelete(d.key)}>
              Retirer
            </button>
          </div>
        </div>
      ))}

      <form className="add-destination-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Nouvelle destination (ex: Martinique)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <input
          type="text"
          placeholder="Codes département FT (ex: 972)"
          value={newDepartments}
          onChange={(e) => setNewDepartments(e.target.value)}
        />
        <button type="submit">Ajouter</button>
      </form>
    </div>
  );
}
