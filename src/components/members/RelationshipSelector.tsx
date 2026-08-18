import { useState } from 'react';
import type { FamilyMember } from '@/types';
import { Avatar } from '@/components/shared/Avatar';

interface RelationshipSelectorProps {
  label: string;
  members: FamilyMember[];
  selectedId?: string;
  excludeId?: string;
  onChange: (id: string | undefined) => void;
}

export function RelationshipSelector({
  label,
  members,
  selectedId,
  excludeId,
  onChange,
}: RelationshipSelectorProps) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const selected = members.find(m => m.id === selectedId);
  const filtered = members
    .filter(m => m.id !== excludeId)
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {selected ? (
        <div className="flex items-center gap-2.5 bg-surface-dim border border-border rounded-lg px-3 py-2">
          <Avatar name={selected.name} photoUrl={selected.photoUrl} size="sm" />
          <span className="text-sm font-medium text-text flex-1">{selected.name}</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-text-muted hover:text-danger text-xs transition-colors"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder={`Search for ${label.toLowerCase()}...`}
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 200)}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
          {open && filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filtered.slice(0, 10).map(m => (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setSearch('');
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-surface-hover transition-colors text-left"
                >
                  <Avatar name={m.name} photoUrl={m.photoUrl} size="sm" />
                  <span className="text-sm text-text">{m.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
