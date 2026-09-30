import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, Shield, Gavel, Lock, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { SearchResults } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
      <div
        className="fixed inset-0 bg-[#141D27]/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="flex min-h-full items-start justify-center p-4 pt-16">
        <div className="relative w-full max-w-xl bg-[#F6F0E0] dark:bg-[#1E2024] border-2 border-[#D8D2C2] dark:border-[#383C45] rounded-xs shadow-2xl overflow-hidden">
          {/* Manila Docket Tab Header */}
          <div className="bg-[#EFE9DC] dark:bg-[#252830] px-4 py-2 border-b border-[#D8D2C2] dark:border-[#383C45] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#B08D3C]" />
              <span className="font-typewriter text-[11px] font-bold tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8] uppercase">
                Central Archives // Global Index Query
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#7A7A7A] uppercase">
              FORM CRB-IDX
            </span>
          </div>

          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-1.5 bg-[#FAF7F0] dark:bg-[#1A1C1F] border-b border-[#D8D2C2] dark:border-[#383C45]">
            <Search size={16} className="text-[#B08D3C] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search criminal alias/ID, officer, courtroom, jail barrack..."
              className="w-full h-11 px-3 bg-transparent font-typewriter text-xs sm:text-sm text-[#1F1F1F] dark:text-[#E2DFD8] placeholder:text-[#A09D95] focus:outline-none"
            />
            {loading ? (
              <Loader2 size={16} className="animate-spin text-[#B08D3C] shrink-0" />
            ) : query ? (
              <button
                onClick={() => setQuery('')}
                className="text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white p-1"
                title="Clear query"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-3 text-xs space-y-3">
            {!query.trim() && (
              <div className="py-10 text-center font-typewriter text-xs text-[#7A7A7A] space-y-1">
                <p className="font-semibold text-[#1F1F1F] dark:text-[#E2DFD8]">
                  CENTRAL ARCHIVAL SEARCH READY
                </p>
                <p className="text-[11px]">
                  Enter criminal ID or name, officer badge, court docket number, or detention facility.
                </p>
              </div>
            )}

            {query.trim() && !loading && totalResults === 0 && (
              <div className="py-8 text-center font-typewriter space-y-2">
                <div className="inline-block px-3 py-1 border border-dashed border-[#B3261E] text-[#B3261E] text-xs font-bold uppercase tracking-wider rounded-xs">
                  NO MATCHING DOSSIERS FOUND
                </div>
                <p className="text-[11px] text-[#7A7A7A]">
                  No records match "{query}". Verify spelling or file ID.
                </p>
              </div>
            )}

            {/* Criminals Group */}
            {results.criminals.length > 0 && (
              <div className="bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-2">
                <div className="flex items-center gap-1.5 px-2 pb-2 text-[10px] font-typewriter font-bold text-[#7A7A7A] dark:text-[#A09D95] uppercase tracking-wider border-b border-[#EFE9DC] dark:border-[#2E323B]">
                  <Users size={12} className="text-[#B3261E]" />
                  <span>Criminal Dossiers ({results.criminals.length})</span>
                </div>
                <div className="divide-y divide-[#EFE9DC] dark:divide-[#2E323B] mt-1">
                  {results.criminals.map((c) => (
                    <button
                      key={c.criminal_id}
                      onClick={() => handleSelect(`/criminals/${c.criminal_id}`)}
                      className="w-full text-left px-2.5 py-2 hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] flex items-center justify-between transition-fast rounded-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-[#B08D3C]">
                          #{c.criminal_id}
                        </span>
                        <span className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#E2DFD8] group-hover:text-[#B3261E] transition-fast">
                          {c.name}
                        </span>
                        <span className="text-[11px] text-[#6B685F] dark:text-[#A09D95]">
                          — {c.crime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.investigation_status} size="sm" />
                        <ArrowRight size={12} className="text-[#7A7A7A] opacity-0 group-hover:opacity-100 transition-fast" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Police Group */}
            {results.police.length > 0 && (
              <div className="bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-2">
                <div className="flex items-center gap-1.5 px-2 pb-2 text-[10px] font-typewriter font-bold text-[#7A7A7A] dark:text-[#A09D95] uppercase tracking-wider border-b border-[#EFE9DC] dark:border-[#2E323B]">
                  <Shield size={12} className="text-[#1F2D3D] dark:text-[#8C9AA8]" />
                  <span>Investigating Officers ({results.police.length})</span>
                </div>
                <div className="divide-y divide-[#EFE9DC] dark:divide-[#2E323B] mt-1">
                  {results.police.map((p) => (
                    <button
                      key={p.police_id}
                      onClick={() => handleSelect(`/police/${p.police_id}`)}
                      className="w-full text-left px-2.5 py-2 hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] flex items-center justify-between transition-fast rounded-xs group"
                    >
                      <div>
                        <span className="font-mono text-[11px] font-bold text-[#1F2D3D] dark:text-[#8C9AA8] mr-2">
                          Badge #{p.police_id}
                        </span>
                        <span className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#E2DFD8]">
                          {p.name}
                        </span>
                        <span className="text-[11px] text-[#6B685F] dark:text-[#A09D95] ml-2">
                          ({p.rank}, {p.branch})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#7A7A7A]">{p.number}</span>
                        <ArrowRight size={12} className="text-[#7A7A7A] opacity-0 group-hover:opacity-100 transition-fast" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Court Records Group */}
            {results.courtRecords.length > 0 && (
              <div className="bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-2">
                <div className="flex items-center gap-1.5 px-2 pb-2 text-[10px] font-typewriter font-bold text-[#7A7A7A] dark:text-[#A09D95] uppercase tracking-wider border-b border-[#EFE9DC] dark:border-[#2E323B]">
                  <Gavel size={12} className="text-[#B08D3C]" />
                  <span>Judicial Dockets ({results.courtRecords.length})</span>
                </div>
                <div className="divide-y divide-[#EFE9DC] dark:divide-[#2E323B] mt-1">
                  {results.courtRecords.map((cr) => (
                    <button
                      key={cr.court_room_number}
                      onClick={() => handleSelect('/court-records')}
                      className="w-full text-left px-2.5 py-2 hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] flex items-center justify-between transition-fast rounded-xs group"
                    >
                      <div>
                        <span className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#E2DFD8]">
                          Courtroom #{cr.court_room_number}
                        </span>
                        <span className="text-[11px] text-[#6B685F] dark:text-[#A09D95] ml-2">
                          Defendant: {cr.criminal_name} (#{cr.criminal_id})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-[#7A7A7A]">{cr.crime}</span>
                        <ArrowRight size={12} className="text-[#7A7A7A] opacity-0 group-hover:opacity-100 transition-fast" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Jail Group */}
            {results.jails.length > 0 && (
              <div className="bg-[#FAF7F0] dark:bg-[#252830] border border-[#D8D2C2] dark:border-[#383C45] rounded-xs p-2">
                <div className="flex items-center gap-1.5 px-2 pb-2 text-[10px] font-typewriter font-bold text-[#7A7A7A] dark:text-[#A09D95] uppercase tracking-wider border-b border-[#EFE9DC] dark:border-[#2E323B]">
                  <Lock size={12} className="text-[#B3261E]" />
                  <span>Detention Facilities & Inmates ({results.jails.length})</span>
                </div>
                <div className="divide-y divide-[#EFE9DC] dark:divide-[#2E323B] mt-1">
                  {results.jails.map((j) => (
                    <button
                      key={j.criminal_id}
                      onClick={() => handleSelect('/jail')}
                      className="w-full text-left px-2.5 py-2 hover:bg-[#EFE9DC] dark:hover:bg-[#2C303A] flex items-center justify-between transition-fast rounded-xs group"
                    >
                      <div>
                        <span className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#E2DFD8]">
                          {j.location} (Barrack {j.barrack_number})
                        </span>
                        <span className="text-[11px] text-[#6B685F] dark:text-[#A09D95] ml-2">
                          Inmate: {j.criminal_name} (#{j.criminal_id})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-[#B3261E] font-semibold">{j.sentence}</span>
                        <ArrowRight size={12} className="text-[#7A7A7A] opacity-0 group-hover:opacity-100 transition-fast" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-[#D8D2C2] dark:border-[#383C45] bg-[#EFE9DC] dark:bg-[#252830] font-mono text-[10px] text-[#7A7A7A]">
            <div className="flex items-center gap-3">
              <span>[ESC] CLOSE</span>
              <span>[CLICK] OPEN DOSSIER</span>
            </div>
            <span className="font-typewriter text-[9px] uppercase tracking-wider text-[#B08D3C]">
              OFFICIAL CENTRAL ARCHIVE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
