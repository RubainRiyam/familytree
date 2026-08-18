import type { FamilyMember } from '@/types';
import { getItem, setItem, MEMBERS_KEY } from './localStorage';

function readAll(): FamilyMember[] {
  return getItem<FamilyMember[]>(MEMBERS_KEY) ?? [];
}

function writeAll(members: FamilyMember[]): void {
  setItem(MEMBERS_KEY, members);
}

export function getAllMembers(): FamilyMember[] {
  return readAll();
}

export function getMemberById(id: string): FamilyMember | undefined {
  return readAll().find(m => m.id === id);
}

export function createMember(
  data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt' | 'childrenIds'>
): FamilyMember {
  const now = new Date().toISOString();
  const member: FamilyMember = {
    ...data,
    id: crypto.randomUUID(),
    childrenIds: [],
    createdAt: now,
    updatedAt: now,
  };
  const members = readAll();
  members.push(member);
  writeAll(syncRelationships(members));
  return member;
}

export function updateMember(id: string, data: Partial<FamilyMember>): FamilyMember | null {
  const members = readAll();
  const idx = members.findIndex(m => m.id === id);
  if (idx === -1) return null;
  members[idx] = {
    ...members[idx],
    ...data,
    id,
    updatedAt: new Date().toISOString(),
  };
  writeAll(syncRelationships(members));
  return members[idx];
}

export function deleteMember(id: string): void {
  let members = readAll().filter(m => m.id !== id);
  members = members.map(m => ({
    ...m,
    fatherId: m.fatherId === id ? undefined : m.fatherId,
    motherId: m.motherId === id ? undefined : m.motherId,
    spouseId: m.spouseId === id ? undefined : m.spouseId,
    childrenIds: m.childrenIds.filter(cid => cid !== id),
  }));
  writeAll(members);
}

function syncRelationships(members: FamilyMember[]): FamilyMember[] {
  const byId = new Map(members.map(m => [m.id, m]));

  for (const m of members) {
    m.childrenIds = [];
  }

  for (const m of members) {
    if (m.fatherId) {
      const father = byId.get(m.fatherId);
      if (father && !father.childrenIds.includes(m.id)) {
        father.childrenIds.push(m.id);
      }
    }
    if (m.motherId) {
      const mother = byId.get(m.motherId);
      if (mother && !mother.childrenIds.includes(m.id)) {
        mother.childrenIds.push(m.id);
      }
    }
  }

  for (const m of members) {
    if (m.spouseId) {
      const spouse = byId.get(m.spouseId);
      if (spouse && spouse.spouseId !== m.id) {
        spouse.spouseId = m.id;
      }
    }
  }

  return members;
}

export function getChildren(memberId: string): FamilyMember[] {
  const members = readAll();
  return members.filter(m => m.fatherId === memberId || m.motherId === memberId);
}

export function getSiblings(memberId: string): FamilyMember[] {
  const members = readAll();
  const member = members.find(m => m.id === memberId);
  if (!member) return [];
  return members.filter(
    m =>
      m.id !== memberId &&
      ((member.fatherId && m.fatherId === member.fatherId) ||
        (member.motherId && m.motherId === member.motherId))
  );
}
