import { useState } from 'react';
import * as Icons from 'lucide-react';
import { CalendarCard } from './CalendarCard';

export function ServiceCard({
  service,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Render calendar card for calendar type
  if (service.card_type === 'calendar') {
    return <CalendarCard service={service} />;
  }

  // Default link card behavior
  const handleClick = (e) => {
    // Prevent click if we just finished dragging
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  // Drag handlers
  const handleDragStart = (e) => {
    setIsDragging(true);
    if (onDragStart) {
      onDragStart(e, service);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
    setIsDragOver(false);
    // Reset dragging state after a short delay to prevent click
    setTimeout(() => setIsDragging(false), 100);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
    if (onDragOver) {
      onDragOver(e);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (onDrop) {
      onDrop(e, service);
    }
  };

  // Dynamically get icon component from lucide-react
  const IconComponent = Icons[service.icon] || Icons.ExternalLink;

  return (
    <div
      className={`service-card group ${isDragOver ? 'ring-4 ring-accent3' : ''}`}
      onClick={handleClick}
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="mb-4 text-accent1 transition-colors group-hover:text-accent2">
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
