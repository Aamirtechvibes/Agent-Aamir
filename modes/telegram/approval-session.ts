import { Markup } from 'telegraf';
import type { ActionTracker } from '../agent/actionTracker.ts';
import type { ToolExecutor } from '../agent/tool-executor.ts';
import type { ActionLog } from '../agent/types.ts';
import { composeBeforeAfter, formatPatch } from '../agent/diff-view.ts';
import { clip } from './text.ts';

export interface ApprovalSession {
  tracker: ActionTracker;
  executor: ToolExecutor;
  pending: ActionLog[];
}

export const approvalSessions = new Map<number, ApprovalSession>();

function groupPending(pending: ActionLog[]) {
  const files = new Map<string, ActionLog[]>();
  const shells: ActionLog[] = [];
  for (const a of pending) {
    if (a.type === 'tool_execute') shells.push(a);
    else {
      if (!files.has(a.path)) files.set(a.path, []);
      files.get(a.path)!.push(a);
    }
  }
  return { files, shells };
}

export function approvalSummary(pending: ActionLog[]): string {
  const { files, shells } = groupPending(pending);
  const fileLines = [...files].map(([path, actions]) => {
    const types = [...new Set(actions.map((a) => a.type.replace(/_/g, ' ')))].join(', ');
    return `📄 ${path} (${types})`;
  });
  const shellLines = shells.map((s) => `🖥 Shell: ${s.details.command}`);
  return ['Staged changes — review before applying', '', ...fileLines, ...shellLines, '', `Total: ${pending.length} change(s)`].join('\n');
}

export function approvalDiff(pending: ActionLog[]): string {
  const { files, shells } = groupPending(pending);
  const parts: string[] = [];
  for (const [filePath, actions] of files) {
    const sorted = [...actions].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const { before, after } = composeBeforeAfter(sorted);
    parts.push(clip(formatPatch(filePath, before, after), 1500));
  }
  for (const s of shells) parts.push(`🖥 Shell: ${s.details.command}`);
  return parts.join('\n\n').trim();
}

async function promptApproval(
  ctx: { reply: (t: string, o?: object) => Promise<unknown> },
  chatId: number,
  session: ApprovalSession,
) {
  approvalSessions.set(chatId, session);
  await ctx.reply(approvalSummary(session.pending), {
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📋 Show Diff', 'approval_diff')],
      [
        Markup.button.callback('✅ Accept All', 'approval_accept'),
        Markup.button.callback('❌ Reject All', 'approval_reject'),
      ],
    ]),
  });
}

export async function finishOrApprove(
  ctx: { reply: (t: string, o?: object) => Promise<unknown> },
  chatId: number,
  tracker: ActionTracker,
  executor: ToolExecutor,
  noChangesMsg: string,
) {
  const pending = tracker.getPendingMutations();
  if (pending.length === 0) {
    await ctx.reply(noChangesMsg);
    return;
  }
  await promptApproval(ctx, chatId, { tracker, executor, pending });
}