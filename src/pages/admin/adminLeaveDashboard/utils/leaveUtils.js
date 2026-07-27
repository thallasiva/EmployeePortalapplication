const today = new Date();

export function formatActionDate() {
  return today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function mapRequest(row) {
  return {
    id: row.leave_request_id,
    employee: (row.employee_name || '').trim() || '—',
    department: row.department_name || '—',
    type: row.leave_type_name || '—',
    from: formatDate(row.from_date),
    to: formatDate(row.to_date),
    days: Number(row.days) || 0,
    reason: row.reason || '—',
    appliedOn: formatDate(row.applied_on),
    status: row.status,
    actionBy: (row.reviewer_name || '').trim() || null,
    actionOn:
      row.status !== 'Pending'
        ? formatDate(row.reviewed_on || row.updated_at || row.applied_on)
        : null,
  };
}
