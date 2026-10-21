// Bonus feature: shows the logged-in user's tasks that are overdue or due within 2 days.
export default function ReminderBanner({ reminders }) {
  if (reminders.length === 0) return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p className="font-medium">
        ⏰ {reminders.length} task{reminders.length > 1 ? 's' : ''} due soon or overdue
      </p>
      <ul className="mt-1 list-disc pl-5 text-xs">
        {reminders.slice(0, 4).map((r) => (
          <li key={r.id}>
            {r.title} — {r.dueDate} ({r.teamName})
          </li>
        ))}
      </ul>
    </div>
  );
}
