import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export const formatDate = (date, format = 'DD MMM YYYY') =>
  date ? dayjs(date).format(format) : '—';

export const formatDateTime = (date) =>
  date ? dayjs(date).format('DD MMM YYYY, hh:mm A') : '—';

export const formatTime = (date) =>
  date ? dayjs(date).format('hh:mm A') : '—';

export const timeAgo = (date) =>
  date ? dayjs(date).fromNow() : '—';

export const formatCurrency = (amount, currency = '₹') => {
  if (!amount && amount !== 0) return '—';
  return `${currency}${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export const formatPercentage = (value) =>
  value !== null && value !== undefined ? `${Number(value).toFixed(1)}%` : '—';

export const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
};

export const formatDuration = (minutes) => {
  if (!minutes) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const truncate = (str, max = 40) =>
  str && str.length > max ? str.slice(0, max) + '…' : str || '';
