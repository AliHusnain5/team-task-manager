export default function TeamHeader({ team, canCreateTask, onMembers, onEdit, onDelete, onNewTask }) {
  const isOwner = team?.role === 'owner';
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold text-slate-900">{team ? team.name : 'All tasks'}</h1>
        {team?.description && <p className="text-sm text-slate-500">{team.description}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {team && (
          <button className="btn-secondary" onClick={onMembers}>
            Members
          </button>
        )}
        {isOwner && (
          <>
            <button className="btn-secondary" onClick={onEdit}>
              Edit
            </button>
            <button className="btn-secondary !text-red-600" onClick={onDelete}>
              Delete team
            </button>
          </>
        )}
        <button className="btn-primary" disabled={!canCreateTask} onClick={onNewTask}>
          + New task
        </button>
      </div>
    </div>
  );
}
