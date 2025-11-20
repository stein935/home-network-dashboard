import { useState } from 'react';
import * as Icons from 'lucide-react';
import { MoreVertical } from 'lucide-react';
import { CalendarCard } from '@features/calendar/CalendarCard';

export function ServiceCard({ service }) {
  const [isDragHandleHovered, setIsDragHandleHovered] = useState(false);

  // Render calendar card for calendar type
  if (service.card_type === 'calendar') {
    return <CalendarCard service={service} />;
  }

  // Default link card behavior
  const handleClick = () => {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  // Dynamically get icon component from lucide-react
  const IconComponent = Icons[service.icon] || Icons.ExternalLink;

  return (
    <div
      className="service-card relative"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Drag handle icon */}
      <div
        className="sortable-handle absolute right-4 top-4 z-20 cursor-move"
        onMouseEnter={() => setIsDragHandleHovered(true)}
        onMouseLeave={() => setIsDragHandleHovered(false)}
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when clicking drag handle
        }}
      >
        <MoreVertical
          size={24}
          className="text-text/40 transition-colors hover:text-text/70"
        />
      </div>

      <div
        className={`mb-4 text-accent1 transition-colors ${isDragHandleHovered ? 'text-accent2' : ''}`}
      >
        <IconComponent size={64} strokeWidth={2.5} />
      </div>
      <h3 className="text-center font-display text-2xl uppercase text-text">
        {service.name}
      </h3>
      <p className="mt-2 w-full truncate text-center font-body text-sm text-text/70">
        {service.url}
      </p>
    </div>
  );
}

export default ServiceCard;
