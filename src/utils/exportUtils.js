export function exportTasksToCSV(tasks) {
  if (!tasks || tasks.length === 0) return;

  const headers = [
    'Task ID',
    'Title',
    'Category',
    'Department',
    'Status',
    'Priority',
    'Assignee ID',
    'Estimated Hours',
    'Actual Hours',
    'Start Date',
    'Due Date',
    'Tags'
  ];

  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${t.category || ''}"`,
    `"${t.department || ''}"`,
    t.status,
    t.priority,
    t.assigneeId,
    t.estimatedHours || 0,
    t.actualHours || 0,
    t.startDate || '',
    t.dueDate || '',
    `"${(t.tags || []).join(', ')}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `TaskPulse_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportTasksToJSON(tasks) {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(tasks, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute('download', `TaskPulse_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
