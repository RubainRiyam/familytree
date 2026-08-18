import { Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { useSearch } from '@/hooks/useSearch';
import { MemberCard } from './MemberCard';
import { EmptyState } from '@/components/shared/EmptyState';

export function MemberListPage() {
  const { members } = useMembers();
  const { filters, setFilters, results } = useSearch(members);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text">Members</h1>
          <p className="text-sm text-text-muted mt-0.5">{members.length} family members</p>
        </div>
        <Link
          to="/members/new"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Member
        </Link>
      </div>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Filter by name..."
          value={filters.query}
          onChange={e => setFilters({ ...filters, query: e.target.value })}
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        />
        <select
          value={filters.gender ?? ''}
          onChange={e =>
            setFilters({
              ...filters,
              gender: (e.target.value || undefined) as 'male' | 'female' | 'other' | undefined,
            })
          }
          className="px-3 py-2 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
        >
          <option value="">All Genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="👨‍👩‍👧‍👦"
          title="No members found"
          description={
            members.length === 0
              ? 'Start building your family tree by adding the first member.'
              : 'No members match your search criteria.'
          }
          action={
            members.length === 0 ? (
              <Link
                to="/members/new"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add First Member
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {results.map(m => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </div>
  );
}
