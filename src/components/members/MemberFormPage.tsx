import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMembers } from '@/hooks/useMembers';
import { getMemberById } from '@/store/memberStore';
import { RelationshipSelector } from './RelationshipSelector';
import { validateRequired, validateEmail, validatePassword } from '@/utils/validation';
import type { FamilyMember } from '@/types';

export function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { members, create, update } = useMembers();
  const isEdit = Boolean(id);

  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [dateOfDeath, setDateOfDeath] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [photoUrl, setPhotoUrl] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [fatherId, setFatherId] = useState<string | undefined>();
  const [motherId, setMotherId] = useState<string | undefined>();
  const [spouseId, setSpouseId] = useState<string | undefined>();
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      const member = getMemberById(id);
      if (member) {
        setName(member.name);
        setDateOfBirth(member.dateOfBirth);
        setDateOfDeath(member.dateOfDeath ?? '');
        setGender(member.gender);
        setPhotoUrl(member.photoUrl ?? '');
        setBio(member.bio ?? '');
        setEmail(member.contactInfo.email ?? '');
        setPhone(member.contactInfo.phone ?? '');
        setAddress(member.contactInfo.address ?? '');
        setFatherId(member.fatherId);
        setMotherId(member.motherId);
        setSpouseId(member.spouseId);
        setAuthEmail(member.auth?.email ?? '');
      }
    }
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const nameErr = validateRequired(name, 'Name');
    if (nameErr) { setError(nameErr); return; }

    const memberData: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt' | 'childrenIds'> = {
      name: name.trim(),
      dateOfBirth,
      dateOfDeath: dateOfDeath || undefined,
      gender,
      photoUrl: photoUrl || undefined,
      bio: bio || undefined,
      contactInfo: {
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      },
      fatherId,
      motherId,
      spouseId,
    };

    if (authEmail && !isEdit) {
      const emailErr = validateEmail(authEmail);
      const passErr = validatePassword(authPassword);
      if (emailErr || passErr) { setError(emailErr ?? passErr ?? ''); return; }

      const encoder = new TextEncoder();
      const data = encoder.encode(authPassword);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      memberData.auth = { email: authEmail, passwordHash };
    }

    if (isEdit && id) {
      update(id, memberData);
      navigate(`/members/${id}`);
    } else {
      const newMember = create(memberData);
      navigate(`/members/${newMember.id}`);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text mb-6">
        {isEdit ? 'Edit Member' : 'Add New Member'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-surface rounded-2xl border border-border p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-danger text-sm px-4 py-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Personal Info</h2>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Gender *</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as 'male' | 'female' | 'other')}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Photo URL</label>
              <input
                type="url"
                value={photoUrl}
                onChange={e => setPhotoUrl(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Date of Death</label>
              <input
                type="date"
                value={dateOfDeath}
                onChange={e => setDateOfDeath(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="A short bio..."
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Contact Info</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Relationships</h2>
          <RelationshipSelector
            label="Father"
            members={members.filter(m => m.gender === 'male')}
            selectedId={fatherId}
            excludeId={id}
            onChange={setFatherId}
          />
          <RelationshipSelector
            label="Mother"
            members={members.filter(m => m.gender === 'female')}
            selectedId={motherId}
            excludeId={id}
            onChange={setMotherId}
          />
          <RelationshipSelector
            label="Spouse"
            members={members}
            selectedId={spouseId}
            excludeId={id}
            onChange={setSpouseId}
          />
        </div>

        {!isEdit && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide">Login Credentials (Optional)</h2>
            <p className="text-xs text-text-muted">Give this member their own login to view and edit the tree.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Login Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg text-sm transition-colors"
          >
            {isEdit ? 'Save Changes' : 'Add Member'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-surface-dim hover:bg-surface-hover text-text font-medium rounded-lg text-sm transition-colors border border-border"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
