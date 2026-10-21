import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../api/index.js';

// Create a team, or edit one when `team` is passed.
export default function TeamModal({ team, onClose, onSaved }) {
  const [form, setForm] = useState({ name: team?.name || '', description: team?.description || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = team ? await api.updateTeam(team.id, form) : await api.createTeam(form);
      onSaved(res.team);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={team ? 'Edit team' : 'Create team'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="team-name">Team name</label>
          <input id="team-name" className="input" required minLength={2} maxLength={100} autoFocus
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="team-desc">Description (optional)</label>
          <textarea id="team-desc" rows={3} maxLength={500} className="input"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
