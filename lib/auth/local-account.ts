import { createHash } from 'node:crypto';

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function usernameToInternalEmail(username: string) {
  const normalized = normalizeUsername(username);
  const digest = createHash('sha256').update(normalized, 'utf8').digest('hex');
  return `u_${digest}@users.local`;
}
