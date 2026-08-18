import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useMembers';
import { Avatar } from '@/components/shared/Avatar';
import type { FamilyMember } from '@/types';

export function DashboardPage() {
  const { currentMember } = useAuth();
  const { members } = useMembers();

  const totalMembers = members.length;
  const maleCount = members.filter(m => m.gender === 'male').length;
  const femaleCount = members.filter(m => m.gender === 'female').length;

  const roots = members.filter(m => !m.fatherId && !m.motherId);
  function getDepth(member: FamilyMember, visited: Set<string>): number {
    if (visited.has(member.id)) return 0;
    visited.add(member.id);
    const childMembers = members.filter(
      m => m.fatherId === member.id || m.motherId === member.id
    );
    if (childMembers.length === 0) return 1;
    return 1 + Math.max(...childMembers.map(c => getDepth(c, visited)));
  }
  const generations = roots.length > 0
    ? Math.max(...roots.map(r => getDepth(r, new Set())))
    : 0;

  const recent = [...members]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">
          Welcome{currentMember ? `, ${currentMember.name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-sm text-text-muted mt-0.5">Here's an overview of your family tree.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Members" value={totalMembers} icon="👥" />
        <StatCard label="Male" value={maleCount} icon="👨" />
        <StatCard label="Female" value={femaleCount} icon="👩" />
        <StatCard label="Generations" value={generations} icon="🌳" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <QuickAction to="/members/new" title="Add Member" desc="Add a new family member" icon={AddIcon} />
        <QuickAction to="/tree" title="View Tree" desc="See the full family tree" icon={TreeViewIcon} />
        <QuickAction to="/members" title="All Members" desc="Browse all family members" icon={ListIcon} />
      </div>

      {recent.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-4">
            Recently Updated
          </h2>
          <div className="space-y-2">
            {recent.map(m => (
              <Link
                key={m.id}
                to={`/members/${m.id}`}
                className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <Avatar name={m.name} photoUrl={m.photoUrl} size="sm" />
                <span className="text-sm font-medium text-text flex-1">{m.name}</span>
                <span className="text-xs text-text-muted capitalize">{m.gender}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-text">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
}

function QuickAction({
  to,
  title,
  desc,
  icon: Icon,
}: {
  to: string;
  title: string;
  desc: string;
  icon: () => React.ReactNode;
}) {
  return (
    <Link
      to={to}
      className="bg-surface rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group"
    >
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 text-primary group-hover:bg-primary/20 transition-colors">
        <Icon />
      </div>
      <h3 className="font-semibold text-text text-sm">{title}</h3>
      <p className="text-xs text-text-muted mt-0.5">{desc}</p>
    </Link>
  );
}

function AddIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function TreeViewIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v18M5 8l7-5 7 5M3 15l9-5 9 5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
