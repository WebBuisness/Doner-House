export default function StatusBadge({ status }) {
  const map = {
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500', label: 'Pending' },
    confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-500', dot: 'bg-blue-500', label: 'Confirmed' },
    delivered: { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500', label: 'Delivered' },
    cancelled: { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500', label: 'Cancelled' },
  }
  const s = map[status?.toLowerCase()] || map.pending
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
