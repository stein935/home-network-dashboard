// Helper function to parse date string and create a local date object
const parseLocalDate = (dateString) => {
  // Handle ISO date string (YYYY-MM-DD)
  const parts = dateString.split('T')[0].split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
};

// Helper function to determine due date category for visual styling
export const getDueDateCategory = (dueDate) => {
  if (!dueDate) return 'none';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = parseLocalDate(dueDate);

  if (due < today) return 'overdue';
  if (due.getTime() === today.getTime()) return 'today';
  if (due.getTime() === tomorrow.getTime()) return 'tomorrow';
  return 'future';
};

// Format date for display
export const formatDueDate = (dueDate) => {
  if (!dueDate) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const due = parseLocalDate(dueDate);

  if (due.getTime() === today.getTime()) return 'Today';
  if (due.getTime() === tomorrow.getTime()) return 'Tomorrow';

  // Format as MM/DD/YYYY
  const month = String(due.getMonth() + 1).padStart(2, '0');
  const day = String(due.getDate()).padStart(2, '0');
  const year = due.getFullYear();

  return `${month}/${day}/${year}`;
};

// Get badge config based on due date category
export const getDueDateBadgeConfig = (category) => {
  const configs = {
    overdue: {
      bgColor: 'bg-red-500',
      textColor: 'text-white',
      icon: 'AlertTriangle',
      label: 'Overdue',
      borderColor: 'border-red-500',
    },
    today: {
      bgColor: 'bg-orange-500',
      textColor: 'text-white',
      icon: 'AlertCircle',
      label: 'Due Today',
      borderColor: 'border-orange-500',
    },
    tomorrow: {
      bgColor: 'bg-yellow-400',
      textColor: 'text-black',
      icon: 'Clock',
      label: 'Due Tomorrow',
      borderColor: 'border-yellow-400',
    },
    future: {
      bgColor: 'bg-gray-200',
      textColor: 'text-gray-700',
      icon: 'Calendar',
      label: 'Scheduled',
      borderColor: 'border-gray-400',
    },
    none: {
      bgColor: '',
      textColor: '',
      icon: '',
      label: '',
      borderColor: '',
    },
  };

  return configs[category] || configs.none;
};
