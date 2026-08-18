import type { TreeNodeData } from '@/types';
import { getYear } from '@/utils/dateFormat';

interface TreeNodeProps {
  node: TreeNodeData;
  isHighlighted: boolean;
  onClick: (id: string) => void;
}

const genderColors: Record<string, { bg: string; border: string; text: string }> = {
  male: { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  female: { bg: '#fce7f3', border: '#f9a8d4', text: '#9d174d' },
  other: { bg: '#e0f2fe', border: '#7dd3fc', text: '#0c4a6e' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TreeNode({ node, isHighlighted, onClick }: TreeNodeProps) {
  const { member, x, y, width, height } = node;
  const colors = genderColors[member.gender] ?? genderColors.other;
  const birthYear = getYear(member.dateOfBirth);
  const deathYear = member.dateOfDeath ? getYear(member.dateOfDeath) : '';
  const years = birthYear ? (deathYear ? `${birthYear} - ${deathYear}` : `b. ${birthYear}`) : '';

  return (
    <g
      onClick={() => onClick(member.id)}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill={colors.bg}
        stroke={isHighlighted ? '#6366f1' : colors.border}
        strokeWidth={isHighlighted ? 2.5 : 1.5}
        filter={isHighlighted ? 'drop-shadow(0 4px 8px rgba(99,102,241,0.25))' : undefined}
      />
      <circle
        cx={x + 28}
        cy={y + height / 2}
        r={16}
        fill="white"
        stroke={colors.border}
        strokeWidth={1}
      />
      <text
        x={x + 28}
        y={y + height / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fontWeight={600}
        fill={colors.text}
        fontFamily="Inter, system-ui, sans-serif"
      >
        {getInitials(member.name)}
      </text>
      <text
        x={x + 52}
        y={y + height / 2 - 8}
        fontSize={13}
        fontWeight={600}
        fill="#0f172a"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {member.name.length > 14 ? member.name.slice(0, 13) + '...' : member.name}
      </text>
      {years && (
        <text
          x={x + 52}
          y={y + height / 2 + 10}
          fontSize={10}
          fill="#64748b"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {years}
        </text>
      )}
    </g>
  );
}
