export default function Header({ user, onLogout, onToggleSidebar }) {
  return (
    <header className="z-30 shrink-0 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open teams menu"
            onClick={onToggleSidebar}
          >
            ☰
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            T
          </div>
          <span className="hidden font-semibold text-slate-900 sm:block">Team Task Manager</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden max-w-[12rem] truncate text-slate-600 sm:block">{user.name}</span>
          <button className="btn-secondary !py-1.5" onClick={onLogout}>
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
