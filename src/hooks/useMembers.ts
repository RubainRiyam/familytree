import { useState, useCallback } from 'react';
import type { FamilyMember } from '@/types';
import * as memberStore from '@/store/memberStore';

export function useMembers() {
  const [members, setMembers] = useState<FamilyMember[]>(memberStore.getAllMembers());

  const refresh = useCallback(() => {
    setMembers(memberStore.getAllMembers());
  }, []);

  const create = useCallback(
    (data: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt' | 'childrenIds'>) => {
      const member = memberStore.createMember(data);
      refresh();
      return member;
    },
    [refresh]
  );

  const update = useCallback(
    (id: string, data: Partial<FamilyMember>) => {
      const member = memberStore.updateMember(id, data);
      refresh();
      return member;
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      memberStore.deleteMember(id);
      refresh();
    },
    [refresh]
  );

  return { members, refresh, create, update, remove };
}
