import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { getSiblings } from '@/store/memberStore';
import { Avatar } from '@/components/shared/Avatar';
import { Modal } from '@/components/shared/Modal';
import { formatDate, getAge } from '@/utils/dateFormat';
import { useState } from 'react';
import type { FamilyMember } from '@/types';

export function MemberDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, remove } = useMembers();
  const [showDelete, setShowDelete] = useState(false);

  const member = members.find(m => m.id === id);
  if (!member) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Member not found.</p>
        <Link to="/members" className="text-primary text-sm mt-2 inline-block">
          Back to Members
        </Link>
      </div>
    );
  }

  const father = members.find(m => m.id === member.fatherId);
  const mother = members.find(m => m.id === member.motherId);
  const spouse = members.find(m => m.id === member.spouseId);
  const children = members.filter(m => member.childrenIds.includes(m.id));
  const siblings = getSiblings(member.id);
  const age = member.dateOfBirth ? getAge(member.dateOfBirth, member.dateOfDeath) : null;

  function handleDelete() {
    if (!member) return;
    remove(member.id);
    navigate('/members');
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-surface rounded-2xl border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-primary/10 to-primary-light/10 px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar name={member.name} photoUrl={member.photoUrl} size="xl" />
          <div className="text-center sm:text-left flex-1">
            <h1 className="text-2xl font-bold text-text">{member.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 justify-center sm:justify-start">
              <GenderBadge gender={member.gender} />
              {age !== null && (
                <span className="text-sm text-text-secondary">
                  {member.dateOfDeath ? `Lived to ${age} years` : `${age} years old`}
                </span>
              )}
              {member.dateOfDeath && (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Deceased</span>
              )}
            </div>
            {member.bio && <p className="text-sm text-text-secondary mt-3">{member.bio}</p>}
          </div>
          <div className="flex gap-2">
            <Link
              to={`/tree/${member.id}`}
              className="px-3 py-1.5 bg-surface border border-border rounded-lg text-sm text-text hover:bg-surface-hover transition-colors"
            >
              View in Tree
            </Link>
            <Link
              to={`/members/${member.id}/edit`}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors"
            >
              Edit
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {(member.dateOfBirth || member.contactInfo.email || member.contactInfo.phone || member.contactInfo.address) && (
            <Section title="Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {member.dateOfBirth && (
                  <DetailItem label="Born" value={formatDate(member.dateOfBirth)} />
                )}
                {member.dateOfDeath && (
                  <DetailItem label="Died" value={formatDate(member.dateOfDeath)} />
                )}
                {member.contactInfo.email && (
                  <DetailItem label="Email" value={member.contactInfo.email} />
                )}
                {member.contactInfo.phone && (
                  <DetailItem label="Phone" value={member.contactInfo.phone} />
                )}
                {member.contactInfo.address && (
                  <DetailItem label="Address" value={member.contactInfo.address} />
                )}
              </div>
            </Section>
          )}

          <Section title="Family">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {father && <RelationCard member={father} relation="Father" />}
              {mother && <RelationCard member={mother} relation="Mother" />}
              {spouse && <RelationCard member={spouse} relation="Spouse" />}
              {siblings.map(s => (
                <RelationCard key={s.id} member={s} relation="Sibling" />
              ))}
              {children.map(c => (
                <RelationCard key={c.id} member={c} relation="Child" />
              ))}
              {!father && !mother && !spouse && children.length === 0 && siblings.length === 0 && (
                <p className="text-sm text-text-muted col-span-2">No family relationships added yet.</p>
              )}
            </div>
          </Section>

          <div className="pt-4 border-t border-border">
            <button
              onClick={() => setShowDelete(true)}
              className="text-sm text-danger hover:text-red-700 transition-colors"
            >
              Delete this member
            </button>
          </div>
        </div>
      </div>

      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="Delete Member">
        <p className="text-sm text-text-secondary mb-4">
          Are you sure you want to delete <strong>{member.name}</strong>? This will also remove all relationship references to this member.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setShowDelete(false)}
            className="px-4 py-2 text-sm font-medium text-text bg-surface-dim border border-border rounded-lg hover:bg-surface-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-danger rounded-lg hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">{title}</h2>
      {children}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-dim rounded-lg px-3 py-2.5">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-medium text-text">{value}</p>
    </div>
  );
}

function RelationCard({ member, relation }: { member: FamilyMember; relation: string }) {
  return (
    <Link
      to={`/members/${member.id}`}
      className="flex items-center gap-3 bg-surface-dim hover:bg-surface-hover rounded-lg px-3 py-2.5 transition-colors"
    >
      <Avatar name={member.name} photoUrl={member.photoUrl} size="sm" />
      <div>
        <p className="text-sm font-medium text-text">{member.name}</p>
        <p className="text-xs text-text-muted">{relation}</p>
      </div>
    </Link>
  );
}

function GenderBadge({ gender }: { gender: string }) {
  const styles: Record<string, string> = {
    male: 'bg-male border-male-border text-blue-700',
    female: 'bg-female border-female-border text-pink-700',
    other: 'bg-other border-other-border text-sky-700',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize border ${styles[gender] ?? styles.other}`}>
      {gender}
    </span>
  );
}
