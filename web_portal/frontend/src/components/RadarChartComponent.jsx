import React from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
} from 'recharts';

export default function RadarChartComponent({ chartData, roleName = 'Senior Statistical Officer (SSO)' }) {
  if (!chartData || !chartData.length) {
    return (
      <div className="w-full h-[320px] flex items-center justify-center text-xs text-slate-400 font-medium">
        Loading Competency Geometry...
      </div>
    );
  }

  return (
    <div className="w-full h-[360px] min-h-[300px] flex flex-col justify-center items-center relative overflow-hidden">
      <ResponsiveContainer width="100%" height={340} minWidth={260} minHeight={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e2d7cc" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="shortName"
            tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 9 }}
            stroke="#cbd5e1"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="rounded-xl border border-[#f0e6dc] bg-white p-3 shadow-lg text-xs z-50">
                    <p className="font-bold text-slate-900 mb-1.5 border-b border-slate-100 pb-1">{data.domain}</p>
                    <div className="flex items-center justify-between gap-4 text-[#1d5ba5] font-semibold">
                      <span>Current:</span>
                      <span className="font-mono font-bold">{data.current} pts</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-[#f58220] font-semibold mt-0.5">
                      <span>{roleName}:</span>
                      <span className="font-mono font-bold">{data.benchmark} pts</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-slate-600 mt-1 pt-1 border-t border-slate-100 font-semibold">
                      <span>Deficit:</span>
                      <span className={data.deficit > 0 ? 'text-rose-600 font-bold font-mono' : 'text-emerald-600 font-bold'}>
                        {data.deficit > 0 ? `-${data.deficit} pts` : 'Attained'}
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ paddingTop: '8px' }}
            formatter={(value) => (
              <span className="text-[11px] font-semibold text-slate-700 mx-1">{value}</span>
            )}
          />
          <Radar
            name="Current Vector"
            dataKey="current"
            stroke="#1d5ba5"
            fill="#1d5ba5"
            fillOpacity={0.3}
            strokeWidth={2.5}
          />
          <Radar
            name={`Target: ${roleName}`}
            dataKey="benchmark"
            stroke="#f58220"
            fill="#f58220"
            fillOpacity={0.15}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
