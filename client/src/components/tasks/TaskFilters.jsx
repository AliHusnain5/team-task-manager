import { TASK_STATUSES } from '../../constants.js';

export default function TaskFilters({ search, onSearch, filters, onFilters, members, userId }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input
        className="input"
        type="search"
        placeholder="Search tasks..."
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        aria-label="Search tasks"
      />
      <select
        className="input"
        value={filters.assigneeId}
        onChange={(e) => onFilters({ ...filters, assigneeId: e.target.value })}
        aria-label="Filter by assignee"
      >
        <option value="">All assignees</option>
        <option value="me">Assigned to me</option>
        <option value="unassigned">Unassigned</option>
        {members
          .filter((m) => m.id !== userId)
          .map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </select>
      <select
        className="input"
        value={filters.status}
        onChange={(e) => onFilters({ ...filters, status: e.target.value })}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  );
}
