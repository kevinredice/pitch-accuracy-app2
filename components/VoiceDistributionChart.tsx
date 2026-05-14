
import React from 'react';
import { normalPDF } from '../utils/pitch';

interface VoiceDistributionChartProps {
  userFreq: number;
}

export const VoiceDistributionChart: React.FC<VoiceDistributionChartProps> = ({ userFreq }) => {
  const maleMean = 120, maleStd = 20;
  const femaleMean = 210, femaleStd = 25;
  const minX = 60, maxX = 350; 
  const step = 2;
  const width = 400, height = 150;

  const points = [];
  for (let x = minX; x <= maxX; x += step) {
    points.push(x);
  }

  const malePath = points.map((x, i) => {
    const y = normalPDF(x, maleMean, maleStd) * 6000;
    return `${i === 0 ? 'M' : 'L'} ${(x - minX) / (maxX - minX) * width} ${height - y}`;
  }).join(' ');

  const femalePath = points.map((x, i) => {
    const y = normalPDF(x, femaleMean, femaleStd) * 6000;
    return `${i === 0 ? 'M' : 'L'} ${(x - minX) / (maxX - minX) * width} ${height - y}`;
  }).join(' ');

  const userX = Math.max(minX, Math.min(maxX, userFreq));
  const userXPx = (userX - minX) / (maxX - minX) * width;

  return (
    <div className="w-full h-[220px] relative bg-white overflow-visible pt-10 pb-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        {/* Grids */}
        <line x1="0" y1={height} x2={width} y2={height} stroke="#f1f5f9" strokeWidth="2" />
        
        {/* Bell Curves */}
        <path d={malePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" />
        <path d={`${malePath} L ${width} ${height} L 0 ${height} Z`} fill="url(#maleGradient)" fillOpacity="0.15" />
        
        <path d={femalePath} fill="none" stroke="#ec4899" strokeWidth="3" strokeOpacity="0.6" strokeLinecap="round" />
        <path d={`${femalePath} L ${width} ${height} L 0 ${height} Z`} fill="url(#femaleGradient)" fillOpacity="0.15" />
        
        {/* User Line */}
        <line x1={userXPx} y1="-20" x2={userXPx} y2={height} stroke="#4f46e5" strokeWidth="3" strokeDasharray="4 4" />
        <circle cx={userXPx} cy={height} r="4" fill="#4f46e5" />
        
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="maleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
          <linearGradient id="femaleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>

      <div className="flex justify-between text-[9px] font-black text-slate-400 mt-2 px-1 uppercase tracking-tighter">
        <span>Low (60Hz)</span>
        <span className="translate-x-[-15%]">Mid (180Hz)</span>
        <span>High (350Hz)</span>
      </div>

      <div className="absolute top-0 inset-x-0 flex justify-center gap-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div> Male Range
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-pink-500 bg-pink-50 px-3 py-1 rounded-full border border-pink-100">
          <div className="w-2 h-2 rounded-full bg-pink-500"></div> Female Range
        </div>
      </div>
      
      {/* Label for the user line */}
      <div 
        className="absolute bottom-[-10px] bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm transform -translate-x-1/2 shadow-sm"
        style={{ left: `${(userX - minX) / (maxX - minX) * 100}%` }}
      >
        YOU
      </div>
    </div>
  );
};
