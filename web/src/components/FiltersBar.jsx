import { JOB_CATEGORIES, STATUS_OPTIONS } from '../constants.js';

export default function FiltersBar({ destinations, filters, onChange }) {
  function update(patch) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="filters">
      <select
        value={filters.destination}
        onChange={(e) => update({ destination: e.target.value })}
        aria-label="Filtrer par destination"
      >
        <option value="">Toutes destinations</option>
        {destinations.map((d) => (
          <option key={d.key} value={d.key}>{d.label}</option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => update({ category: e.target.value })}
        aria-label="Filtrer par poste"
      >
        <option value="">Tous postes</option>
        {JOB_CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => update({ status: e.target.value })}
        aria-label="Filtrer par statut"
      >
        <option value="">Tous statuts</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.key} value={s.key}>{s.label}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Rechercher (mot-clé, entreprise...)"
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
      />

      <label className="checkbox">
        <input
          type="checkbox"
          checked={filters.housingOnly}
          onChange={(e) => update({ housingOnly: e.target.checked })}
        />
        Logement fourni uniquement
      </label>
    </div>
  );
}
