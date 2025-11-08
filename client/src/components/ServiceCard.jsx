import { useState } from 'react';
import * as Icons from 'lucide-react';

export function ServiceCard({ service }) {
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    window.open(service.url, '_blank', 'noopener,noreferrer');
  };

  // Dynamically get icon component from lucide-react
  const IconComponent = Icons[service.icon] || Icons.ExternalLink;

  return (
    <div
      className="service-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="mb-4 text-light-accent1 dark:text-dark-accent1 group-hover:text-light-accent2 dark:group-hover:text-dark-accent2 transition-colors">
        <IconComponent size={64} strokeWidth={2.5} />
      </div>
      <h3 className="font-display text-2xl uppercase text-center text-light-text dark:text-dark-text">
        {service.name}
      </h3>
      <p className="font-body text-sm mt-2 text-light-text/70 dark:text-dark-text/70 text-center break-all">
        {service.url}
      </p>
    </div>
  );
}

export default ServiceCard;
