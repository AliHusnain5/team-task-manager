import { useEffect, useState } from 'react';
import Modal from '../ui/Modal.jsx';
import { api } from '../../api/index.js';

// Create a task, or edit one when `task` is passed.
export default function TaskModal({ task, teams, defaultTeamId, onClose, onSaved }) {
  const editing = Boolean(task);
  const [form, setForm] = useState({
    teamId: task?.teamId || defaultTeamId || teams[0]?.id || '',
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '',
    assigneeId: task?.assigneeId || '',
  });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Assignee options depend on the chosen team.
  useEffect(() => {
    if (!form.teamId) return;
    let cancelled = false;
    api
      .team(form.teamId)
      .then((d) => !cancelled && setMembers(d.members))
      .catch(() => !cancelled && setMembers([]));
    return () => {
      cancelled = true;
    };
  }, [form.teamId]);

  function changeTeam(e) {
    setForm((f) => ({ ...f, teamId: e.target.value, assigneeId: '' }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
    };
    try {
      if (editing) await api.updateTask(task.id, payload);
      else await api.createTask({ ...payload, teamId: Number(form.teamId) });
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal title={editing ? 'Edit task' : 'New task'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label" htmlFor="t-team">Team</label>
          <select id="t-team" className="input" value={form.teamId} onChange={changeTeam} disabled={editing} required>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="t-title">Title</label>
          <input id="t-title" className="input" required maxLength={200} autoFocus value={form.title} onChange={set('title')} />
        </div>
        <div>
          <label className="label" htmlFor="t-desc">Description</label>
          <textarea id="t-desc" rows={3} maxLength={2000} className="input" value={form.description} onChange={set('description')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="t-status">Status</label>
            <select id="t-status" className="input" value={form.status} onChange={set('status')}>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="t-priority">Priority</label>
            <select id="t-priority" className="input" value={form.priority} onChange={set('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="t-assignee">Assignee</label>
            <select id="t-assignee" className="input" value={form.assigneeId} onChange={set('assigneeId')}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="t-due">Due date</label>
            <input id="t-due" type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
          </div>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving...' : editing ? 'Update task' : 'Create task'}</button>
        </div>
      </form>
    </Modal>
  );
}
