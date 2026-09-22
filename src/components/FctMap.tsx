import React, { useState, useEffect, useMemo, useRef } from 'react';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { AreaCouncilStats } from '../types';

export interface FctMapProps {
  isProjector?: boolean;
  selectedCouncilId?: string | null;
  onSelectCouncil?: (councilId: string | null) => void;
  className?: string;
}

interface CouncilGeo {
  id: string;
  name: string;
  displayName: string;
  points: string;
  anchor: { x: number; y: number };
  isLongName?: boolean;
}

const COUNCIL_GEOMETRIES: CouncilGeo[] = [
  {
    id: 'bwari',
    name: 'BWARI',
    displayName: 'Bwari',
    points: '130,110 200,35 330,25 405,95 380,190 250,205 165,165',
    anchor: { x: 265, y: 110 },
  },
  {
    id: 'amac',
    name: 'AMAC',
    displayName: 'Abuja Municipal (AMAC)',
    points: '380,190 405,95 455,165 450,290 370,375 300,320 250,205',
    anchor: { x: 368, y: 240 },
  },
  {
    id: 'gwagwalada',
    name: 'GWAGWALADA',
    displayName: 'Gwagwalada',
    points: '55,175 130,110 165,165 250,205 300,320 225,370 115,345 50,255',
    anchor: { x: 163, y: 248 },
    isLongName: true,
  },
  {
    id: 'kuje',
    name: 'KUJE',
    displayName: 'Kuje',
    points: '300,320 370,375 400,455 350,535 265,520 225,370',
    anchor: { x: 308, y: 425 },
  },
  {
    id: 'kwali',
    name: 'KWALI',
    displayName: 'Kwali',
    points: '115,345 225,370 265,520 200,555 105,525 65,430',
    anchor: { x: 160, y: 440 },
  },
  {
    id: 'abaji',
    name: 'ABAJI',
    displayName: 'Abaji',
    points: '105,525 200,555 265,520 288,578 222,645 128,632 90,585',
    anchor: { x: 185, y: 592 },
  },
];

// Six-step sequential amber ramp (darkest = fewest, brightest = most)
const AMBER_RAMP = [
  '#451a03', // rank 0 - darkest
  '#78350f', // rank 1
  '#92400e', // rank 2
  '#b45309', // rank 3
  '#d97706', // rank 4
  '#fbbf24', // rank 5 - brightest
];

export const FctMap: React.FC<FctMapProps> = ({
  isProjector = false,
  selectedCouncilId,
  onSelectCouncil,
  className = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark' || isProjector;

  // Tooltip state (dashboard only)
  const [hoveredCouncil, setHoveredCouncil] = useState<{
    id: string;
    name: string;
    count: number;
    percent: number;
    centresCount: number;
    target: number;
    x: number;
    y: number;
  } | null>(null);

  // Pulse state for real-time live submission updates
  const [pulsingCouncilId, setPulsingCouncilId] = useState<string | null>(null);
  const pulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const breakdown = dataService.getAreaCouncilBreakdown();
  const centres = dataService.getCentres();
  const flashedCentreId = dataService.getLastFlashedCentreId();

  // Watch for last flashed centre to trigger council pulse
  useEffect(() => {
    if (flashedCentreId) {
      const centre = centres.find(c => c.id === flashedCentreId);
      if (centre?.areaCouncilId) {
        setPulsingCouncilId(centre.areaCouncilId);
        if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = setTimeout(() => {
          setPulsingCouncilId(null);
        }, 1400);
      }
    }
  }, [flashedCentreId, centres]);

  // Clean up pulse timer
  useEffect(() => {
    return () => {
      if (pulseTimerRef.current) clearTimeout(pulseTimerRef.current);
    };
  }, []);

  // Map stats dictionary
  const councilStatsMap = useMemo(() => {
    const map = new Map<string, AreaCouncilStats>();
    breakdown.forEach(item => {
      map.set(item.areaCouncilId, item);
    });
    return map;
  }, [breakdown]);

  // Rank councils by count (ascending) to assign the 6-step amber palette (0 to 5)
  const councilRanks = useMemo(() => {
    const list = COUNCIL_GEOMETRIES.map(geo => {
      const stats = councilStatsMap.get(geo.id);
      return {
        id: geo.id,
        count: stats ? stats.soulsWon : 0,
      };
    });

    // Sort ascending by count, using ID as tie-breaker so all 6 ramp colours are used
    list.sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.id.localeCompare(b.id);
    });

    const rankMap = new Map<string, number>();
    list.forEach((item, index) => {
      rankMap.set(item.id, index);
    });
    return rankMap;
  }, [councilStatsMap]);

  // Stroke color matches page / card background
  const strokeColor = isDark ? '#0f172a' : '#ffffff';

  const handleTileClick = (councilId: string) => {
    if (isProjector || !onSelectCouncil) return;
    if (selectedCouncilId === councilId) {
      onSelectCouncil(null);
    } else {
      onSelectCouncil(councilId);
    }
  };

  const handleMouseMove = (
    e: React.MouseEvent<SVGPolygonElement>,
    geo: CouncilGeo,
    stats?: AreaCouncilStats
  ) => {
    if (isProjector) return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setHoveredCouncil({
      id: geo.id,
      name: stats?.areaCouncilName || geo.displayName,
      count: stats?.soulsWon || 0,
      percent: stats?.percentageOfTotal || 0,
      centresCount: stats?.centresCount || 0,
      target: stats?.target || 1000,
      x,
      y,
    });
  };

  const handleMouseLeave = () => {
    if (isProjector) return;
    setHoveredCouncil(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex flex-col items-center justify-center select-none ${className}`}
      id="fct-choropleth-map-container"
    >
      {/* Self-contained SVG Map */}
      <svg
        viewBox="0 0 520 700"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full max-h-full drop-shadow-sm overflow-visible"
        style={{
          filter: isProjector
            ? 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5))'
            : 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06))',
        }}
      >
        <defs>
          {/* Subtle pulse animation for real-time live submission activity */}
          <style>{`
            @keyframes pulseHighlight {
              0% { opacity: 1; }
              30% { opacity: 0.35; }
              60% { opacity: 1; }
              80% { opacity: 0.6; }
              100% { opacity: 1; }
            }
            .pulse-active {
              animation: pulseHighlight 1.3s ease-in-out;
            }
          `}</style>
        </defs>

        {/* Six FCT Area Council Polygons */}
        <g id="fct-area-councils-group">
          {COUNCIL_GEOMETRIES.map(geo => {
            const stats = councilStatsMap.get(geo.id);
            const rank = councilRanks.get(geo.id) ?? 0;
            const fillColor = AMBER_RAMP[rank];
            const isSelected = selectedCouncilId === geo.id;
            const isPulsing = pulsingCouncilId === geo.id;

            // Dark text (#1c1917) on the two brightest fills (ranks 4 and 5), white on rest
            const isBrightFill = rank >= 4;
            const textColor = isBrightFill ? '#1c1917' : '#ffffff';
            const subTextColor = isBrightFill ? '#44403c' : '#f1f5f9';

            return (
              <g
                key={geo.id}
                id={`fct-council-${geo.id}`}
                className={!isProjector ? 'cursor-pointer' : ''}
                onClick={() => handleTileClick(geo.id)}
              >
                <polygon
                  points={geo.points}
                  fill={fillColor}
                  stroke={isSelected ? '#38bdf8' : strokeColor}
                  strokeWidth={isSelected ? 4.5 : 3}
                  strokeLinejoin="round"
                  className={`${isPulsing ? 'pulse-active' : ''} transition-all`}
                  style={{
                    transition: 'fill 600ms ease, stroke 300ms ease, opacity 300ms ease',
                    opacity: isPulsing ? 0.8 : 1,
                  }}
                  onMouseMove={e => handleMouseMove(e, geo, stats)}
                  onMouseLeave={handleMouseLeave}
                />

                {/* Selected council indicator halo/accent if active */}
                {isSelected && (
                  <polygon
                    points={geo.points}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeLinejoin="round"
                    className="pointer-events-none animate-pulse"
                  />
                )}

                {/* Council Label: Name on first line, Live count on second line */}
                <text
                  x={geo.anchor.x}
                  y={geo.anchor.y - 7}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={geo.isLongName ? (isProjector ? 11 : 10) : isProjector ? 13 : 12}
                  fontWeight="700"
                  letterSpacing="0.04em"
                  className="pointer-events-none select-none font-sans"
                  style={{ textShadow: isBrightFill ? 'none' : '0 1px 2px rgba(0,0,0,0.4)' }}
                >
                  {geo.name}
                </text>

                <text
                  x={geo.anchor.x}
                  y={geo.anchor.y + 14}
                  textAnchor="middle"
                  fill={textColor}
                  fontSize={isProjector ? 21 : 18}
                  fontWeight="900"
                  className="pointer-events-none select-none"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontVariantNumeric: 'tabular-nums',
                    textShadow: isBrightFill ? 'none' : '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {(stats?.soulsWon || 0).toLocaleString()}
                </text>

                {/* Target attainment percentage tiny sub-pill on tile */}
                <text
                  x={geo.anchor.x}
                  y={geo.anchor.y + 28}
                  textAnchor="middle"
                  fill={subTextColor}
                  fontSize={isProjector ? 10 : 9}
                  fontWeight="600"
                  className="pointer-events-none select-none"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    fontVariantNumeric: 'tabular-nums',
                    opacity: isBrightFill ? 0.85 : 0.75,
                  }}
                >
                  {stats ? `${stats.percentageOfTotal}% FCT` : '0%'}
                </text>
              </g>
            );
          })}
        </g>

        {/* Horizontal Six-Swatch Legend at Bottom (y=668, each swatch 42x14 starting at x=80) */}
        <g id="fct-map-legend" className="pointer-events-none">
          {/* Label "Fewer" */}
          <text
            x={70}
            y={679}
            textAnchor="end"
            fill="#94a3b8"
            fontSize={11}
            fontWeight="600"
            className="select-none font-sans"
          >
            Fewer
          </text>

          {/* 6 Amber Swatches */}
          {AMBER_RAMP.map((color, idx) => (
            <rect
              key={color}
              x={80 + idx * 42}
              y={668}
              width={42}
              height={14}
              rx={2}
              fill={color}
              stroke={strokeColor}
              strokeWidth={1}
            />
          ))}

          {/* Label "More souls" */}
          <text
            x={80 + 6 * 42 + 10}
            y={679}
            textAnchor="start"
            fill="#94a3b8"
            fontSize={11}
            fontWeight="600"
            className="select-none font-sans"
          >
            More souls
          </text>
        </g>
      </svg>

      {/* Hover Tooltip (Dashboard only) */}
      {!isProjector && hoveredCouncil && (
        <div
          className="absolute pointer-events-none z-30 transition-transform duration-75 ease-out"
          style={{
            left: `${hoveredCouncil.x}px`,
            top: `${Math.max(10, hoveredCouncil.y - 120)}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-slate-950/95 text-slate-100 border border-slate-700/90 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[200px] space-y-1.5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-xs text-amber-400">{hoveredCouncil.name}</span>
              <span className="text-[10px] font-mono-tabular bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-bold">
                {hoveredCouncil.centresCount} {hoveredCouncil.centresCount === 1 ? 'Centre' : 'Centres'}
              </span>
            </div>

            <div className="flex items-baseline justify-between text-xs pt-0.5">
              <span className="text-slate-400">Total Harvest:</span>
              <span className="font-mono-tabular font-black text-amber-300 text-sm">
                {hoveredCouncil.count.toLocaleString()} souls
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-tabular">
              <span className="text-slate-400">Share of FCT:</span>
              <span className="font-bold text-emerald-400">{hoveredCouncil.percent}%</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-300 font-mono-tabular">
              <span className="text-slate-400">Target Attainment:</span>
              <span className="font-bold text-cyan-400">
                {Math.round((hoveredCouncil.count / Math.max(1, hoveredCouncil.target)) * 1000) / 10}%
              </span>
            </div>

            <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-800/80 text-center">
              Click council to filter standings table
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
