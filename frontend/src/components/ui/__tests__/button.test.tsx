import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with text and handles click', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();

    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state and disables button', () => {
    const onClick = jest.fn();
    render(<Button loading onClick={onClick}>Save</Button>);

    const btn = screen.getByRole('button', { name: /save/i });
    expect(btn).toBeDisabled();
  });
});
