import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FieldGuidance from './FieldGuidance';

describe('FieldGuidance', () => {
  it('renders persistent secondary guidance with a stable styling hook', () => {
    render(<FieldGuidance>Write the observable facts.</FieldGuidance>);

    expect(screen.getByText('Write the observable facts.')).toHaveClass('investment-field-guidance');
  });
});
