import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useDashboard } from '../hooks/useDashboard.js';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import ReminderBanner from '../components/tasks/ReminderBanner.jsx';
import TaskFilters from '../components/tasks/TaskFilters.jsx';
import TaskBoard from '../components/tasks/TaskBoard.jsx';
import TaskModal from '../components/tasks/TaskModal.jsx';
import TeamHeader from '../components/teams/TeamHeader.jsx';
import TeamModal from '../components/teams/TeamModal.jsx';
import MembersModal from '../components/teams/MembersModal.jsx';

// Layout: the page itself never scrolls. The header and the teams sidebar stay fixed,
// and only the main area (tasks) scrolls. On phones the sidebar becomes a slide-in drawer.
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const d = useDashboard();
  const [modal, setModal] = useState(null); // { type: 'task' | 'team' | 'members', ... }
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeModal = () => setModal(null);

  const sidebar = (
    <Sidebar
      teams={d.teams}
      teamId={d.teamId}
      loading={d.loading}
      onSelect={(id) => {
        d.selectTeam(id);
        setDrawerOpen(false);
      }}
      onNewTeam={() => {
        setDrawerOpen(false);
        setModal({ type: 'team' });
      }}
    />
  );

  function confirmDeleteTask(task) {
    if (window.confirm(`Delete "${task.title}"?`)) d.deleteTask(task);
  }

  function confirmDeleteTeam() {
    if (window.confirm(`Delete team "${d.selectedTeam.name}" and all its tasks? This cannot be undone.`)) {
      d.deleteTeam();
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <Header user={user} onLogout={logout} onToggleSidebar={() => setDrawerOpen(true)} />

      <div className="flex min-h-0 flex-1">
        {/* Desktop sidebar (fixed, scrolls on its own if there are many teams) */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDrawerOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] overflow-y-auto bg-white p-4 shadow-xl">
              {sidebar}
            </aside>
          </div>
        )}

        {/* Main area: the only part that scrolls */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 pb-8 pt-4 lg:px-6 lg:pt-6">
            <ReminderBanner reminders={d.reminders} />

            <div className="bg-slate-50 lg:sticky lg:top-0 lg:z-10 lg:-mx-6 lg:px-6 lg:pb-2 lg:pt-2">
              <TeamHeader
                team={d.selectedTeam}
                canCreateTask={d.teams.length > 0}
                onMembers={() => setModal({ type: 'members' })}
                onEdit={() => setModal({ type: 'team', team: d.selectedTeam })}
                onDelete={confirmDeleteTeam}
                onNewTask={() => setModal({ type: 'task' })}
              />
              <div className="pb-4">
                <TaskFilters
                  search={d.search}
                  onSearch={d.setSearch}
                  filters={d.filters}
                  onFilters={d.setFilters}
                  members={d.members}
                  userId={user.id}
                />
              </div>
            </div>

            {d.error && (
              <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {d.error}
              </p>
            )}

            {d.loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : d.teams.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center">
                <p className="font-medium text-slate-700">Welcome, {user.name}!</p>
                <p className="mt-1 text-sm text-slate-500">Create your first team to start adding tasks.</p>
                <button className="btn-primary mt-4" onClick={() => setModal({ type: 'team' })}>
                  Create team
                </button>
              </div>
            ) : (
              <TaskBoard
                tasks={d.tasks}
                showTeam={!d.teamId}
                userId={user.id}
                roleOf={d.roleOf}
                onStatusChange={d.changeStatus}
                onEdit={(task) => setModal({ type: 'task', task })}
                onDelete={confirmDeleteTask}
              />
            )}
          </div>
        </main>
      </div>

      {modal?.type === 'task' && (
        <TaskModal
          task={modal.task}
          teams={d.teams}
          defaultTeamId={d.teamId}
          onClose={closeModal}
          onSaved={() => {
            closeModal();
            d.refreshTasks();
          }}
        />
      )}
      {modal?.type === 'team' && (
        <TeamModal
          team={modal.team}
          onClose={closeModal}
          onSaved={(team) => {
            closeModal();
            if (!modal.team) d.setTeamId(String(team.id));
            d.refreshAll();
          }}
        />
      )}
      {modal?.type === 'members' && d.selectedTeam && (
        <MembersModal
          team={d.selectedTeam}
          members={d.members}
          currentUser={user}
          onClose={closeModal}
          onChanged={(left) => {
            if (left) {
              closeModal();
              d.setTeamId('');
            }
            d.refreshAll();
          }}
        />
      )}
    </div>
  );
}
