import React from 'react';
import './Layout.css';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
  scrollable?: boolean | 'auto' | 'content';
}

export const Container: React.FC<ContainerProps> = ({
  size = 'lg',
  padding = 'md',
  centered = true,
  scrollable = false,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'container';
  const sizeClass = `container--${size}`;
  const paddingClass = `container--padding-${padding}`;
  const centeredClass = centered ? 'container--centered' : '';
  const scrollableClass = scrollable
    ? `container--scrollable${scrollable === 'auto' ? '-auto' : scrollable === 'content' ? '-content' : ''}`
    : '';

  const classes = [baseClass, sizeClass, paddingClass, centeredClass, scrollableClass, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  scrollable?: boolean | 'x' | 'both';
}

export const Flex: React.FC<FlexProps> = ({
  direction = 'row',
  wrap = 'nowrap',
  justify = 'start',
  align = 'center',
  gap = 'md',
  scrollable = false,
  children,
  className = '',
  style = {},
  ...props
}) => {
  const baseClass = 'flex';
  const directionClass = `flex--${direction}`;
  const wrapClass = `flex--${wrap}`;
  const justifyClass = `flex--justify-${justify}`;
  const alignClass = `flex--align-${align}`;
  const gapClass = typeof gap === 'number' ? '' : `flex--gap-${gap}`;
  const scrollableClass = scrollable
    ? `flex--scrollable${scrollable === 'x' ? '-x' : scrollable === 'both' ? '-both' : ''}`
    : '';

  const classes = [
    baseClass,
    directionClass,
    wrapClass,
    justifyClass,
    alignClass,
    gapClass,
    scrollableClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const customStyle = typeof gap === 'number' ? { ...style, gap: `${gap}px` } : style;

  return (
    <div className={classes} style={customStyle} {...props}>
      {children}
    </div>
  );
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'auto' | 'responsive';
  gap?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rows?: 'auto' | number;
}

export const Grid: React.FC<GridProps> = ({
  cols = 'responsive',
  gap = 'md',
  rows = 'auto',
  children,
  className = '',
  style = {},
  ...props
}) => {
  const baseClass = 'grid';
  const colsClass = `grid--cols-${cols}`;
  const gapClass = `grid--gap-${gap}`;
  const rowsClass = typeof rows === 'number' ? '' : `grid--rows-${rows}`;

  const classes = [baseClass, colsClass, gapClass, rowsClass, className].filter(Boolean).join(' ');

  const customStyle =
    typeof rows === 'number' ? { ...style, gridTemplateRows: `repeat(${rows}, 1fr)` } : style;

  return (
    <div className={classes} style={customStyle} {...props}>
      {children}
    </div>
  );
};

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
}

export const Stack: React.FC<StackProps> = ({
  spacing = 'md',
  align = 'stretch',
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'stack';
  const spacingClass = `stack--spacing-${spacing}`;
  const alignClass = `stack--align-${align}`;

  const classes = [baseClass, spacingClass, alignClass, className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default { Container, Flex, Grid, Stack };
