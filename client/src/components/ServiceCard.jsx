import { useState } from 'react';
import * as Icons from 'lucide-react';
import { CalendarCard } from './CalendarCard';

export function ServiceCard({ service }) {
  const [imageError, setImageError] = useState(false);

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
      className="service-card group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="mb-4 text-accent1 group-hover:text-accent2 transition-colors">
        <IconComponent size={64} strokeWidth={2.5} />
      </div>
      <h3 className="font-display text-2xl uppercase text-center text-text">
        {service.name}
      </h3>
      <p className="font-body text-sm mt-2 text-text/70 text-center truncate w-full">
        {service.url}
      </p>
    </div>
  );
}

export default ServiceCard;
