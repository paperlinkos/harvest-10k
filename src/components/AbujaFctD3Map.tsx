import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import { useTheme } from '../context/ThemeContext';
import { MapPin, Globe2, Users, Award, TrendingUp } from 'lucide-react';

interface FctCouncilData {
  id: string;
  name: string;
  capital: string;
  soulsWon: number;
  target: number;
  centres: number;
  code: string;
}

const ABUJA_COUNCILS: FctCouncilData[] = [
  { id: 'amac', name: 'Abuja Municipal (AMAC)', capital: 'Garki / Central Area', soulsWon: 18450, target: 20000, centres: 28, code: 'AMAC' },
  { id: 'bwari', name: 'Bwari Area Council', capital: 'Bwari Town', soulsWon: 8900, target: 10000, centres: 14, code: 'BWR' },
  { id: 'gwagwalada', name: 'Gwagwalada Area Council', capital: 'Gwagwalada', soulsWon: 9600, target: 11000, centres: 16, code: 'GWG' },
  { id: 'kuje', name: 'Kuje Area Council', capital: 'Kuje Town', soulsWon: 7400, target: 8500, centres: 12, code: 'KUJ' },
  { id: 'kwali', name: 'Kwali Area Council', capital: 'Kwali', soulsWon: 5200, target: 6500, centres: 10, code: 'KWL' },
  { id: 'abaji', name: 'Abaji Area Council', capital: 'Abaji', soulsWon: 4100, target: 5000, centres: 8, code: 'ABJ' },
];

interface AbujaFctD3MapProps {
  onSelectCouncil?: (councilName: string) => void;
}

export const AbujaFctD3Map: React.FC<AbujaFctD3MapProps> = ({ onSelectCouncil }) => {
  const { palette } = useTheme();
  const [selectedCouncil, setSelectedCouncil] = useState<FctCouncilData | null>(ABUJA_COUNCILS[0]);
  const [hoveredCouncil, setHoveredCouncil] = useState<FctCouncilData | null>(null);

  // D3 color scale
  const colorScale = useMemo(() => {
    const maxSouls = d3.max(ABUJA_COUNCILS, d => d.soulsWon) || 20000;
    return d3.scaleSequential()
      .domain([0, maxSouls])
      .interpolator(d3.interpolateOranges);
  }, []);

  const totalSouls = useMemo(() => d3.sum(ABUJA_COUNCILS, d => d.soulsWon), []);
  const totalTarget = useMemo(() => d3.sum(ABUJA_COUNCILS, d => d.target), []);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            <Globe2 className="w-4 h-4" />
            <span>Federal Capital Territory • Abuja, Nigeria</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
            Abuja FCT Area Council Harvest & D3 Geographic Intelligence
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Interactive D3 cartogram tracking soul-winning progress across all 6 Area Councils of Abuja.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">FCT Total Harvest</div>
            <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono-tabular">
              {totalSouls.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ {totalTarget.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* D3 SVG / Grid Cartogram Representation */}
        <div className="lg:col-span-7 bg-slate-950/90 rounded-2xl p-5 border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
          <div className="absolute top-3 left-3 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Abuja FCT Area Councils (D3 Sequential Scaled)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-lg mt-8">
            {ABUJA_COUNCILS.map((council) => {
              const isSelected = selectedCouncil?.id === council.id;
              const isHovered = hoveredCouncil?.id === council.id;
              const bg = colorScale(council.soulsWon);
              const percentage = Math.round((council.soulsWon / council.target) * 100);

              return (
                <button
                  key={council.id}
                  onClick={() => {
                    setSelectedCouncil(council);
                    if (onSelectCouncil) {
                      onSelectCouncil(council.name);
                    }
                  }}
                  onMouseEnter={() => setHoveredCouncil(council)}
                  onMouseLeave={() => setHoveredCouncil(null)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-md scale-105 z-10'
                      : isHovered
                      ? 'border-slate-500 scale-102'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{ backgroundColor: bg + '25' }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 h-1.5"
                    style={{ backgroundColor: bg }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
                      {council.code}
                    </span>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">{percentage}%</span>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-black font-mono-tabular text-white">
                      {council.soulsWon.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{council.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Council Detailed Card */}
        <div className="lg:col-span-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          {selectedCouncil ? (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Headquarters: {selectedCouncil.capital}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    {selectedCouncil.name}
                  </h4>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-300 font-mono text-xs font-bold">
                  {Math.round((selectedCouncil.soulsWon / selectedCouncil.target) * 100)}% of Target
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Souls Harvested</div>
                  <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedCouncil.soulsWon.toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Council Target</div>
                  <div className="text-2xl font-black font-mono-tabular text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedCouncil.target.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span>Harvest Progress Bar</span>
                  <span>{selectedCouncil.soulsWon.toLocaleString()} / {selectedCouncil.target.toLocaleString()}</span>
                </div>
                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (selectedCouncil.soulsWon / selectedCouncil.target) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Active Collation Centres in {selectedCouncil.code}</span>
                </div>
                <span className="font-black font-mono-tabular text-sm">{selectedCouncil.centres} Centres</span>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 text-xs">
              Select an area council to inspect analytics.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
