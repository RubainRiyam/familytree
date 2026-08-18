import type { AuthSession } from '@/types';
import { getAllMembers, updateMember, createMember } from './memberStore';
import { getItem, setItem, removeItem, SESSION_KEY } from './localStorage';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function register(
  name: string,
  email: string,
  password: string,
  gender: 'male' | 'female' | 'other' = 'other',
  dateOfBirth: string = ''
): Promise<{ success: boolean; error?: string }> {
  const members = getAllMembers();
  const exists = members.find(m => m.auth?.email === email);
  if (exists) {
    return { success: false, error: 'An account with this email already exists.' };
  }

  const passwordHash = await hashPassword(password);
  createMember({
    name,
    dateOfBirth,
    gender,
    contactInfo: { email },
    auth: { email, passwordHash },
  });

  return { success: true };
}

export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
  const members = getAllMembers();
  const member = members.find(m => m.auth?.email === email);
  if (!member?.auth) {
    return { success: false, error: 'No account found with this email.' };
  }

  const hash = await hashPassword(password);
  if (hash !== member.auth.passwordHash) {
    return { success: false, error: 'Incorrect password.' };
  }

  const session: AuthSession = {
    memberId: member.id,
    email: member.auth.email,
    loginAt: new Date().toISOString(),
  };
  setItem(SESSION_KEY, session);
  return { success: true, session };
}

export function logout(): void {
  removeItem(SESSION_KEY);
}

export function getSession(): AuthSession | null {
  return getItem<AuthSession>(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export async function updatePassword(
  memberId: string,
  newPassword: string
): Promise<void> {
  const member = getAllMembers().find(m => m.id === memberId);
  if (!member?.auth) return;
  const passwordHash = await hashPassword(newPassword);
  updateMember(memberId, {
    auth: { ...member.auth, passwordHash },
  });
}
