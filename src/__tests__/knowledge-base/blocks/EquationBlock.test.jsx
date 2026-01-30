import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EquationBlock from '../../../components/KnowledgeBase/blocks/EquationBlock';

describe('EquationBlock', () => {
  it('renders equation placeholder when no content', () => {
    render(<EquationBlock block={{ type: 'equation', properties: {} }} content={{}} />);
    expect(screen.getByText(/add an equation/i)).toBeInTheDocument();
  });

  it('renders edit mode with latex input', () => {
    render(
      <EquationBlock
        block={{ type: 'equation', properties: {} }}
        content={{ latex: 'E = mc^2' }}
        isEditing={true}
      />
    );
    const input = screen.getByDisplayValue('E = mc^2');
    expect(input).toBeInTheDocument();
  });

  it('shows quick reference in edit mode', () => {
    render(
      <EquationBlock
        block={{ type: 'equation', properties: { displayMode: true } }}
        content={{ latex: '' }}
        isEditing={true}
      />
    );
    expect(screen.getByText(/quick reference/i)).toBeInTheDocument();
  });

  it('calls onUpdate when editing', () => {
    const onUpdate = jest.fn();
    render(
      <EquationBlock
        block={{ type: 'equation', properties: {} }}
        content={{ latex: 'x' }}
        isEditing={true}
        onUpdate={onUpdate}
      />
    );
    const input = screen.getByDisplayValue('x');
    fireEvent.change(input, { target: { value: 'y' } });
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ latex: 'y' }));
  });
});
