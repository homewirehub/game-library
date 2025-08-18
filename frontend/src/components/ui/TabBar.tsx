import React from 'react';
import './TabBar.css';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

export interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  className?: string;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  className = '',
}) => {
  const baseClass = 'tab-bar';
  const variantClass = `tab-bar--${variant}`;
  const sizeClass = `tab-bar--${size}`;
  const fullWidthClass = fullWidth ? 'tab-bar--full-width' : '';

  const classes = [baseClass, variantClass, sizeClass, fullWidthClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={`tab-${tab.id}`}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`tabpanel-${tab.id}`}
          disabled={tab.disabled}
          className={`tab-item ${activeTab === tab.id ? 'tab-item--active' : ''} ${tab.disabled ? 'tab-item--disabled' : ''}`}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
        >
          {tab.icon && <span className="tab-item__icon">{tab.icon}</span>}
          <span className="tab-item__label">{tab.label}</span>
          {tab.badge && <span className="tab-item__badge">{tab.badge}</span>}
        </button>
      ))}
    </div>
  );
};

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  tabId: string;
  activeTab: string;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  tabId,
  activeTab,
  children,
  className = '',
  ...props
}) => {
  const isActive = activeTab === tabId;

  return (
    <div
      id={`tabpanel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`tab-${tabId}`}
      hidden={!isActive}
      className={`tab-panel ${isActive ? 'tab-panel--active' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default TabBar;
