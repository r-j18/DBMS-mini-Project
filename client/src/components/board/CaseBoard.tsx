import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  ExternalLink,
  X,
  Shield,
  Gavel,
  Lock,
  User,
  Info,
} from 'lucide-react';
import { Criminal, Police } from '../../types';
import { PushPin } from '../common/PushPin';
import { Stamp } from '../common/Stamp';
import { EvidenceTag } from '../common/EvidenceTag';

interface NodePosition {
  x: number;
  y: number;
}

interface CaseBoardProps {
  criminals: Criminal[];
  officers: Police[];
  loading?: boolean;
}

export const CaseBoard: React.FC<CaseBoardProps> = ({
  criminals,
  officers,
  loading = false,
}) => {
  const navigate = useNavigate();

  // Board Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Filters State
  const [filterOfficer, setFilterOfficer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJail, setFilterJail] = useState('');

  // Selected Criminal for Chain Highlighting & Side Panel
  const [selectedCriminalId, setSelectedCriminalId] = useState<number | null>(null);

  // Positions of all pinned cards: key -> { x, y }
  // Key format: "off-{id}", "crm-{id}", "crt-{id}", "jl-{id}"
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize or compute auto-layout
  const computeAutoLayout = (cList: Criminal[], oList: Police[]) => {
    const posMap: Record<string, NodePosition> = {};
    let currentY = 60;

    oList.forEach((officer) => {
      const assignedCriminals = cList.filter(
        (c) => c.investigating_officer === officer.police_id
      );

      // Officer Pin Position (Left column)
      posMap[`off-${officer.police_id}`] = { x: 80, y: currentY + 30 };

      if (assignedCriminals.length === 0) {
        currentY += 210;
        return;
      }

      // Arrange assigned criminals in rows to the right of officer
      assignedCriminals.forEach((crm, idx) => {
        const crmX = 400 + (idx % 2) * 520;
        const rowOffset = Math.floor(idx / 2) * 230;
        const crmY = currentY + rowOffset;

        posMap[`crm-${crm.criminal_id}`] = { x: crmX, y: crmY };
        // Court Note Position (Pinned top-right of criminal)
        posMap[`crt-${crm.criminal_id}`] = { x: crmX + 220, y: crmY - 15 };
        // Jail Tag Position (Pinned bottom-right of criminal)
        posMap[`jl-${crm.criminal_id}`] = { x: crmX + 220, y: crmY + 95 };
      });

      const rowsCount = Math.max(1, Math.ceil(assignedCriminals.length / 2));
      currentY += rowsCount * 240 + 40;
    });

    return posMap;
  };

  // Load positions from localStorage or compute layout
  useEffect(() => {
    if (criminals.length === 0 && officers.length === 0) return;

    try {
      const saved = localStorage.getItem('crm_case_board_positions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Object.keys(parsed).length > 0) {
          setPositions(parsed);
          return;
        }
      }
    } catch {
      // Fallback to auto
    }

    const initialPos = computeAutoLayout(criminals, officers);
    setPositions(initialPos);
  }, [criminals, officers]);

  const savePositions = (updated: Record<string, NodePosition>) => {
    setPositions(updated);
    try {
      localStorage.setItem('crm_case_board_positions', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save board positions:', e);
    }
  };

  const handleResetLayout = () => {
    const layout = computeAutoLayout(criminals, officers);
    savePositions(layout);
    setPan({ x: 40, y: 40 });
    setScale(1);
    setSelectedCriminalId(null);
  };

  // Filtered lists
  const visibleCriminals = useMemo(() => {
    return criminals.filter((c) => {
      if (filterOfficer && String(c.investigating_officer) !== filterOfficer) return false;
      if (filterStatus && c.investigation_status !== filterStatus) return false;
      if (filterJail && c.jail_location !== filterJail) return false;
      return true;
    });
  }, [criminals, filterOfficer, filterStatus, filterJail]);

  const visibleOfficers = useMemo(() => {
    if (!filterOfficer) return officers;
    return officers.filter((o) => String(o.police_id) === filterOfficer);
  }, [officers, filterOfficer]);

  // Selected criminal details for inspector drawer
  const selectedCriminal = useMemo(() => {
    return criminals.find((c) => c.criminal_id === selectedCriminalId) || null;
  }, [criminals, selectedCriminalId]);

  const selectedOfficer = useMemo(() => {
    if (!selectedCriminal) return null;
    return officers.find((o) => o.police_id === selectedCriminal.investigating_officer) || null;
  }, [officers, selectedCriminal]);

  // Pan Board Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if background was clicked
    if ((e.target as HTMLElement).closest('.board-node')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsPanning(false);

  // Zoom on wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(1.8, Math.max(0.45, prev * zoomFactor)));
  };

  // Dragging a specific card
  const handleDragNode = (nodeKey: string, dx: number, dy: number) => {
    setPositions((prev) => {
      const current = prev[nodeKey] || { x: 100, y: 100 };
      return {
        ...prev,
        [nodeKey]: {
          x: current.x + dx,
          y: current.y + dy,
        },
      };
    });
  };

  const handleDragEnd = () => {
    savePositions(positions);
  };

  // Generates curved connecting red string path
  const makeStringPath = (x1: number, y1: number, x2: number, y2: number) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.hypot(dx, dy);
    // Gravity sag: downward curve
    const sag = Math.min(32, Math.max(12, dist * 0.12));
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 + sag;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[640px] flex flex-col rounded-lg border-8 border-[#6b4226] shadow-2xl overflow-hidden select-none">
      {/* Wooden Frame & Toolbar Header */}
      <div className="bg-[#1F2D3D] text-[#EFE9DC] px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b-4 border-[#52321c] z-20 shadow-md">
        <div className="flex items-center gap-2">
          <PushPin color="red" size={20} />
          <h2 className="font-typewriter text-xs sm:text-sm font-bold tracking-wider text-[#F6F0E0] uppercase">
            BUREAU INCIDENT NET • INVESTIGATION BOARD
          </h2>
          <span className="font-mono text-[10px] text-[#B08D3C] hidden sm:inline">
            [INTERACTIVE EVIDENCE GRAPH]
          </span>
        </div>

        {/* Board Filters & Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Officer Filter */}
          <select
            value={filterOfficer}
            onChange={(e) => setFilterOfficer(e.target.value)}
            className="h-7 px-2 bg-[#141D27] border border-[#2B3D52] rounded text-[#EFE9DC] font-typewriter text-[11px] focus:outline-none"
          >
            <option value="">Officer: All</option>
            {officers.map((o) => (
              <option key={o.police_id} value={o.police_id}>
                {o.rank} {o.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-7 px-2 bg-[#141D27] border border-[#2B3D52] rounded text-[#EFE9DC] font-typewriter text-[11px] focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="Open">Open</option>
            <option value="Under Investigation">Under Investigation</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Reset Layout Button */}
          <button
            onClick={handleResetLayout}
            className="h-7 px-2.5 flex items-center gap-1 font-typewriter text-[11px] bg-[#26374A] hover:bg-[#2B3D52] text-[#F6F0E0] rounded border border-[#2B3D52] transition-fast"
            title="Auto-arrange cards into clean investigation rows"
          >
            <RotateCcw size={12} />
            <span>Reset Grid</span>
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#141D27] rounded border border-[#2B3D52] overflow-hidden">
            <button
              onClick={() => setScale((s) => Math.max(0.45, s - 0.15))}
              className="p-1 text-[#C9D1D9] hover:bg-[#2B3D52]"
              title="Zoom out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="font-mono text-[10px] px-1.5 text-[#B08D3C]">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.8, s + 0.15))}
              className="p-1 text-[#C9D1D9] hover:bg-[#2B3D52]"
              title="Zoom in"
            >
              <ZoomIn size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Corkboard Surface */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className={`flex-1 corkboard-bg relative overflow-hidden ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Transformable Canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0 w-[5000px] h-[5000px] pointer-events-auto"
        >
          {/* SVG Strings Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <filter id="stringShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.4)" />
              </filter>
            </defs>

            {/* Connecting Strings */}
            {visibleCriminals.map((crm) => {
              const crmPos = positions[`crm-${crm.criminal_id}`];
              const offPos = positions[`off-${crm.investigating_officer}`];
              const crtPos = positions[`crt-${crm.criminal_id}`];
              const jlPos = positions[`jl-${crm.criminal_id}`];

              if (!crmPos) return null;

              // Dim non-selected chains if any criminal is selected
              const isChainActive =
                selectedCriminalId === null || selectedCriminalId === crm.criminal_id;
              const stringOpacity = isChainActive ? 0.95 : 0.12;
              const stringWidth = isChainActive ? (selectedCriminalId === crm.criminal_id ? 3 : 2.2) : 1.2;

              // String 1: Officer Pin (center of officer card) -> Criminal Pin (top-center of polaroid)
              const offPinX = (offPos?.x || 100) + 110;
              const offPinY = (offPos?.y || 100) + 12;
              const crmPinX = crmPos.x + 95;
              const crmPinY = crmPos.y + 12;

              // String 2: Criminal Pin -> Court Note Pin
              const crtPinX = (crtPos?.x || crmPos.x + 220) + 70;
              const crtPinY = (crtPos?.y || crmPos.y) + 10;

              // String 3: Criminal Pin -> Jail Tag Pin
              const jlPinX = (jlPos?.x || crmPos.x + 220) + 75;
              const jlPinY = (jlPos?.y || crmPos.y + 100) + 10;

              return (
                <g key={`strings-${crm.criminal_id}`} style={{ opacity: stringOpacity }}>
                  {/* Officer to Criminal string */}
                  {offPos && (
                    <path
                      d={makeStringPath(offPinX, offPinY, crmPinX, crmPinY)}
                      fill="none"
                      stroke="#B3261E"
                      strokeWidth={stringWidth}
                      strokeLinecap="round"
                      filter="url(#stringShadow)"
                    />
                  )}

                  {/* Criminal to Court string */}
                  {crtPos && (
                    <path
                      d={makeStringPath(crmPinX, crmPinY, crtPinX, crtPinY)}
                      fill="none"
                      stroke="#B3261E"
                      strokeWidth={stringWidth}
                      strokeLinecap="round"
                      strokeDasharray={crm.court_room_number ? undefined : '4 3'}
                      filter="url(#stringShadow)"
                    />
                  )}

                  {/* Criminal to Jail string */}
                  {jlPos && (
                    <path
                      d={makeStringPath(crmPinX, crmPinY, jlPinX, jlPinY)}
                      fill="none"
                      stroke="#B3261E"
                      strokeWidth={stringWidth}
                      strokeLinecap="round"
                      strokeDasharray={crm.jail_location ? undefined : '4 3'}
                      filter="url(#stringShadow)"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Cards Layer */}
          <div className="absolute inset-0 z-20">
            {/* 1. Investigating Officers Cards */}
            {visibleOfficers.map((off) => {
              const pos = positions[`off-${off.police_id}`] || { x: 80, y: 100 };
              const isAssigned = criminals.some(
                (c) => c.investigating_officer === off.police_id
              );

              return (
                <motion.div
                  key={`off-${off.police_id}`}
                  drag
                  dragMomentum={false}
                  onDrag={(_, info) =>
                    handleDragNode(`off-${off.police_id}`, info.delta.x, info.delta.y)
                  }
                  onDragEnd={handleDragEnd}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    position: 'absolute',
                  }}
                  className="board-node w-56 bg-[#1F2D3D] text-[#EFE9DC] border-2 border-[#B08D3C] rounded-sm p-3 shadow-folder cursor-move select-none"
                >
                  {/* Push Pin on Top Header */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="brass" size={24} />
                  </div>

                  <div className="pt-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[#B08D3C]">
                      <Shield size={14} />
                      <span className="font-typewriter text-[10px] tracking-widest font-bold uppercase">
                        OFFICER IN CHARGE
                      </span>
                    </div>

                    <h4 className="font-typewriter font-bold text-sm text-[#F6F0E0] mt-1">
                      {off.rank} {off.name}
                    </h4>

                    <div className="text-[11px] font-mono text-[#8C9AA8] mt-0.5">
                      Badge #{off.police_id} • {off.branch}
                    </div>

                    <div className="mt-2 pt-2 border-t border-[#2B3D52] flex items-center justify-between text-[10px] font-mono text-[#EFE9DC]">
                      <span>Caseload:</span>
                      <span className="font-bold text-[#B08D3C]">
                        {off.case_count || (isAssigned ? 'Active' : '0 Cases')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 2. Criminal Polaroid Cards */}
            {visibleCriminals.map((crm) => {
              const pos = positions[`crm-${crm.criminal_id}`] || { x: 380, y: 100 };
              const isSelected = selectedCriminalId === crm.criminal_id;
              const isDimmed = selectedCriminalId !== null && !isSelected;

              // Criminal Initials
              const initials = crm.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase();

              return (
                <motion.div
                  key={`crm-${crm.criminal_id}`}
                  drag
                  dragMomentum={false}
                  onDrag={(_, info) =>
                    handleDragNode(`crm-${crm.criminal_id}`, info.delta.x, info.delta.y)
                  }
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCriminalId((prev) =>
                      prev === crm.criminal_id ? null : crm.criminal_id
                    );
                  }}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    position: 'absolute',
                  }}
                  animate={{
                    opacity: isDimmed ? 0.3 : 1,
                    scale: isSelected ? 1.04 : 1,
                  }}
                  transition={{ duration: 0.15 }}
                  className={`board-node w-52 bg-[#F6F0E0] dark:bg-[#20242C] border-2 ${
                    isSelected
                      ? 'border-[#B3261E] ring-4 ring-[#B3261E]/30'
                      : 'border-[#D9D0BE] dark:border-[#3A3F4D]'
                  } rounded-xs p-3 shadow-folder cursor-move select-none`}
                >
                  {/* Push Pin on Top */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="red" size={24} />
                  </div>

                  {/* Polaroid Frame with Silhouette & Height Chart */}
                  <div className="pt-2">
                    <div className="relative w-full h-28 bg-[#E6DFCD] dark:bg-[#15171B] border border-[#C5BBA6] dark:border-[#2C303A] rounded-xs overflow-hidden flex items-end justify-center">
                      {/* Height ruler lines */}
                      <div className="absolute left-0 top-0 bottom-0 w-8 border-r border-[#C5BBA6] dark:border-[#2C303A] flex flex-col justify-between py-1 text-[8px] font-mono text-[#8C7E68] select-none pl-1">
                        <span>6'0"</span>
                        <span>5'9"</span>
                        <span>5'6"</span>
                        <span>5'3"</span>
                        <span>5'0"</span>
                      </div>

                      {/* Silhouette Graphic */}
                      <svg width="70" height="85" viewBox="0 0 60 70" fill="#3A3833">
                        <circle cx="30" cy="22" r="14" />
                        <path d="M10 65 C10 42 20 38 30 38 C40 38 50 42 50 65 Z" />
                      </svg>

                      {/* Offender Initials */}
                      <span className="absolute bottom-1 right-2 font-typewriter font-bold text-xs text-[#8C7E68]">
                        {initials}
                      </span>
                    </div>

                    {/* Offender Metadata */}
                    <div className="mt-2 text-center">
                      <div className="font-mono text-[10px] text-[#B3261E] font-bold">
                        FILE #{crm.criminal_id}
                      </div>
                      <h4 className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#F6F0E0] truncate">
                        {crm.name}
                      </h4>
                      <div className="text-[11px] font-medium text-[#4B4B4B] dark:text-[#A09D95]">
                        {crm.crime} • Age {crm.age}
                      </div>

                      <div className="mt-2">
                        <Stamp
                          text={crm.investigation_status}
                          size="sm"
                          animateSlam={false}
                          rotateDeg={-1}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 3. Judicial Court Room Sticky Notes */}
            {visibleCriminals.map((crm) => {
              const pos = positions[`crt-${crm.criminal_id}`] || {
                x: (positions[`crm-${crm.criminal_id}`]?.x || 380) + 220,
                y: (positions[`crm-${crm.criminal_id}`]?.y || 100) - 15,
              };
              const isSelected = selectedCriminalId === crm.criminal_id;
              const isDimmed = selectedCriminalId !== null && !isSelected;

              return (
                <motion.div
                  key={`crt-${crm.criminal_id}`}
                  drag
                  dragMomentum={false}
                  onDrag={(_, info) =>
                    handleDragNode(`crt-${crm.criminal_id}`, info.delta.x, info.delta.y)
                  }
                  onDragEnd={handleDragEnd}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    position: 'absolute',
                  }}
                  animate={{ opacity: isDimmed ? 0.3 : 1 }}
                  className={`board-node w-40 p-2.5 shadow-md cursor-move select-none ${
                    crm.court_room_number
                      ? 'bg-[#FEF08A] text-[#713F12] border border-[#FACC15] rotate-1'
                      : 'bg-transparent text-slate-400 border-2 border-dashed border-[#D9D0BE] dark:border-slate-700'
                  }`}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="silver" size={18} />
                  </div>

                  <div className="pt-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-typewriter font-bold uppercase tracking-wider">
                      <Gavel size={11} />
                      <span>COURT DOCKET</span>
                    </div>

                    {crm.court_room_number ? (
                      <div className="mt-1 font-typewriter font-bold text-xs">
                        Court Room #{crm.court_room_number}
                        <span className="block text-[9px] font-mono text-[#854D0E] font-normal">
                          Trial Proceedings
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 font-typewriter text-[10px] text-slate-400 italic">
                        [No court record]
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {/* 4. Jail Sentencing Tags */}
            {visibleCriminals.map((crm) => {
              const pos = positions[`jl-${crm.criminal_id}`] || {
                x: (positions[`crm-${crm.criminal_id}`]?.x || 380) + 220,
                y: (positions[`crm-${crm.criminal_id}`]?.y || 100) + 95,
              };
              const isSelected = selectedCriminalId === crm.criminal_id;
              const isDimmed = selectedCriminalId !== null && !isSelected;

              return (
                <motion.div
                  key={`jl-${crm.criminal_id}`}
                  drag
                  dragMomentum={false}
                  onDrag={(_, info) =>
                    handleDragNode(`jl-${crm.criminal_id}`, info.delta.x, info.delta.y)
                  }
                  onDragEnd={handleDragEnd}
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    position: 'absolute',
                  }}
                  animate={{ opacity: isDimmed ? 0.3 : 1 }}
                  className={`board-node w-44 p-2.5 shadow-md cursor-move select-none ${
                    crm.jail_location
                      ? 'bg-[#F3F4F6] text-[#1F2937] border border-[#D1D5DB] -rotate-1'
                      : 'bg-transparent text-slate-400 border-2 border-dashed border-[#D9D0BE] dark:border-slate-700'
                  }`}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="silver" size={18} />
                  </div>

                  <div className="pt-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-typewriter font-bold uppercase tracking-wider text-[#4B5563]">
                      <Lock size={11} />
                      <span>INCARCERATION</span>
                    </div>

                    {crm.jail_location ? (
                      <div className="mt-0.5 text-xs">
                        <div className="font-typewriter font-bold truncate">
                          {crm.jail_location}
                        </div>
                        <div className="text-[10px] font-mono text-[#6B7280]">
                          Barrack {crm.barrack_number} • {crm.sentence}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 font-typewriter text-[10px] text-slate-400 italic">
                        [Not incarcerated]
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Slide-out Case Detail Inspector Side Panel */}
      <AnimatePresence>
        {selectedCriminal && (
          <motion.div
            initial={{ x: 340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 340, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-12 right-0 bottom-0 w-80 bg-[#F6F0E0] dark:bg-[#1A1C20] border-l-4 border-[#B08D3C] shadow-2xl z-30 flex flex-col p-4 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-2 border-b border-[#D9D0BE] dark:border-[#2E323B]">
              <div>
                <span className="font-mono text-xs text-[#B3261E] font-bold">
                  EVIDENCE DOSSIER #{selectedCriminal.criminal_id}
                </span>
                <h3 className="font-typewriter font-bold text-base text-[#1F1F1F] dark:text-[#E2DFD8]">
                  {selectedCriminal.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCriminalId(null)}
                className="p-1 rounded text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Details */}
            <div className="space-y-4 my-4 text-xs">
              <div>
                <span className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-wider block">
                  Offender Particulars
                </span>
                <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] space-y-1 mt-1">
                  <div>Crime: <strong>{selectedCriminal.crime}</strong></div>
                  <div>Age: <strong>{selectedCriminal.age} years</strong></div>
                  <div className="pt-1">
                    <Stamp text={selectedCriminal.investigation_status} size="sm" />
                  </div>
                </div>
              </div>

              {/* Officer */}
              <div>
                <span className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-wider block">
                  Assigned Officer
                </span>
                <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] mt-1">
                  <div className="font-bold">
                    {selectedOfficer?.rank} {selectedOfficer?.name}
                  </div>
                  <div className="text-[11px] text-[#7A7A7A]">
                    {selectedOfficer?.branch} • Badge #{selectedOfficer?.police_id}
                  </div>
                </div>
              </div>

              {/* Court Room */}
              <div>
                <span className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-wider block">
                  Judicial Docket
                </span>
                <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] mt-1">
                  {selectedCriminal.court_room_number ? (
                    <div className="font-bold text-[#854D0E]">
                      Court Room #{selectedCriminal.court_room_number}
                    </div>
                  ) : (
                    <span className="text-[#7A7A7A] italic">No court assignment recorded</span>
                  )}
                </div>
              </div>

              {/* Jail */}
              <div>
                <span className="font-typewriter text-[10px] text-[#B08D3C] uppercase tracking-wider block">
                  Incarceration
                </span>
                <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] mt-1">
                  {selectedCriminal.jail_location ? (
                    <div>
                      <div className="font-bold">{selectedCriminal.jail_location}</div>
                      <div className="text-[11px] text-[#7A7A7A]">
                        Barrack {selectedCriminal.barrack_number} • {selectedCriminal.sentence}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#7A7A7A] italic">Not incarcerated</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action button: Full Dossier */}
            <div className="mt-auto pt-3 border-t border-[#D9D0BE] dark:border-[#2E323B]">
              <button
                onClick={() => navigate(`/criminals/${selectedCriminal.criminal_id}`)}
                className="w-full py-2 px-3 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 transition-fast shadow-paper"
              >
                <span>OPEN FULL DOSSIER</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
