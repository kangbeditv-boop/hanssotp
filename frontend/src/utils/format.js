export function formatCurrency(amount) {
  return `Rp${Number(amount).toLocaleString('id-ID')}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCountdown(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return '00:00';
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function getStatusBadgeClass(status) {
  switch (status) {
    case 'received':
    case 'paid':
    case 'success':
      return 'badge-success';
    case 'pending':
    case 'waiting_otp':
      return 'badge-warning';
    case 'cancelled':
    case 'expired':
    case 'failed':
    case 'error':
      return 'badge-danger';
    case 'refunded':
      return 'badge-info';
    default:
      return 'badge-info';
  }
}
