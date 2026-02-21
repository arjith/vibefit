import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`vf-empty-state ${className}`} role="status">
      {icon && <div className="vf-empty-state__icon">{icon}</div>}
      <h3 className="vf-empty-state__title">{title}</h3>
      {description && <p className="vf-empty-state__description">{description}</p>}
      {action && (
        <button className="vf-button vf-button--primary vf-button--md" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
