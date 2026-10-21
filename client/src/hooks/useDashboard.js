import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/index.js';

// All data loading and task/team actions for the dashboard live here,
// so the page component only has to compose the UI.
export function useDashboard() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState(''); // '' = all teams
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ q: '', assigneeId: '', status: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const selectedTeam = teams.find((t) => String(t.id) === String(teamId));
  const roleOf = (id) => teams.find((t) => t.id === id)?.role;

  const loadTeams = useCallback(async () => {
    const d = await api.teams();
    setTeams(d.teams);
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const d = await api.tasks({ teamId, ...filters });
      setTasks(d.tasks);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [teamId, filters]);

  const loadReminders = useCallback(() => {
    api.reminders().then((d) => setReminders(d.tasks)).catch(() => {});
  }, []);

  const loadMembers = useCallback(async () => {
    if (!teamId) return setMembers([]);
    try {
      const d = await api.team(teamId);
      setMembers(d.members);
    } catch {
      setMembers([]);
    }
  }, [teamId]);

  useEffect(() => {
    loadTeams().catch((e) => setError(e.message)).finally(() => setLoading(false));
    loadReminders();
  }, [loadTeams, loadReminders]);

  useEffect(() => { loadTasks(); }, [loadTasks]);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  // Debounce the search box so we do not call the API on every key press.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: search })), 300);
    return () => clearTimeout(t);
  }, [search]);

  const selectTeam = (id) => {
    setTeamId(id);
    setFilters((f) => ({ ...f, assigneeId: '' }));
  };

  const refreshTasks = useCallback(() => {
    loadTasks();
    loadReminders();
  }, [loadTasks, loadReminders]);

  const refreshAll = useCallback(async () => {
    await loadTeams();
    loadTasks();
    loadMembers();
    loadReminders();
  }, [loadTeams, loadTasks, loadMembers, loadReminders]);

  const run = async (action) => {
    try {
      await action();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeStatus = (task, status) =>
    run(async () => {
      await api.updateTask(task.id, { status });
      refreshTasks();
    });

  const deleteTask = (task) =>
    run(async () => {
      await api.deleteTask(task.id);
      refreshTasks();
    });

  const deleteTeam = () =>
    run(async () => {
      await api.deleteTeam(selectedTeam.id);
      setTeamId('');
      refreshAll();
    });

  return {
    teams, teamId, selectedTeam, members, tasks, reminders,
    search, setSearch, filters, setFilters, error, loading,
    roleOf, selectTeam, setTeamId, refreshAll, refreshTasks,
    changeStatus, deleteTask, deleteTeam,
  };
}
