import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../api/index.js';

export default function MembersModal({ team, members, currentUser, onClose, onChanged }) {
  const isOwner = team.role === 'owner';
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action) {
    setError('');
    setInfo('');
    setBusy(true);
    try {
      const res = await action();
      if (res?.message) setInfo(res.message);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function add(e) {
    e.preventDefault();
    if (await run(() => api.addMember(team.id, email))) {
      setEmail('');
      setInfo('Member added.');
      onChanged();
    }
  }

  async function invite() {
    if (!email) return setError('Enter an email address first.');
    if (await run(() => api.inviteMember(team.id, email))) setEmail('');
  }

  async function remove(m) {
    const self = m.id === currentUser.id;
    if (!window.confirm(self ? 'Leave this team?' : `Remove ${m.name} from the team?`)) return;
    if (await run(() => api.removeMember(team.id, m.id))) onChanged(self);
  }

  return (
    <Modal title={`Members of ${team.name}`} onClose={onClose}>
      {isOwner && (
        <form onSubmit={add} className="mb-5">
          <label className="label" htmlFor="m-email">Add by email</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input id="m-email" type="email" required={false} className="input" placeholder="teammate@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-primary" disabled={busy || !email}>Add</button>
              <button type="button" className="btn-secondary" disabled={busy} onClick={invite}>Invite</button>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            "Add" needs a registered user. "Invite" is a stub that only logs the invite (no email is sent).
          </p>
        </form>
      )}

      {error && <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {info && <p className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{info}</p>}

      <ul className="divide-y divide-slate-100">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {m.name} {m.id === currentUser.id && <span className="text-slate-400">(you)</span>}
              </p>
              <p className="truncate text-xs text-slate-500">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                {m.role}
              </span>
              {m.role !== 'owner' && (isOwner || m.id === currentUser.id) && (
                <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(m)} disabled={busy}>
                  {m.id === currentUser.id ? 'Leave' : 'Remove'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
