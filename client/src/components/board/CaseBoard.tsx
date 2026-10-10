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
} from 'lucide-react';
import { Criminal, Police } from '../../types';
import { api } from '../../services/api';
import { PushPin } from '../common/PushPin';
import { Stamp } from '../common/Stamp';
import { useResponsive } from '../../hooks/useResponsive';

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
}) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  // Board Zoom and Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // Touch Pointer Tracking for Pan & Pinch-Zoom
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const initialPinchDist = useRef<number | null>(null);
  const initialPinchScale = useRef<number>(1);

  // Filters State
  const [filterOfficer, setFilterOfficer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);

  // Selected Criminal for Chain Highlighting & Side/Bottom Panel
  const [selectedCriminalId, setSelectedCriminalId] = useState<number | null>(null);

  // Positions of all pinned cards: key -> { x, y }
  const [positions, setPositions] = useState<Record<string, NodePosition>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-layout computation
  const computeAutoLayout = (cList: Criminal[], oList: Police[]) => {
    const posMap: Record<string, NodePosition> = {};
    let currentY = 50;

    oList.forEach((officer) => {
      const assignedCriminals = cList.filter(
        (c) => c.investigating_officer === officer.police_id
      );

      // Officer Pin Position (Left column)
      posMap[`off-${officer.police_id}`] = { x: 60, y: currentY + 30 };

      if (assignedCriminals.length === 0) {
        currentY += 210;
        return;
      }

      // Arrange assigned criminals in rows to the right of officer
      assignedCriminals.forEach((crm, idx) => {
        const crmX = 360 + (idx % 2) * 500;
        const rowOffset = Math.floor(idx / 2) * 230;
        const crmY = currentY + rowOffset;

        posMap[`crm-${crm.criminal_id}`] = { x: crmX, y: crmY };
        // Court Note Position (Pinned top-right of criminal)
        posMap[`crt-${crm.criminal_id}`] = { x: crmX + 210, y: crmY - 15 };
        // Jail Tag Position (Pinned bottom-right of criminal)
        posMap[`jl-${crm.criminal_id}`] = { x: crmX + 210, y: crmY + 95 };
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
      // Fallback
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
    setPan({ x: 30, y: 30 });
    setScale(isMobile ? 0.75 : 1);
    setSelectedCriminalId(null);
  };

  const handleFitToScreen = () => {
    setScale(isMobile ? 0.6 : 0.75);
    setPan({ x: 20, y: 20 });
  };

  // Filtered lists
  const visibleCriminals = useMemo(() => {
    return criminals.filter((c) => {
      if (filterOfficer && String(c.investigating_officer) !== filterOfficer) return false;
      if (filterStatus && c.investigation_status !== filterStatus) return false;
      return true;
    });
  }, [criminals, filterOfficer, filterStatus]);

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

  // POINTER EVENTS: Touch drag, Pan, and 2-finger Pinch-Zoom
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan/pinch if background was pressed, not an interactive card
    if ((e.target as HTMLElement).closest('.board-node')) return;

    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (activePointers.current.size === 1) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    } else if (activePointers.current.size === 2) {
      setIsPanning(false);
      const pts = Array.from(activePointers.current.values());
      initialPinchDist.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      initialPinchScale.current = scale;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activePointers.current.has(e.pointerId)) return;
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // Two-finger pinch zoom
    if (activePointers.current.size === 2 && initialPinchDist.current && initialPinchDist.current > 0) {
      const pts = Array.from(activePointers.current.values());
      const currentDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const newScale = Math.min(
        1.8,
        Math.max(0.4, initialPinchScale.current * (currentDist / initialPinchDist.current))
      );
      setScale(newScale);
    } else if (activePointers.current.size === 1 && isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (activePointers.current.size < 2) {
      initialPinchDist.current = null;
    }
    if (activePointers.current.size === 0) {
      setIsPanning(false);
    } else if (activePointers.current.size === 1) {
      const remaining = Array.from(activePointers.current.values())[0];
      panStartRef.current = { x: remaining.x - pan.x, y: remaining.y - pan.y };
      setIsPanning(true);
    }
  };

  // Zoom on wheel (desktop mouse)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(1.8, Math.max(0.4, prev * zoomFactor)));
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
    const sag = Math.min(32, Math.max(12, dist * 0.12));
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2 + sag;
    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  };

  return (
    <div className="relative w-full h-[calc(100dvh-130px)] min-h-[520px] sm:min-h-[640px] flex flex-col rounded-lg border-4 sm:border-8 border-[#6b4226] shadow-2xl overflow-hidden select-none">
      {/* Wooden Frame & Toolbar Header */}
      <div className="bg-[#1F2D3D] text-[#EFE9DC] px-3 sm:px-4 py-2 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 border-b-2 sm:border-b-4 border-[#52321c] z-20 shadow-md">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <PushPin color="red" size={18} />
          <h2 className="font-typewriter text-xs sm:text-sm font-bold tracking-wider text-[#F6F0E0] uppercase truncate">
            CASE BOARD
          </h2>
          <span className="font-mono text-[10px] text-[#B08D3C] hidden md:inline">
            [INTERACTIVE EVIDENCE GRAPH]
          </span>
        </div>

        {/* Board Filters & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {/* Mobile Filters Button */}
          {isMobile ? (
            <button
              onClick={() => setShowFiltersSheet(true)}
              className={`min-h-[36px] px-2.5 flex items-center gap-1 font-typewriter text-xs font-semibold rounded-xs border transition-colors ${
                filterOfficer || filterStatus
                  ? 'bg-[#B08D3C] text-[#1F1F1F] border-[#8C6C26] font-bold'
                  : 'bg-[#26374A] text-[#F6F0E0] border-[#2B3D52]'
              }`}
              aria-label="Filter case board"
            >
              <Filter size={13} />
              <span>FILTERS {filterOfficer || filterStatus ? '●' : ''}</span>
            </button>
          ) : (
            /* Desktop/Tablet Inline Filters */
            <>
              <select
                value={filterOfficer}
                onChange={(e) => setFilterOfficer(e.target.value)}
                className="h-8 px-2 bg-[#141D27] border border-[#2B3D52] rounded text-[#EFE9DC] font-typewriter text-xs focus:outline-none"
              >
                <option value="">Officer: All</option>
                {officers.map((o) => (
                  <option key={o.police_id} value={o.police_id}>
                    {o.rank} {o.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 px-2 bg-[#141D27] border border-[#2B3D52] rounded text-[#EFE9DC] font-typewriter text-xs focus:outline-none"
              >
                <option value="">Status: All</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Closed">Closed</option>
              </select>
            </>
          )}

          {/* Reset Grid Button */}
          <button
            onClick={handleResetLayout}
            className="min-h-[36px] px-2 sm:px-2.5 flex items-center gap-1 font-typewriter text-xs bg-[#26374A] hover:bg-[#2B3D52] text-[#F6F0E0] rounded-xs border border-[#2B3D52] transition-fast"
            title="Auto-arrange cards into clean investigation rows"
          >
            <RotateCcw size={12} />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Zoom & Fit Controls (Always visible including on mobile) */}
          <div className="flex items-center bg-[#141D27] rounded-xs border border-[#2B3D52] overflow-hidden">
            <button
              onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}
              className="min-h-[36px] min-w-[32px] sm:min-w-[36px] flex items-center justify-center text-[#C9D1D9] hover:bg-[#2B3D52]"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="font-mono text-[10px] px-1 text-[#B08D3C] tabular-nums select-none">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale((s) => Math.min(1.8, s + 0.15))}
              className="min-h-[36px] min-w-[32px] sm:min-w-[36px] flex items-center justify-center text-[#C9D1D9] hover:bg-[#2B3D52]"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={handleFitToScreen}
              className="min-h-[36px] px-1.5 flex items-center justify-center text-[#C9D1D9] hover:bg-[#2B3D52] border-l border-[#2B3D52]"
              title="Fit to Screen"
              aria-label="Fit to screen"
            >
              <Maximize2 size={12} className="text-[#B08D3C]" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Corkboard Surface: touch-action: none on the canvas only */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className={`flex-1 corkboard-bg relative overflow-hidden touch-none select-none ${
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

              const isChainActive =
                selectedCriminalId === null || selectedCriminalId === crm.criminal_id;
              const stringOpacity = isChainActive ? 0.95 : 0.12;
              const stringWidth = isChainActive ? (selectedCriminalId === crm.criminal_id ? 3 : 2.2) : 1.2;

              const offPinX = (offPos?.x || 100) + (isMobile ? 88 : 110);
              const offPinY = (offPos?.y || 100) + 12;
              const crmPinX = crmPos.x + (isMobile ? 80 : 95);
              const crmPinY = crmPos.y + 12;

              const crtPinX = (crtPos?.x || crmPos.x + 210) + (isMobile ? 60 : 70);
              const crtPinY = (crtPos?.y || crmPos.y) + 10;

              const jlPinX = (jlPos?.x || crmPos.x + 210) + (isMobile ? 65 : 75);
              const jlPinY = (jlPos?.y || crmPos.y + 100) + 10;

              return (
                <g key={`strings-${crm.criminal_id}`} style={{ opacity: stringOpacity }}>
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
                  {crm.court_room_number && (
                    <path
                      d={makeStringPath(crmPinX, crmPinY, crtPinX, crtPinY)}
                      fill="none"
                      stroke="#B3261E"
                      strokeWidth={stringWidth}
                      strokeLinecap="round"
                      filter="url(#stringShadow)"
                    />
                  )}
                  {crm.jail_location && (
                    <path
                      d={makeStringPath(crmPinX, crmPinY, jlPinX, jlPinY)}
                      fill="none"
                      stroke="#B3261E"
                      strokeWidth={stringWidth}
                      strokeLinecap="round"
                      filter="url(#stringShadow)"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Cards Layer */}
          <div className="absolute inset-0 z-20">
            {/* 1. Officer Pin Cards */}
            {visibleOfficers.map((off) => {
              const pos = positions[`off-${off.police_id}`] || { x: 60, y: 100 };
              const isAssigned = visibleCriminals.some(
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
                  className={`board-node ${
                    isMobile ? 'w-44 p-2 text-xs' : 'w-56 p-3'
                  } bg-[#1F2D3D] text-[#EFE9DC] border-2 border-[#B08D3C] rounded-sm shadow-folder cursor-move select-none`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="brass" size={isMobile ? 20 : 24} />
                  </div>

                  <div className="pt-2 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-[#B08D3C]">
                      <Shield size={13} />
                      <span className="font-typewriter text-[9px] sm:text-[10px] tracking-widest font-bold uppercase">
                        OFFICER IN CHARGE
                      </span>
                    </div>

                    <h4 className="font-typewriter font-bold text-xs sm:text-sm text-[#F6F0E0] mt-1 truncate">
                      {off.rank} {off.name}
                    </h4>

                    <div className="text-[10px] sm:text-[11px] font-mono text-[#8C9AA8] mt-0.5 truncate">
                      Badge #{off.police_id} • {off.branch}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-[#2B3D52] flex items-center justify-between text-[10px] font-mono text-[#EFE9DC]">
                      <span>Caseload:</span>
                      <span className="font-bold text-[#B08D3C]">
                        {off.case_count || (isAssigned ? 'Active' : '0')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* 2. Criminal Polaroid Cards */}
            {visibleCriminals.map((crm) => {
              const pos = positions[`crm-${crm.criminal_id}`] || { x: 360, y: 100 };
              const isSelected = selectedCriminalId === crm.criminal_id;
              const isDimmed = selectedCriminalId !== null && !isSelected;

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
                  className={`board-node ${
                    isMobile ? 'w-40 p-2' : 'w-52 p-3'
                  } bg-[#F6F0E0] dark:bg-[#20242C] border-2 ${
                    isSelected
                      ? 'border-[#B3261E] ring-4 ring-[#B3261E]/30'
                      : 'border-[#D9D0BE] dark:border-[#3A3F4D]'
                  } rounded-xs shadow-folder cursor-move select-none`}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="red" size={isMobile ? 20 : 24} />
                  </div>

                  <div className="pt-1.5">
                    <div className={`relative w-full ${isMobile ? 'h-24' : 'h-28'} bg-[#E6DFCD] dark:bg-[#15171B] border border-[#C5BBA6] dark:border-[#2C303A] rounded-xs overflow-hidden flex items-end justify-center`}>
                      <div className="absolute left-0 top-0 bottom-0 w-7 border-r border-[#C5BBA6] dark:border-[#2C303A] flex flex-col justify-between py-1 text-[7px] font-mono text-[#8C7E68] select-none pl-1 z-0">
                        <span>6'0"</span>
                        <span>5'6"</span>
                        <span>5'0"</span>
                      </div>

                      {crm.has_photo ? (
                        <img
                          src={api.getCriminalThumbUrl(crm.criminal_id, crm.photo_updated_at)}
                          alt={`Photo of ${crm.name}`}
                          width={140}
                          height={100}
                          loading="lazy"
                          className="w-full h-full object-cover z-10 relative"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                            const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className={`w-full h-full items-end justify-center relative z-10 ${
                          crm.has_photo ? 'hidden' : 'flex'
                        }`}
                      >
                        <svg width="60" height="75" viewBox="0 0 60 70" fill="#3A3833">
                          <circle cx="30" cy="22" r="14" />
                          <path d="M10 65 C10 42 20 38 30 38 C40 38 50 42 50 65 Z" />
                        </svg>

                        <span className="absolute bottom-1 right-2 font-typewriter font-bold text-[10px] text-[#8C7E68]">
                          {initials}
                        </span>
                      </div>
                    </div>

                    <div className="mt-1.5 text-center">
                      <div className="font-mono text-[9px] text-[#B3261E] font-bold">
                        FILE #{crm.criminal_id}
                      </div>
                      <h4 className="font-typewriter font-bold text-xs text-[#1F1F1F] dark:text-[#F6F0E0] truncate">
                        {crm.name}
                      </h4>
                      <div className="text-[10px] font-medium text-[#4B4B4B] dark:text-[#A09D95] truncate">
                        {crm.crime} • {crm.age}y
                      </div>

                      <div className="mt-1">
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

            {/* 3. Judicial Court Sticky Notes */}
            {visibleCriminals.map((crm) => {
              const pos = positions[`crt-${crm.criminal_id}`] || {
                x: (positions[`crm-${crm.criminal_id}`]?.x || 360) + 210,
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
                  className={`board-node ${
                    isMobile ? 'w-36 p-2' : 'w-40 p-2.5'
                  } shadow-md cursor-move select-none ${
                    crm.court_room_number
                      ? 'bg-[#FEF08A] text-[#713F12] border border-[#FACC15] rotate-1'
                      : 'bg-transparent text-slate-400 border-2 border-dashed border-[#D9D0BE] dark:border-slate-700'
                  }`}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="silver" size={16} />
                  </div>

                  <div className="pt-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-typewriter font-bold uppercase tracking-wider">
                      <Gavel size={11} />
                      <span>COURT DOCKET</span>
                    </div>

                    {crm.court_room_number ? (
                      <div className="mt-0.5 font-typewriter font-bold text-xs truncate">
                        Room #{crm.court_room_number}
                        <span className="block text-[8px] font-mono text-[#854D0E] font-normal">
                          Trial Proceedings
                        </span>
                      </div>
                    ) : (
                      <div className="mt-1 font-typewriter text-[9px] text-slate-400 italic">
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
                x: (positions[`crm-${crm.criminal_id}`]?.x || 360) + 210,
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
                  className={`board-node ${
                    isMobile ? 'w-36 p-2' : 'w-44 p-2.5'
                  } shadow-md cursor-move select-none ${
                    crm.jail_location
                      ? 'bg-[#F3F4F6] text-[#1F2937] border border-[#D1D5DB] -rotate-1'
                      : 'bg-transparent text-slate-400 border-2 border-dashed border-[#D9D0BE] dark:border-slate-700'
                  }`}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none">
                    <PushPin color="silver" size={16} />
                  </div>

                  <div className="pt-1 text-center">
                    <div className="flex items-center justify-center gap-1 text-[9px] font-typewriter font-bold uppercase tracking-wider text-[#4B5563]">
                      <Lock size={11} />
                      <span>INCARCERATION</span>
                    </div>

                    {crm.jail_location ? (
                      <div className="mt-0.5 text-xs">
                        <div className="font-typewriter font-bold truncate">
                          {crm.jail_location}
                        </div>
                        <div className="text-[9px] font-mono text-[#6B7280] truncate">
                          Barrack {crm.barrack_number} • {crm.sentence}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-1 font-typewriter text-[9px] text-slate-400 italic">
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

      {/* Case Detail Inspector: Bottom sheet on mobile, slide-over panel on desktop */}
      <AnimatePresence>
        {selectedCriminal && (
          isMobile ? (
            /* Mobile Bottom Sheet */
            <div className="fixed inset-0 z-50 select-none" role="dialog" aria-modal="true" aria-label="Evidence dossier inspector">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60"
                onClick={() => setSelectedCriminalId(null)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-[#F6F0E0] dark:bg-[#1A1C20] border-t-4 border-[#B08D3C] rounded-t-lg z-50 flex flex-col p-4 shadow-2xl pb-safe"
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
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xs text-[#7A7A7A] hover:text-[#1F1F1F] dark:hover:text-white"
                    aria-label="Close dossier"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-3 my-3 text-xs overflow-y-auto">
                  <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B] space-y-1">
                    <div>Crime: <strong>{selectedCriminal.crime}</strong></div>
                    <div>Age: <strong>{selectedCriminal.age} years</strong></div>
                    <div className="pt-1">
                      <Stamp text={selectedCriminal.investigation_status} size="sm" />
                    </div>
                  </div>

                  <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B]">
                    <div className="font-bold">
                      Officer: {selectedOfficer?.rank} {selectedOfficer?.name}
                    </div>
                    <div className="text-[11px] text-[#7A7A7A]">
                      {selectedOfficer?.branch} • Badge #{selectedOfficer?.police_id}
                    </div>
                  </div>

                  {selectedCriminal.court_room_number && (
                    <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B]">
                      <div className="font-bold text-[#854D0E]">
                        Court Docket: Chamber #{selectedCriminal.court_room_number}
                      </div>
                    </div>
                  )}

                  {selectedCriminal.jail_location && (
                    <div className="p-2.5 bg-[#EFE9DC] dark:bg-[#22252C] rounded-xs border border-[#D9D0BE] dark:border-[#2E323B]">
                      <div className="font-bold text-[#B3261E]">
                        {selectedCriminal.jail_location} (Barrack {selectedCriminal.barrack_number})
                      </div>
                      <div className="text-[11px] text-[#7A7A7A]">
                        Sentence: {selectedCriminal.sentence}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-[#D9D0BE] dark:border-[#2E323B]">
                  <button
                    onClick={() => navigate(`/criminals/${selectedCriminal.criminal_id}`)}
                    className="w-full min-h-[44px] px-3 bg-[#1F2D3D] hover:bg-[#141D27] text-[#EFE9DC] font-typewriter text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 shadow-paper"
                  >
                    <span>OPEN FULL DOSSIER</span>
                    <ExternalLink size={14} />
                  </button>
                </div>
              </motion.div>
            </div>
          ) : (
            /* Desktop / Tablet Side Panel */
            <motion.div
              initial={{ x: 340, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 340, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute top-12 right-0 bottom-0 w-80 bg-[#F6F0E0] dark:bg-[#1A1C20] border-l-4 border-[#B08D3C] shadow-2xl z-30 flex flex-col p-4 overflow-y-auto"
            >
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
                  aria-label="Close inspector"
                >
                  <X size={16} />
                </button>
              </div>

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
          )
        )}
      </AnimatePresence>

      {/* Mobile Filters Bottom Sheet */}
      {isMobile && showFiltersSheet && (
        <div className="fixed inset-0 z-50 select-none" role="dialog" aria-modal="true" aria-label="Filter case board">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setShowFiltersSheet(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 max-h-[80vh] bg-[#F6F0E0] dark:bg-[#1A1C20] border-t-2 border-[#B08D3C] rounded-t-lg shadow-2xl flex flex-col z-50 pb-safe">
            <div className="px-4 py-3 border-b border-[#D9D0BE] dark:border-[#2E323B] flex items-center justify-between bg-[#EFE9DC] dark:bg-[#17212D]">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#B08D3C]" />
                <span className="font-typewriter text-xs font-bold uppercase tracking-wider text-[#1F1F1F] dark:text-[#E2DFD8]">
                  Case Board Filters
                </span>
              </div>
              <button
                onClick={() => setShowFiltersSheet(false)}
                className="w-10 h-10 flex items-center justify-center text-[#7A7A7A]"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 space-y-4 font-typewriter text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#7A7A7A] uppercase mb-1">
                  Investigating Officer
                </label>
                <select
                  value={filterOfficer}
                  onChange={(e) => setFilterOfficer(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-base text-[#1F1F1F] dark:text-[#E2DFD8]"
                >
                  <option value="">Officer: All</option>
                  {officers.map((o) => (
                    <option key={o.police_id} value={o.police_id}>
                      {o.rank} {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#7A7A7A] uppercase mb-1">
                  Investigation Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-[#EFE9DC] dark:bg-[#16181C] border border-[#D9D0BE] dark:border-[#2E323B] rounded-xs text-base text-[#1F1F1F] dark:text-[#E2DFD8]"
                >
                  <option value="">Status: All</option>
                  <option value="Open">Open</option>
                  <option value="Under Investigation">Under Investigation</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="p-3 border-t border-[#D9D0BE] dark:border-[#2E323B] flex items-center gap-2 bg-[#FAF7F0] dark:bg-[#17212D]">
              {(filterOfficer || filterStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterOfficer('');
                    setFilterStatus('');
                    setShowFiltersSheet(false);
                  }}
                  className="flex-1 min-h-[44px] px-3 font-typewriter text-xs border border-[#D9D0BE] dark:border-[#2E323B] text-[#7A7A7A] rounded-xs"
                >
                  RESET
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowFiltersSheet(false)}
                className="flex-1 min-h-[44px] px-4 font-typewriter text-xs font-bold bg-[#B08D3C] text-[#1F1F1F] rounded-xs shadow-paper"
              >
                APPLY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
