import { useNavigate, useParams } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { computeTreeLayout } from '@/utils/treeLayout';
import { TreeCanvas } from './TreeCanvas';
import { EmptyState } from '@/components/shared/EmptyState';
import { Link } from 'react-router-dom';

export function TreePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members } = useMembers();

  if (members.length === 0) {
    return (
      <EmptyState
        icon="🌳"
        title="No family members yet"
        description="Add members to start visualizing your family tree."
        action={
          <Link
            to="/members/new"
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
          >
            Add First Member
          </Link>
        }
      />
    );
  }

  const { nodes, edges, width, height } = computeTreeLayout(members);

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-text">Family Tree</h1>
          <p className="text-sm text-text-muted">{members.length} members</p>
        </div>
        {id && (
          <button
            onClick={() => navigate('/tree')}
            className="px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
          >
            Show Full Tree
          </button>
        )}
      </div>

      <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden">
        <TreeCanvas
          nodes={nodes}
          edges={edges}
          width={width}
          height={height}
          highlightId={id}
          onNodeClick={memberId => navigate(`/members/${memberId}`)}
        />
      </div>
    </div>
  );
}
