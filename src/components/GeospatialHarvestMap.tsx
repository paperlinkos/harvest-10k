import React, { useState, useMemo, useRef } from 'react';
import { dataService } from '../services/dataService';
import { useTheme } from '../context/ThemeContext';
import { AreaCouncilStats, ResidentialAreaStats, ResidentialDistrictCluster, SoulRecord } from '../types';
import { getWhatsAppLink } from '../utils/whatsappUtils';
import {
  MapPin,
  Home,
  Navigation,
  Compass,
  Bus,
  Users,
  Search,
  X,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';

export type MapAnalyticsMode = 'outreach' | 'residential' | 'crossflow';

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
    displayName: 'Bwari Area Council',
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
    displayName: 'Gwagwalada Area Council',
    points: '55,175 130,110 165,165 250,205 300,320 225,370 115,345 50,255',
    anchor: { x: 163, y: 248 },
    isLongName: true,
  },
  {
    id: 'kuje',
    name: 'KUJE',
    displayName: 'Kuje Area Council',
    points: '300,320 370,375 400,455 350,535 265,520 225,370',
    anchor: { x: 308, y: 425 },
  },
  {
    id: 'kwali',
    name: 'KWALI',
    displayName: 'Kwali Area Council',
    points: '115,345 225,370 265,520 200,555 105,525 65,430',
    anchor: { x: 160, y: 440 },
  },
  {
    id: 'abaji',
    name: 'ABAJI',
    displayName: 'Abaji Area Council',
    points: '105,525 200,555 265,520 288,578 222,645 128,632 90,585',
    anchor: { x: 185, y: 592 },
  },
];

// Color ramps
const AMBER_OUTREACH_RAMP = ['#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#fbbf24'];
const INDIGO_RESIDENTIAL_RAMP = ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#6366f1', '#a5b4fc'];
const TEAL_FLOW_RAMP = ['#042f2e', '#115e59', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'];

interface GeospatialHarvestMapProps {
  initialMode?: MapAnalyticsMode;
  onSelectCouncil?: (councilId: string | null) => void;
  selectedCouncilId?: string | null;
  className?: string;
}

export const GeospatialHarvestMap: React.FC<GeospatialHarvestMapProps> = ({
  initialMode = 'outreach',
  onSelectCouncil,
  selectedCouncilId,
  className = '',
}) => {
  const { theme, palette } = useTheme();
  const isDark = theme === 'dark';

  const [mode, setMode] = useState<MapAnalyticsMode>(initialMode);
  const [activeDistrictForModal, setActiveDistrictForModal] = useState<string | null>(null);
  const [addressSearchQuery, setAddressSearchQuery] = useState<string>('');

  // Tooltip state
  const [hoveredData, setHoveredData] = useState<{
    id: string;
    displayName: string;
    outreachCount: number;
    residentialCount: number;
    percent: number;
    netInflow: number;
    x: number;
    y: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Analytical data
  const outreachBreakdown = dataService.getAreaCouncilBreakdown();
  const residentialBreakdown = dataService.getResidentialAreaBreakdown();
  const crossflowComparison = dataService.getOutreachVsResidentialComparison();
  const topClusters = dataService.getTopResidentialClusters(8);
  const totalSouls = dataService.getStats().totalSouls;

  // Map dictionaries
  const outreachMap = useMemo(() => {
    const m = new Map<string, AreaCouncilStats>();
    outreachBreakdown.forEach(item => m.set(item.areaCouncilId, item));
    return m;
  }, [outreachBreakdown]);

  const residentialMap = useMemo(() => {
    const m = new Map<string, ResidentialAreaStats>();
    residentialBreakdown.forEach(item => m.set(item.areaCouncilId, item));
    return m;
  }, [residentialBreakdown]);

  const flowMap = useMemo(() => {
    const m = new Map<string, number>();
    crossflowComparison.forEach(item => m.set(item.areaCouncilId, item.netInflow));
    return m;
  }, [crossflowComparison]);

  // Rank councils based on active mode
  const ranks = useMemo(() => {
    const list = COUNCIL_GEOMETRIES.map(geo => {
      let count = 0;
      if (mode === 'outreach') {
        count = outreachMap.get(geo.id)?.soulsWon || 0;
      } else if (mode === 'residential') {
        count = residentialMap.get(geo.id)?.count || 0;
      } else {
        count = flowMap.get(geo.id) || 0;
      }
      return { id: geo.id, count };
    });

    list.sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      return a.id.localeCompare(b.id);
    });

    const rankMap = new Map<string, number>();
    list.forEach((item, index) => rankMap.set(item.id, index));
    return rankMap;
  }, [mode, outreachMap, residentialMap, flowMap]);

  const activeRamp =
    mode === 'outreach'
      ? AMBER_OUTREACH_RAMP
      : mode === 'residential'
      ? INDIGO_RESIDENTIAL_RAMP
      : TEAL_FLOW_RAMP;

  const strokeColor = isDark ? '#0f172a' : '#ffffff';

  // Converts for the inspected district modal
  const inspectedConverts = useMemo(() => {
    if (!activeDistrictForModal) return [];
    const raw = dataService.getConvertsByDistrict(activeDistrictForModal);
    if (!addressSearchQuery.trim()) return raw;
    const q = addressSearchQuery.toLowerCase();
    return raw.filter(
      r =>
        r.firstName.toLowerCase().includes(q) ||
        r.lastName.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.residentialAddress && r.residentialAddress.toLowerCase().includes(q)) ||
        (r.outreachSpot && r.outreachSpot.toLowerCase().includes(q))
    );
  }, [activeDistrictForModal, addressSearchQuery]);

  const handleTileClick = (councilId: string) => {
    if (!onSelectCouncil) return;
    if (selectedCouncilId === councilId) onSelectCouncil(null);
    else onSelectCouncil(councilId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGPolygonElement>, geo: CouncilGeo) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const out = outreachMap.get(geo.id)?.soulsWon || 0;
    const res = residentialMap.get(geo.id)?.count || 0;
    const net = flowMap.get(geo.id) || 0;
    const percent =
      mode === 'outreach'
        ? outreachMap.get(geo.id)?.percentageOfTotal || 0
        : residentialMap.get(geo.id)?.percentageOfTotal || 0;

    setHoveredData({
      id: geo.id,
      displayName: geo.displayName,
      outreachCount: out,
      residentialCount: res,
      netInflow: net,
      percent,
      x,
      y,
    });
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs space-y-6 ${className}`}
      id="geospatial-harvest-analytics"
    >
      {/* Top Header & Analytics Mode Selector Tabs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: `${palette.hex}15`,
                color: palette.hex,
                borderColor: `${palette.hex}30`,
              }}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Abuja FCT Geographic Intelligence</span>
            </span>
            <span className="text-xs text-slate-400 font-medium">10,000 Soul Collation Grid</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {mode === 'outreach' && 'Where Souls Were Won — Field Outreach Hotspots'}
            {mode === 'residential' && 'Where Converts Live — Residential Address & Living Clusters'}
            {mode === 'crossflow' && 'Outreach to Residence Cross-Flow & Church Bus Transit'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === 'outreach' &&
              'Tracking evangelism collation points and street rally volumes across all 6 Area Councils.'}
            {mode === 'residential' &&
              'Locating new believer home addresses across satellite towns (Lugbe, Kubwa, Karu, Lokogoma) for discipleship visitation.'}
            {mode === 'crossflow' &&
              'Analyzing commuter conversion: believers met in commercial hubs who reside in residential satellite corridors.'}
          </p>
        </div>

        {/* 3-Way Mode Toggle Pills */}
        <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
          <button
            type="button"
            onClick={() => setMode('outreach')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'outreach'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Where Won</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('residential')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'residential'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Where They Live</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('crossflow')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'crossflow'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Bus className="w-3.5 h-3.5" />
            <span>Bus Routes / Flow</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Map (Left) & Neighborhood Clusters + Address Directory (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Choropleth Map */}
        <div className="lg:col-span-6 bg-slate-950/95 rounded-2xl p-5 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[420px]">
          {/* Active Mode Indicator Pill on Map */}
          <div className="absolute top-3 left-3 text-[11px] font-mono flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                backgroundColor:
                  mode === 'outreach' ? '#f59e0b' : mode === 'residential' ? '#6366f1' : '#14b8a6',
              }}
            />
            <span className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              {mode === 'outreach'
                ? 'Outreach Heatmap (Souls Won)'
                : mode === 'residential'
                ? 'Living Address Density (Converts Living Here)'
                : 'Net Migration & Commuter Inflow'}
            </span>
          </div>

          <svg
            viewBox="0 0 520 700"
            preserveAspectRatio="xMidYMid meet"
            className="w-full h-80 sm:h-96 drop-shadow-md overflow-visible mt-6"
          >
            <g id="geospatial-councils-group">
              {COUNCIL_GEOMETRIES.map(geo => {
                const rank = ranks.get(geo.id) ?? 0;
                const fillColor = activeRamp[rank];
                const isSelected = selectedCouncilId === geo.id;

                let displayedNumber = 0;
                let subLabel = '';

                if (mode === 'outreach') {
                  displayedNumber = outreachMap.get(geo.id)?.soulsWon || 0;
                  subLabel = `${outreachMap.get(geo.id)?.percentageOfTotal || 0}% Won`;
                } else if (mode === 'residential') {
                  displayedNumber = residentialMap.get(geo.id)?.count || 0;
                  subLabel = `${residentialMap.get(geo.id)?.percentageOfTotal || 0}% Live Here`;
                } else {
                  const net = flowMap.get(geo.id) || 0;
                  displayedNumber = Math.abs(net);
                  subLabel = net >= 0 ? `+${net} Inflow` : `${net} Net Out`;
                }

                const isBrightFill = rank >= 4;
                const textColor = isBrightFill ? '#0f172a' : '#ffffff';
                const subTextColor = isBrightFill ? '#334155' : '#cbd5e1';

                return (
                  <g
                    key={geo.id}
                    className="cursor-pointer group"
                    onClick={() => handleTileClick(geo.id)}
                  >
                    <polygon
                      points={geo.points}
                      fill={fillColor}
                      stroke={isSelected ? '#38bdf8' : strokeColor}
                      strokeWidth={isSelected ? 4 : 2.5}
                      strokeLinejoin="round"
                      className="transition-all hover:opacity-85"
                      onMouseMove={e => handleMouseMove(e, geo)}
                      onMouseLeave={() => setHoveredData(null)}
                    />

                    {/* Council Title */}
                    <text
                      x={geo.anchor.x}
                      y={geo.anchor.y - 8}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={geo.isLongName ? 10 : 12}
                      fontWeight="700"
                      className="pointer-events-none select-none font-sans"
                    >
                      {geo.name}
                    </text>

                    {/* Value */}
                    <text
                      x={geo.anchor.x}
                      y={geo.anchor.y + 14}
                      textAnchor="middle"
                      fill={textColor}
                      fontSize={17}
                      fontWeight="900"
                      className="pointer-events-none select-none font-mono-tabular"
                    >
                      {displayedNumber.toLocaleString()}
                    </text>

                    {/* Sub-label */}
                    <text
                      x={geo.anchor.x}
                      y={geo.anchor.y + 28}
                      textAnchor="middle"
                      fill={subTextColor}
                      fontSize={9}
                      fontWeight="600"
                      className="pointer-events-none select-none font-mono-tabular"
                    >
                      {subLabel}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Map Tooltip */}
          {hoveredData && (
            <div
              className="absolute pointer-events-none z-30 transition-transform duration-75"
              style={{
                left: `${hoveredData.x}px`,
                top: `${Math.max(10, hoveredData.y - 120)}px`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-slate-950/95 text-slate-100 border border-slate-700 rounded-xl p-3 shadow-2xl backdrop-blur-md min-w-[210px] space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <div className="font-bold text-xs text-amber-400 border-b border-slate-800 pb-1">
                  {hoveredData.displayName}
                </div>
                <div className="flex justify-between text-xs pt-0.5">
                  <span className="text-slate-400">Souls Won Here:</span>
                  <span className="font-mono-tabular font-bold text-amber-300">
                    {hoveredData.outreachCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Converts Living Here:</span>
                  <span className="font-mono-tabular font-bold text-indigo-300">
                    {hoveredData.residentialCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Net Commuter Inflow:</span>
                  <span
                    className={`font-mono-tabular font-bold ${
                      hoveredData.netInflow >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {hoveredData.netInflow >= 0 ? `+${hoveredData.netInflow}` : hoveredData.netInflow}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-between w-full text-[10px] text-slate-400 px-4 pt-3 border-t border-slate-800">
            <span>Fewer Souls / Less Density</span>
            <div className="flex gap-1">
              {activeRamp.map((c, i) => (
                <div key={i} className="w-5 h-2 rounded-xs" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>Higher Volume / Density</span>
          </div>
        </div>

        {/* Right: Residential Living Clusters & Address Inspection Drawer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Top Convert Living Neighborhoods & Bus Routes
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 font-bold">
              {topClusters.reduce((sum, c) => sum + c.count, 0)} Converts in Top Hubs
            </span>
          </div>

          <div className="space-y-2.5">
            {topClusters.map((cluster, idx) => (
              <div
                key={cluster.district}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-3 hover:border-indigo-400/60 dark:hover:border-indigo-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                      0{idx + 1}
                    </span>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {cluster.district}
                    </h5>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-semibold">
                      {cluster.areaCouncilCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1 pl-7">
                    <Bus className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{cluster.recommendedBusRoute}</span>
                  </div>

                  {cluster.sampleAddress && (
                    <div className="text-[10px] text-slate-400 truncate pl-7 mt-0.5">
                      Sample: <span className="italic">{cluster.sampleAddress}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center pl-7 sm:pl-0">
                  <div className="text-right">
                    <div className="text-sm font-black font-mono-tabular text-slate-900 dark:text-slate-100">
                      {cluster.count} <span className="text-[10px] text-slate-400 font-normal">souls</span>
                    </div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                      {cluster.percentage}% of converts
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveDistrictForModal(cluster.district);
                      setAddressSearchQuery('');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    title={`Inspect all convert addresses recorded in ${cluster.district}`}
                  >
                    <span>Addresses</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pastoral Insight Box */}
          <div className="rounded-xl p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Pastoral Discipleship & Bus Routing Intelligence</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-400/90 leading-relaxed">
              Analysis confirms a heavy concentration of new believers living in the <strong>Airport Road (Lugbe)</strong> and <strong>Kubwa Expressway</strong> corridors. Recommend dispatching 2 additional follow-up buses along these axes for Sunday services.
            </p>
          </div>
        </div>
      </div>

      {/* CONVERT ADDRESS INSPECTOR MODAL */}
      {activeDistrictForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Convert Addresses in {activeDistrictForModal}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {inspectedConverts.length} convert(s) with recorded residential locations for home visits & discipleship
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveDistrictForModal(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input within modal */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search addresses, convert names, or streets in ${activeDistrictForModal}...`}
                  value={addressSearchQuery}
                  onChange={e => setAddressSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Convert List */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {inspectedConverts.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No converts matching "{addressSearchQuery}" in this neighborhood.
                </div>
              ) : (
                inspectedConverts.map(soul => {
                  const waLink = getWhatsAppLink({
                    phone: soul.phone,
                    firstName: soul.firstName,
                    lastName: soul.lastName,
                    decisionType: soul.decisionType,
                    soulWinnerName: soul.wonByName,
                  });

                  return (
                    <div
                      key={soul.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {soul.firstName} {soul.lastName}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            {soul.decisionType.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{soul.residentialAddress || `${soul.residentialDistrict || soul.community}, Abuja`}</span>
                        </div>

                        {soul.outreachSpot && (
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-amber-500" />
                            <span>Won at: {soul.outreachSpot}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400 font-bold">
                          {soul.phone}
                        </span>

                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveDistrictForModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
