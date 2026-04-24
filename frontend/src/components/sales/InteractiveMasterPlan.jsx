import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-transform-component';
import { Search, Info, ZoomIn, ZoomOut, Maximize, MousePointer2 } from 'lucide-react';

/**
 * InteractiveMasterPlan - Linh hồn của module bán sơ cấp
 * Cho phép tương tác trực tiếp trên mặt bằng dự án (SVG Hotspots)
 */
const InteractiveMasterPlan = ({ 
  project, 
  block, 
  units = [], 
  onUnitSelect 
}) => {
  const [hoveredUnit, setHoveredUnit] = useState(null);

  // Giả lập dữ liệu tọa độ SVG cho các căn hộ mẫu trên một mặt bằng chuẩn
  const getUnitPath = (unitCode) => {
    const mockPaths = {
      'S1.01': "M100,100 L250,100 L250,250 L100,250 Z",
      'S1.02': "M260,100 L410,100 L410,250 L260,250 Z",
      'S1.03': "M420,100 L570,100 L570,250 L420,250 Z",
      'S1.04': "M580,100 L730,100 L730,250 L580,250 Z",
      'S1.05': "M100,260 L250,260 L250,410 L100,410 Z",
    };
    return mockPaths[unitCode] || "M0,0 L50,0 L50,50 L0,50 Z";
  };

  const getStatusColor = (status, isHovered) => {
    if (status === 'sold') return isHovered ? '#ef4444' : '#fee2e2';
    if (status === 'booked' || status === 'pending') return isHovered ? '#f59e0b' : '#fef3c7';
    return isHovered ? '#316585' : '#e2e8f0';
  };

  const getStatusBorder = (status) => {
    if (status === 'sold') return '#ef4444';
    if (status === 'booked' || status === 'pending') return '#f59e0b';
    return '#64748b';
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="flex flex-col bg-white/90 backdrop-blur shadow-md rounded-lg border p-1">
          <button className="p-2 hover:bg-slate-100 rounded-md transition-colors"><ZoomIn className="w-4 h-4 text-slate-600" /></button>
          <button className="p-2 hover:bg-slate-100 rounded-md transition-colors"><ZoomOut className="w-4 h-4 text-slate-600" /></button>
          <div className="h-px bg-slate-200 my-1 mx-1" />
          <button className="p-2 hover:bg-slate-100 rounded-md transition-colors"><Maximize className="w-4 h-4 text-slate-600" /></button>
        </div>
        
        <div className="bg-white/90 backdrop-blur shadow-md rounded-lg border p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Chú giải</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded bg-slate-200 border border-slate-400" /> Còn trống
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded bg-amber-100 border border-amber-500" /> Giữ chỗ
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-3 h-3 rounded bg-red-100 border border-red-500" /> Đã chốt
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border shadow-sm">
        <MousePointer2 className="w-4 h-4 text-[#316585]" />
        <span className="text-xs font-medium text-slate-700">Chọn căn trực quan trên sơ đồ</span>
      </div>

      <TransformWrapper centerOnInit={true}>
        <TransformComponent wrapperClass="!w-full !h-full">
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1590247813693-5541d1c609fd?auto=format&fit=crop&q=80&w=2000" 
              alt="Floor Plan"
              className="opacity-40 grayscale pointer-events-none"
              style={{ width: '1000px', height: '800px', objectFit: 'cover' }}
            />
            <svg viewBox="0 0 1000 800" className="absolute top-0 left-0 w-full h-full">
              {units.map((unit) => (
                <g 
                  key={unit.id}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredUnit(unit.id)}
                  onMouseLeave={() => setHoveredUnit(null)}
                  onClick={() => onUnitSelect(unit)}
                >
                  <path
                    d={getUnitPath(unit.code)}
                    fill={getStatusColor(unit.status, hoveredUnit === unit.id)}
                    stroke={getStatusBorder(unit.status)}
                    strokeWidth={hoveredUnit === unit.id ? 3 : 1.5}
                  />
                  <text
                    x={(parseInt(getUnitPath(unit.code).match(/\d+/g)[0]) + parseInt(getUnitPath(unit.code).match(/\d+/g)[2])) / 2}
                    y={(parseInt(getUnitPath(unit.code).match(/\d+/g)[1]) + parseInt(getUnitPath(unit.code).match(/\d+/g)[5])) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="14"
                    fontWeight="bold"
                    fill={hoveredUnit === unit.id ? '#fff' : '#64748b'}
                    className="pointer-events-none select-none"
                  >
                    {unit.code.split('.').slice(-1)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </TransformComponent>
      </TransformWrapper>

      {hoveredUnit && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-64 bg-white shadow-2xl rounded-xl border border-slate-200 p-4 z-20">
          {units.find(u => u.id === hoveredUnit) && (
            <div>
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold text-slate-800">Căn {units.find(u => u.id === hoveredUnit).code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200">Tầng {units.find(u => u.id === hoveredUnit).floor}</span>
              </div>
              <div className="text-[#316585] font-bold text-base">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(units.find(u => u.id === hoveredUnit).price)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InteractiveMasterPlan;
