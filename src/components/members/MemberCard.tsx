import { Link } from 'react-router-dom';
import type { FamilyMember } from '@/types';
import { Avatar } from '@/components/shared/Avatar';
import { formatDate, getAge } from '@/utils/dateFormat';

interface MemberCardProps {
  member: FamilyMember;
}

const genderStyles: Record<string, string> = {
  male: 'bg-male/50 border-male-border/40',
  female: 'bg-female/50 border-female-border/40',
  other: 'bg-other/50 border-other-border/40',
};

export function MemberCard({ member }: MemberCardProps) {
  const age = member.dateOfBirth ? getAge(member.dateOfBirth, member.dateOfDeath) : null;

  return (
    <Link
      to={`/members/${member.id}`}
      className="bg-surface rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all p-4 flex items-start gap-3.5 group"
    >
      <Avatar name={member.name} photoUrl={member.photoUrl} size="lg" />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-text group-hover:text-primary transition-colors truncate">
          {member.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xs px-2 py-0.5 rounded-full capitalize border ${genderStyles[member.gender] ?? genderStyles.other}`}
          >
            {member.gender}
          </span>
          {age !== null && (
            <span className="text-xs text-text-muted">
              {member.dateOfDeath ? `Lived to ${age}` : `Age ${age}`}
            </span>
          )}
        </div>
        {member.dateOfBirth && (
          <p className="text-xs text-text-muted mt-1.5">
            Born {formatDate(member.dateOfBirth)}
            {member.dateOfDeath && ` - Died ${formatDate(member.dateOfDeath)}`}
          </p>
        )}
      </div>
    </Link>
  );
}
