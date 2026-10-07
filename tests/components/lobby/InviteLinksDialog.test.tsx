import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import InviteLinksDialog from '@/components/lobby/InviteLinksDialog';
import { type InviteLink, MAX_INVITES } from '@/components/lobby/lobbyAccess';
import { lobbyActionsMock } from '../../actions';
import { renderWithIntl } from '../../render';

const token = (n: number) => `token${String(n).padStart(17, '0')}`;
const link = (t: string) => `${window.location.origin}/fr/lobby/SHJ-60S?invite=${t}`;

const LINKS: InviteLink[] = [
  { token: token(1), status: 'unused', usedBy: null },
  { token: token(2), status: 'used', usedBy: 'Nobara' },
  { token: token(3), status: 'revoked', usedBy: 'Yuji' },
];

const rows = () => within(screen.getByRole('list', { name: 'Links' })).queryAllByRole('listitem');

async function openDialog(mode: 'url' | 'oneTime', refreshKey = '') {
  window.history.replaceState(null, '', '/fr/lobby/SHJ-60S?spectate=1');
  const rendered = renderWithIntl(<InviteLinksDialog code="SHJ-60S" mode={mode} refreshKey={refreshKey} />);
  await rendered.user.click(screen.getByRole('button', { name: 'Invite links' }));
  return rendered;
}

describe('InviteLinksDialog (LOB-3, LOB-4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows and copies the public lobby link without the query string', async () => {
    const { user } = await openDialog('url');

    expect(screen.getByLabelText('Lobby link')).toHaveValue(`${window.location.origin}/fr/lobby/SHJ-60S`);
    await user.click(screen.getByRole('button', { name: 'Copy invite link' }));

    expect(await navigator.clipboard.readText()).toBe(`${window.location.origin}/fr/lobby/SHJ-60S`);
    expect(lobbyActionsMock.listInvitesAction).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'New invite link' })).not.toBeInTheDocument();
  });

  it('lists every link with its status', async () => {
    lobbyActionsMock.listInvitesAction.mockResolvedValue(LINKS);
    await openDialog('oneTime');

    expect(await screen.findByText('Used by Nobara')).toBeInTheDocument();
    expect(lobbyActionsMock.listInvitesAction).toHaveBeenCalledWith('SHJ-60S');
    expect(rows()).toHaveLength(3);
    expect(within(rows()[0]).getByText('Unused')).toBeInTheDocument();
    expect(within(rows()[0]).getByText(link(token(1)))).toBeInTheDocument();
    expect(within(rows()[2]).getByText('Revoked: Yuji was kicked')).toBeInTheDocument();
    expect(screen.getByText(`3 / ${MAX_INVITES} links`)).toBeInTheDocument();
  });

  it('says so when there is no link yet', async () => {
    await openDialog('oneTime');

    expect(await screen.findByText('No links yet.')).toBeInTheDocument();
  });

  it('creates one link, copies it and shows it on top', async () => {
    lobbyActionsMock.listInvitesAction.mockResolvedValue(LINKS);
    lobbyActionsMock.createInvitesAction.mockResolvedValue([token(9)]);
    const { user } = await openDialog('oneTime');
    await screen.findByText('Used by Nobara');

    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    expect(lobbyActionsMock.createInvitesAction).toHaveBeenCalledWith('SHJ-60S', 1);
    expect(await navigator.clipboard.readText()).toBe(link(token(9)));
    expect(rows()).toHaveLength(4);
    expect(within(rows()[0]).getByText(link(token(9)))).toBeInTheDocument();
    expect(within(rows()[0]).getByText('Unused')).toBeInTheDocument();
  });

  it('creates a batch of links and copies them all, one per line', async () => {
    lobbyActionsMock.createInvitesAction.mockResolvedValue([token(7), token(8), token(9)]);
    const { user } = await openDialog('oneTime');
    await screen.findByText('No links yet.');

    const count = screen.getByRole('spinbutton', { name: 'Batch' });
    await user.clear(count);
    await user.type(count, '3');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Create 3 links' }));

    expect(lobbyActionsMock.createInvitesAction).toHaveBeenCalledWith('SHJ-60S', 3);
    expect(await navigator.clipboard.readText()).toBe([token(7), token(8), token(9)].map(link).join('\n'));
    expect(rows()).toHaveLength(3);
  });

  it('copies one link of the list', async () => {
    lobbyActionsMock.listInvitesAction.mockResolvedValue(LINKS);
    const { user } = await openDialog('oneTime');
    await screen.findByText('Used by Nobara');

    await user.click(within(rows()[1]).getByRole('button', { name: 'Copy link' }));

    expect(await navigator.clipboard.readText()).toBe(link(token(2)));
  });

  it('deletes a link', async () => {
    lobbyActionsMock.listInvitesAction.mockResolvedValue(LINKS);
    const { user } = await openDialog('oneTime');
    await screen.findByText('Used by Nobara');

    await user.click(within(rows()[1]).getByRole('button', { name: 'Delete link' }));

    expect(lobbyActionsMock.deleteInviteAction).toHaveBeenCalledWith('SHJ-60S', token(2));
    expect(rows()).toHaveLength(2);
    expect(screen.queryByText('Used by Nobara')).not.toBeInTheDocument();
  });

  it(`stops at ${MAX_INVITES} links`, async () => {
    lobbyActionsMock.listInvitesAction.mockResolvedValue(Array.from({ length: MAX_INVITES }, (_, i) => ({ token: token(i), status: 'unused', usedBy: null })));
    await openDialog('oneTime');

    expect(await screen.findByText('Limit reached: delete links to make new ones.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New invite link' })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Create/ })).toBeDisabled();
  });

  it('says so when the server refuses to create a link', async () => {
    lobbyActionsMock.createInvitesAction.mockResolvedValue(null);
    const { user } = await openDialog('oneTime');
    await screen.findByText('No links yet.');

    await user.click(screen.getByRole('button', { name: 'New invite link' }));

    expect(await screen.findByRole('button', { name: 'Copy failed' })).toBeInTheDocument();
    expect(rows()).toHaveLength(0);
  });

  it('reloads the list when someone joins or leaves while it is open', async () => {
    window.history.replaceState(null, '', '/fr/lobby/SHJ-60S');
    const { user, rerender } = renderWithIntl(<InviteLinksDialog code="SHJ-60S" mode="oneTime" refreshKey="Gojo" />);
    await user.click(screen.getByRole('button', { name: 'Invite links' }));
    await screen.findByText('No links yet.');

    lobbyActionsMock.listInvitesAction.mockResolvedValue([{ token: token(1), status: 'used', usedBy: 'Nobara' }]);
    rerender(<InviteLinksDialog code="SHJ-60S" mode="oneTime" refreshKey="Gojo,Nobara" />);

    expect(await screen.findByText('Used by Nobara')).toBeInTheDocument();
    expect(lobbyActionsMock.listInvitesAction).toHaveBeenCalledTimes(2);
  });

  // Safari only lets the click write to the clipboard: the write starts before the server answers.
  it('starts the clipboard write during the click, before the new link exists', async () => {
    vi.stubGlobal(
      'ClipboardItem',
      class {
        constructor(readonly data: Record<string, Promise<Blob>>) {}
        get types() {
          return Object.keys(this.data);
        }
        getType(type: string) {
          return this.data[type];
        }
      },
    );
    let answer: (tokens: string[]) => void = () => {};
    lobbyActionsMock.createInvitesAction.mockReturnValue(new Promise<string[]>((resolve) => (answer = resolve)));
    const { user } = await openDialog('oneTime');
    await screen.findByText('No links yet.');
    const write = vi.spyOn(navigator.clipboard, 'write');

    await user.click(screen.getByRole('button', { name: 'New invite link' }));
    expect(write).toHaveBeenCalledOnce();

    answer([token(1)]);
    expect(await screen.findByRole('button', { name: 'Copied!' })).toBeInTheDocument();
    expect(await navigator.clipboard.readText()).toBe(link(token(1)));
  });
});
