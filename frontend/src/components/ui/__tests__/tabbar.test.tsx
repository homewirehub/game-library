import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabBar } from '../TabBar';

describe('TabBar', () => {
  it('renders tabs and changes active on click', () => {
    const tabs = [
      { id: 'one', label: 'One' },
      { id: 'two', label: 'Two' },
    ];
    const onTabChange = jest.fn();

    render(<TabBar tabs={tabs} activeTab="one" onTabChange={onTabChange} />);

    const tabOne = screen.getByRole('tab', { name: /one/i });
    const tabTwo = screen.getByRole('tab', { name: /two/i });

    expect(tabOne).toHaveAttribute('aria-selected', 'true');
    expect(tabTwo).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(tabTwo);
    expect(onTabChange).toHaveBeenCalledWith('two');
  });
});
