import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Shield, Gavel, Lock, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { SearchResults } from '../../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({
    criminals: [],
    police: [],
    courtRecords: [],
    jails: [],
  });

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ criminals: [], police: [], courtRecords: [], jails: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ criminals: [], police: [], courtRecords: [], jails: [] });
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchGlobal(query.trim());
        setResults(data);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  if (!isOpen) return null;

  const totalResults =
    results.criminals.length +
    results.police.length +
    results.courtRecords.length +
    results.jails.length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-lg overflow-hidden">
          {/* Search Input Bar */}
          <div className="flex items-center px-3 border-b border-slate-200 dark:border-slate-800">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search criminal name/ID, officer, court room, jail..."
              className="w-full h-11 px-3 bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
            {loading ? (
              <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
            {!query.trim() && (
              <div className="py-8 text-center text-slate-400">
                Type an ID, name, or keyword to search across all tables
              </div>
            )}

            {query.trim() && !loading && totalResults === 0 && (
              <div className="py-8 text-center text-slate-500">
                No matching records found for "{query}"
              </div>
            )}

            {/* Criminals Group */}
            {results.criminals.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Users size={12} />
                  <span>Criminals ({results.criminals.length})</span>
                </div>
                {results.criminals.map((c) => (
                  <button
                    key={c.criminal_id}
                    onClick={() => handleSelect(`/criminals/${c.criminal_id}`)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-fast"
                  >
                    <div>
                      <span className="font-mono text-slate-500 mr-2">#{c.criminal_id}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      <span className="text-slate-400 ml-2">({c.crime})</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{c.investigation_status}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Police Group */}
            {results.police.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Shield size={12} />
                  <span>Police Officers ({results.police.length})</span>
                </div>
                {results.police.map((p) => (
                  <button
                    key={p.police_id}
                    onClick={() => handleSelect(`/police/${p.police_id}`)}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-fast"
                  >
                    <div>
                      <span className="font-mono text-slate-500 mr-2">#{p.police_id}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                      <span className="text-slate-400 ml-2">({p.rank}, {p.branch})</span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{p.number}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Court Records Group */}
            {results.courtRecords.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Gavel size={12} />
                  <span>Court Records ({results.courtRecords.length})</span>
                </div>
                {results.courtRecords.map((cr) => (
                  <button
                    key={cr.court_room_number}
                    onClick={() => handleSelect('/court-records')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-fast"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Court Room #{cr.court_room_number}
                      </span>
                      <span className="text-slate-500 ml-2">
                        Assigned: {cr.criminal_name} (#{cr.criminal_id})
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{cr.crime}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Jail Group */}
            {results.jails.length > 0 && (
              <div className="py-2">
                <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Lock size={12} />
                  <span>Jail Inmates ({results.jails.length})</span>
                </div>
                {results.jails.map((j) => (
                  <button
                    key={j.criminal_id}
                    onClick={() => handleSelect('/jail')}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-fast"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {j.location} (Barrack {j.barrack_number})
                      </span>
                      <span className="text-slate-500 ml-2">
                        Inmate: {j.criminal_name} (#{j.criminal_id})
                      </span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{j.sentence}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] text-slate-400">
            <span>Press ESC to exit</span>
            <span>Tab / Click to navigate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
