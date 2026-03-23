import { PropertyStatus } from '@/types/property';

interface StatusBadgeProps {
  status: PropertyStatus;
}

const statusStyles = {
  active: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  sold: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusLabels = {
  active: 'Active',
  pending: 'Pending',
  sold: 'Sold',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'active' ? 'bg-green-500' : 
        status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
      }`} />
      {statusLabels[status]}
    </span>
  );
}
