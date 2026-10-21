const itemClass = (active) =>
  `flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
    active
      ? 'bg-indigo-600 text-white'
      : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
  }`;

export default function Sidebar({ teams, teamId, loading, onSelect, onNewTeam }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teams</h2>
        <button className="text-xs font-medium text-indigo-600 hover:underline" onClick={onNewTeam}>
          + New team
        </button>
      </div>
      <nav className="space-y-1">
        <button className={itemClass(teamId === '')} onClick={() => onSelect('')}>
          All teams
        </button>
        {teams.map((t) => {
          const active = String(t.id) === String(teamId);
          return (
            <button key={t.id} className={itemClass(active)} onClick={() => onSelect(String(t.id))}>
              <span className="truncate">{t.name}</span>
              <span className={`ml-2 shrink-0 text-xs ${active ? 'text-indigo-100' : 'text-slate-400'}`}>
                {t.memberCount} 👥
              </span>
            </button>
          );
        })}
        {!loading && teams.length === 0 && (
          <p className="rounded-lg bg-white p-3 text-xs text-slate-500 ring-1 ring-slate-200">
            You are not in any team yet. Create one to get started.
          </p>
        )}
      </nav>
    </div>
  );
}
