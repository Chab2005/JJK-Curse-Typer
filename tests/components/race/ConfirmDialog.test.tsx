import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '@/components/race/ConfirmDialog';
import { renderWithIntl } from '../../render';

describe('ConfirmDialog', () => {
  it('asks before an irreversible action and confirms or cancels', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { user } = renderWithIntl(
      <ConfirmDialog open title="Leave the race?" body="You will abandon." confirmLabel="Abandon and leave" onConfirm={onConfirm} onCancel={onCancel} />,
    );

    expect(screen.getByRole('dialog', { name: 'Leave the race?' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Keep racing' }));
    expect(onCancel).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Abandon and leave' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('stays closed when not open', () => {
    renderWithIntl(<ConfirmDialog open={false} title="Leave the race?" body="" confirmLabel="Leave" onConfirm={() => {}} onCancel={() => {}} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
