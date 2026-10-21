import { TASK_STATUSES } from '../../constants.js';
import TaskCard from './TaskCard.jsx';

export default function TaskBoard({ tasks, showTeam, userId, roleOf, onStatusChange, onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {TASK_STATUSES.map((col) => {
        const items = tasks.filter((t) => t.status === col.key);
        return (
          <section key={col.key} className="min-w-0 rounded-2xl bg-slate-100/70 p-3">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              {col.label}
              <span className="ml-auto rounded-full bg-white px-2 text-xs text-slate-500">{items.length}</span>
            </h2>
            <div className="space-y-3">
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  showTeam={showTeam}
                  canDelete={t.createdBy === userId || roleOf(t.teamId) === 'owner'}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
              {items.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No tasks</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}
