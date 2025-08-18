import React from 'react';
import './ScrollableLayout.css';

interface ScrollableLayoutProps {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ScrollableLayout: React.FC<ScrollableLayoutProps> = ({
  children,
  padding = 'md',
  maxWidth = 'xl',
}) => {
  const paddingClass = `scrollable-layout--padding-${padding}`;
  const maxWidthClass = `scrollable-layout--max-width-${maxWidth}`;

  return (
    <div className={`scrollable-layout ${paddingClass} ${maxWidthClass}`}>
      <div className="scrollable-layout__content">{children}</div>
    </div>
  );
};

export default ScrollableLayout;
