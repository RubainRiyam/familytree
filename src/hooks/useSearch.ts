import { useState, useMemo } from 'react';
import type { FamilyMember, SearchFilters } from '@/types';

export function useSearch(members: FamilyMember[]) {
  const [filters, setFilters] = useState<SearchFilters>({ query: '' });

  const results = useMemo(() => {
    let filtered = members;

    if (filters.query) {
      const q = filters.query.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.contactInfo.email?.toLowerCase().includes(q) ||
          m.bio?.toLowerCase().includes(q)
      );
    }

    if (filters.gender) {
      filtered = filtered.filter(m => m.gender === filters.gender);
    }

    return filtered;
  }, [members, filters]);

  return { filters, setFilters, results };
}
