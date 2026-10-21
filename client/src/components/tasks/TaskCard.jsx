import { PRIORITY_STYLES, TASK_STATUSES } from '../../constants.js';
import { today } from '../../utils/date.js';

export default function TaskCard({ task, showTeam, canDelete, onStatusChange, onEdit, onDelete }) {
  const overdue = task.dueDate && task.status !== 'done' && task.dueDate < today();

  return (
    <article className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-2">
        <h3 className="break-words text-sm font-semibold text-slate-900">{task.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="mt-1 line-clamp-3 break-words text-xs text-slate-600">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        {showTeam && <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-700">{task.teamName}</span>}
        <span>👤 {task.assigneeName || 'Unassigned'}</span>
        {task.dueDate && (
          <span className={overdue ? 'font-medium text-red-600' : ''}>
            📅 {task.dueDate}
            {overdue && ' (overdue)'}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <select
          aria-label="Change status"
          className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
          value={task.status}
          onChange={(e) => onStatusChange(task, e.target.value)}
        >
          {TASK_STATUSES.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <div className="flex gap-3 text-xs font-medium">
          <button className="text-indigo-600 hover:underline" onClick={() => onEdit(task)}>
            Edit
          </button>
          {canDelete && (
            <button className="text-red-600 hover:underline" onClick={() => onDelete(task)}>
              Delete
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
