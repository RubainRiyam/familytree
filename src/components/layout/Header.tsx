import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMembers } from '@/hooks/useMembers';
import { Avatar } from '@/components/shared/Avatar';

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { currentMember, logout } = useAuth();
  const { members } = useMembers();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const searchResults = searchQuery.trim()
    ? members.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-hover transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-2 bg-surface-dim rounded-lg px-3 py-2 border border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search members..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              className="bg-transparent outline-none text-sm w-48 lg:w-64 text-text placeholder:text-text-muted"
            />
          </div>

          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-surface rounded-xl shadow-lg border border-border overflow-hidden z-50">
              {searchResults.map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    navigate(`/members/${m.id}`);
                    setSearchQuery('');
                    setShowResults(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover transition-colors text-left"
                >
                  <Avatar name={m.name} photoUrl={m.photoUrl} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-text">{m.name}</p>
                    <p className="text-xs text-text-muted capitalize">{m.gender}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div ref={profileRef} className="relative">
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="flex items-center gap-2 hover:bg-surface-hover rounded-lg px-2 py-1.5 transition-colors"
        >
          <Avatar name={currentMember?.name ?? 'User'} photoUrl={currentMember?.photoUrl} size="sm" />
          <span className="text-sm font-medium text-text hidden sm:block">
            {currentMember?.name ?? 'User'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-muted">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-xl shadow-lg border border-border overflow-hidden z-50">
            {currentMember && (
              <button
                onClick={() => {
                  navigate(`/members/${currentMember.id}`);
                  setShowProfile(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-text hover:bg-surface-hover transition-colors"
              >
                My Profile
              </button>
            )}
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-danger hover:bg-surface-hover transition-colors border-t border-border"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
