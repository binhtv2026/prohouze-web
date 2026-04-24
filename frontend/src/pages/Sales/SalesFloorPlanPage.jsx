/**
 * SalesFloorPlanPage - Bảng giá dạng ma trận tầng/block
 * Đây là tính năng đặc thù của môi giới sơ cấp:
 * - Nhìn thấy ngay từng căn theo tầng và block
 * - Màu sắc phản ánh trạng thái: còn hàng, giữ chỗ, đã bán
 * - Click căn để xem chi tiết và thao tác nhanh
 * + Mortgage Calculator — Tính vay ngân hàng ngay tại màn hình căn
 * + War Room Mode — Chế độ mở bán real-time với Live Feed & Lock Timer
 */
import { useState, useMemo, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import {
  Building2,
  Eye,
  Filter,
  Grid3x3,
  Home,
  ChevronRight,
  Phone,
  FileText,
  Bookmark,
  ArrowUpDown,
  Map,
  Zap,
  Calculator,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import MortgageCalculator from '@/components/sales/MortgageCalculator';
import WarRoomMode from '@/components/sales/WarRoomMode';

// ===== DEMO DATA =====
const PROJECTS = [
  { id: 'proj-1', name: 'The Opus One', blocks: ['A', 'B', 'C'], floors: 25, developer: 'Masterise Homes' },
  { id: 'proj-2', name: 'Masteri Grand View', blocks: ['T1', 'T2'], floors: 30, developer: 'Masterise Group' },
  { id: 'proj-3', name: 'Lumiere Riverside', blocks: ['L1', 'L2', 'L3'], floors: 20, developer: 'Berkeley Group' },
];

const UNIT_TYPES = {
  '1BR': { label: '1PN', area: [45, 55], basePrice: 3200000000, color: '#E0F2FE' },
  '2BR': { label: '2PN', area: [68, 80], basePrice: 4800000000, color: '#DCFCE7' },
  '3BR': { label: '3PN', area: [95, 115], basePrice: 7200000000, color: '#FEF9C3' },
  'PH': { label: 'Penthouse', area: [200, 350], basePrice: 18000000000, color: '#F3E8FF' },
  'SH': { label: 'Shophouse', area: [80, 150], basePrice: 9500000000, color: '#FFE4E6' },
};

const STATUS_CONFIG = {
  available:  { label: 'Còn hàng',   bg: 'bg-emerald-100',  border: 'border-emerald-300',  text: 'text-emerald-800', dot: 'bg-emerald-500' },
  reserved:   { label: 'Giữ chỗ',   bg: 'bg-amber-100',    border: 'border-amber-300',    text: 'text-amber-800',   dot: 'bg-amber-500' },
  booked:     { label: 'Đặt cọc',   bg: 'bg-blue-100',     border: 'border-blue-300',     text: 'text-blue-800',    dot: 'bg-blue-500' },
  sold:       { label: 'Đã bán',    bg: 'bg-slate-200',    border: 'border-slate-300',    text: 'text-slate-500',   dot: 'bg-slate-400' },
  held:       { label: 'Đang giữ',  bg: 'bg-violet-100',   border: 'border-violet-300',   text: 'text-violet-800',  dot: 'bg-violet-500' },
};

// Generate demo units for a block
function generateUnits(projectId, block, floors) {
  const units = [];
  const statuses = ['available', 'available', 'available', 'reserved', 'booked', 'sold', 'held'];
  const types = ['1BR', '2BR', '2BR', '3BR', 'SH'];
  
  for (let floor = 1; floor <= floors; floor++) {
    const unitsPerFloor = floor === 1 ? 2 : 4; // ground floor has shophouses
    for (let u = 1; u <= unitsPerFloor; u++) {
      const type = floor === 1 ? 'SH' : types[Math.floor(Math.random() * 4)];
      const unitType = UNIT_TYPES[type];
      const floorPremium = 1 + (floor / 100); // higher floors cost more
      const price = Math.round(unitType.basePrice * floorPremium / 1e8) * 1e8;
      const area = unitType.area[0] + Math.floor(Math.random() * (unitType.area[1] - unitType.area[0]));
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      units.push({
        id: `${projectId}-${block}${floor}${String(u).padStart(2, '0')}`,
        code: `${block}${String(floor).padStart(2, '0')}${String(u).padStart(2, '0')}`,
        floor,
        unit: u,
        type,
        area,
        price,
        pricePerSqm: Math.round(price / area),
        status,
        view: ['Sông', 'Hồ', 'Thành phố', 'Nội khu'][Math.floor(Math.random() * 4)],
        direction: ['Đông', 'Tây', 'Nam', 'Bắc', 'ĐN', 'TN'][Math.floor(Math.random() * 6)],
      });
    }
  }
  return units;
}

function formatPrice(v) {
  if (!v) return 'Liên hệ';
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} tr`;
  return `${v.toLocaleString('vi-VN')}đ`;
}

function formatPricePerSqm(v) {
  if (!v) return '—';
  return `${(v / 1e6).toFixed(1)} tr/m²`;
}

// UnitCell component
function UnitCell({ unit, onClick }) {
  const st = STATUS_CONFIG[unit.status];
  const ut = UNIT_TYPES[unit.type];
  const isSold = unit.status === 'sold';

  return (
    <button
      onClick={() => onClick(unit)}
      disabled={isSold}
      title={`${unit.code} · ${formatPrice(unit.price)}`}
      className={`
        relative flex flex-col items-center justify-center
        rounded-lg border-2 p-1.5 transition-all text-center
        ${st.bg} ${st.border}
        ${isSold ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:scale-105 cursor-pointer'}
        min-w-[60px] min-h-[52px]
      `}
    >
      <span className={`text-[10px] font-bold leading-none ${st.text}`}>{unit.code}</span>
      <span className={`text-[9px] mt-0.5 ${st.text} opacity-70`}>{ut.label}</span>
      <span className={`text-[9px] font-semibold mt-0.5 ${st.text}`}>
        {unit.area}m²
      </span>
    </button>
  );
}

// Legend
function Legend() {
  return (
    <div className="flex flex-wrap gap-3">
      {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-sm ${cfg.dot}`} />
          <span className="text-xs text-slate-600">{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

// Stats bar
function StatsBar({ units }) {
  const counts = {
    available: units.filter(u => u.status === 'available').length,
    reserved: units.filter(u => u.status === 'reserved').length,
    booked: units.filter(u => u.status === 'booked').length,
    sold: units.filter(u => u.status === 'sold').length,
    held: units.filter(u => u.status === 'held').length,
  };
  const total = units.length;
  
  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(counts).map(([status, count]) => {
        const cfg = STATUS_CONFIG[status];
        const pct = total ? Math.round((count / total) * 100) : 0;
        return (
          <div key={status} className={`rounded-xl border ${cfg.border} ${cfg.bg} px-3 py-2 text-center`}>
            <div className={`text-xl font-bold ${cfg.text}`}>{count}</div>
            <div className={`text-xs ${cfg.text} opacity-80`}>{cfg.label}</div>
            <div className={`text-[10px] ${cfg.text} opacity-60`}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

export default function SalesFloorPlanPage() {
  const [selectedProject, setSelectedProject] = useState(PROJECTS[0]);
  const [selectedBlock, setSelectedBlock] = useState(PROJECTS[0].blocks[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map' | 'list'
  const [warRoomActive, setWarRoomActive] = useState(false);
  const [unitDialogTab, setUnitDialogTab] = useState('info'); // 'info' | 'mortgage'

  // Generate units (stable reference using useMemo in real app; fine for demo)
  const allUnits = generateUnits(selectedProject.id, selectedBlock, selectedProject.floors);
  
  const filteredUnits = allUnits.filter(u => {
    const matchStatus = statusFilter === 'all' || u.status === statusFilter;
    const matchType = typeFilter === 'all' || u.type === typeFilter;
    return matchStatus && matchType;
  });

  // Group by floor (descending — highest floor first, like real floor plan)
  const floorGroups = {};
  filteredUnits.forEach(u => {
    if (!floorGroups[u.floor]) floorGroups[u.floor] = [];
    floorGroups[u.floor].push(u);
  });
  const sortedFloors = Object.keys(floorGroups)
    .map(Number)
    .sort((a, b) => b - a); // descending

  function handleProjectChange(pid) {
    const proj = PROJECTS.find(p => p.id === pid);
    if (proj) {
      setSelectedProject(proj);
      setSelectedBlock(proj.blocks[0]);
    }
  }

  function handleQuickAction(action) {
    const labels = {
      call: `Đang gọi cho khách quan tâm ${selectedUnit?.code}...`,
      soft: `Đã mở giữ chỗ mềm cho ${selectedUnit?.code}`,
      hard: `Đang tạo booking chính thức cho ${selectedUnit?.code}`,
      doc: `Đang xuất hồ sơ ${selectedUnit?.code}...`,
    };
    toast.success(labels[action] || 'Thao tác thành công');
    if (action === 'soft' || action === 'hard') setSelectedUnit(null);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">🏢 Bảng giá & Sơ đồ căn hộ</h1>
          <p className="text-sm text-slate-500 mt-0.5">Xem tổng quan giỏ hàng theo tầng, block — click căn để thao tác nhanh</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={warRoomActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setWarRoomActive(a => !a); if (!warRoomActive) toast.success('⚡ Đã bật Chiến Phòng!'); }}
            className={warRoomActive ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'border-red-300 text-red-600 hover:bg-red-50'}
          >
            <Zap className="h-4 w-4 mr-1" /> {warRoomActive ? '⚡ Chiến Phòng ON' : 'Chiến Phòng'}
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
          >
            <Grid3x3 className="h-4 w-4 mr-1" /> Sơ đồ
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('map')}
            className={viewMode === 'map' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
          >
            <Map className="h-4 w-4 mr-1" /> Sơ đồ tổng thể
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
          >
            <ArrowUpDown className="h-4 w-4 mr-1" /> Danh sách
          </Button>
        </div>
      </div>

      {/* Project + Block selectors */}
      <Card className="border shadow-none">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 mb-1 block">Dự án</label>
              <Select value={selectedProject.id} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Block / Tòa</label>
              <div className="flex gap-2">
                {selectedProject.blocks.map(b => (
                  <Button
                    key={b}
                    size="sm"
                    variant={selectedBlock === b ? 'default' : 'outline'}
                    className={selectedBlock === b ? 'bg-[#316585] hover:bg-[#264f68]' : ''}
                    onClick={() => setSelectedBlock(b)}
                  >
                    Block {b}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Trạng thái</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="available">Còn hàng</SelectItem>
                  <SelectItem value="reserved">Giữ chỗ</SelectItem>
                  <SelectItem value="booked">Đặt cọc</SelectItem>
                  <SelectItem value="sold">Đã bán</SelectItem>
                  <SelectItem value="held">Đang giữ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Loại căn</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Object.entries(UNIT_TYPES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* War Room Mode */}
      {warRoomActive && (
        <WarRoomMode
          units={allUnits}
          eventName={`Mở bán ${selectedProject.name} — Block ${selectedBlock}`}
          eventEndTime={Date.now() + 2 * 3600 * 1000}
          onUnitLock={(code, exp) => toast.info(`Căn ${code} đã bị khóa đến ${new Date(exp).toLocaleTimeString('vi-VN')}`)}
          onClose={() => setWarRoomActive(false)}
        />
      )}

      {/* Stats */}
      <StatsBar units={allUnits} />

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Legend />
      </div>

      {/* Floor Plan Grid */}
      {viewMode === 'grid' ? (
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              {selectedProject.name} — Block {selectedBlock}
              <Badge variant="outline">{filteredUnits.filter(u => u.status === 'available').length} căn còn hàng</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="space-y-1.5 min-w-[400px]">
                {sortedFloors.map(floor => (
                  <div key={floor} className="flex items-center gap-2">
                    {/* Floor label */}
                    <div className="w-12 flex-shrink-0 text-right">
                      <span className="text-xs font-bold text-slate-400">T{floor}</span>
                    </div>
                    {/* Units in floor */}
                    <div className="flex gap-1.5 flex-wrap">
                      {floorGroups[floor].map(unit => (
                        <UnitCell key={unit.id} unit={unit} onClick={setSelectedUnit} />
                      ))}
                    </div>
                  </div>
                ))}
                {sortedFloors.length === 0 && (
                  <div className="py-10 text-center text-slate-400">
                    <Home className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>Không có căn nào phù hợp bộ lọc</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'map' ? (
        /* Interactive Map View */
        <InteractiveMasterPlan 
          project={selectedProject} 
          block={selectedBlock}
          units={filteredUnits}
          onUnitSelect={setSelectedUnit}
        />
      ) : (
        /* List view */
        <Card className="border shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {selectedProject.name} — Block {selectedBlock} · {filteredUnits.length} căn
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Mã căn', 'Tầng', 'Loại', 'DT (m²)', 'Giá', 'Giá/m²', 'Hướng', 'View', 'Trạng thái', ''].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUnits.sort((a,b) => b.floor - a.floor || a.unit - b.unit).map(unit => {
                    const st = STATUS_CONFIG[unit.status];
                    return (
                      <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{unit.code}</td>
                        <td className="px-3 py-2.5 text-slate-600">T{unit.floor}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded" 
                            style={{ background: UNIT_TYPES[unit.type].color }}>
                            {UNIT_TYPES[unit.type].label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{unit.area}</td>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{formatPrice(unit.price)}</td>
                        <td className="px-3 py-2.5 text-slate-500 text-xs">{formatPricePerSqm(unit.pricePerSqm)}</td>
                        <td className="px-3 py-2.5 text-slate-500">{unit.direction}</td>
                        <td className="px-3 py-2.5 text-slate-500">{unit.view}</td>
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${st.bg} ${st.border} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {st.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {unit.status !== 'sold' && (
                            <Button variant="ghost" size="sm" onClick={() => setSelectedUnit(unit)}
                              className="text-[#316585] hover:text-[#264f68] h-7 text-xs">
                              Chi tiết
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUnits.length === 0 && (
                <div className="py-10 text-center text-slate-400">Không có căn nào phù hợp</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unit Detail Dialog — with Mortgage Calculator tab */}
      {selectedUnit && (
        <Dialog open={!!selectedUnit} onOpenChange={() => { setSelectedUnit(null); setUnitDialogTab('info'); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center gap-2">
                🏠 Căn {selectedUnit.code}
                <Badge className={`border ${STATUS_CONFIG[selectedUnit.status].bg} ${STATUS_CONFIG[selectedUnit.status].border} ${STATUS_CONFIG[selectedUnit.status].text}`}>
                  {STATUS_CONFIG[selectedUnit.status].label}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            {/* Tab switcher */}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
              {[
                { id: 'info', label: <><Info className="w-3.5 h-3.5 mr-1.5" />Thông tin căn</>, },
                { id: 'mortgage', label: <><Calculator className="w-3.5 h-3.5 mr-1.5" />Tính vay vốn</>, },
              ].map(t => (
                <button key={t.id}
                  className={`flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${unitDialogTab === t.id ? 'bg-white shadow text-[#316585]' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={() => setUnitDialogTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab: Info */}
            {unitDialogTab === 'info' && (
              <div className="space-y-3">
                {/* Price highlight */}
                <div className="rounded-xl bg-gradient-to-r from-[#316585]/10 to-[#316585]/5 border border-[#316585]/20 p-4">
                  <div className="text-2xl font-bold text-[#316585]">{formatPrice(selectedUnit.price)}</div>
                  <div className="text-sm text-slate-500 mt-0.5">{formatPricePerSqm(selectedUnit.pricePerSqm)}</div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  {[
                    { label: 'Loại căn', value: UNIT_TYPES[selectedUnit.type]?.label },
                    { label: 'Diện tích', value: `${selectedUnit.area} m²` },
                    { label: 'Tầng', value: `Tầng ${selectedUnit.floor}` },
                    { label: 'Hướng', value: selectedUnit.direction },
                    { label: 'View', value: selectedUnit.view },
                    { label: 'Block', value: selectedBlock },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-slate-50 p-2.5">
                      <div className="text-xs text-slate-400">{label}</div>
                      <div className="font-semibold text-slate-800 mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Thao tác nhanh</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => handleQuickAction('call')} variant="outline" className="gap-2 text-sm h-9">
                      <Phone className="w-3.5 h-3.5" /> Gọi cho khách
                    </Button>
                    <Button onClick={() => handleQuickAction('doc')} variant="outline" className="gap-2 text-sm h-9">
                      <FileText className="w-3.5 h-3.5" /> Xuất hồ sơ
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-sm h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
                      onClick={() => setUnitDialogTab('mortgage')}
                    >
                      <Calculator className="w-3.5 h-3.5" /> Tính vay vốn
                    </Button>
                    {selectedUnit.status === 'available' && (
                      <>
                        <Button onClick={() => handleQuickAction('soft')} variant="outline" className="gap-2 text-sm h-9 border-amber-300 text-amber-700 hover:bg-amber-50">
                          <Bookmark className="w-3.5 h-3.5" /> Giữ chỗ mềm
                        </Button>
                        <Link to="/sales/bookings" className="contents">
                          <Button className="gap-2 text-sm h-9 bg-[#316585] hover:bg-[#264f68] col-span-2">
                            <ChevronRight className="w-3.5 h-3.5" /> Đặt cọc ngay
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Mortgage Calculator */}
            {unitDialogTab === 'mortgage' && (
              <div className="max-h-[70vh] overflow-y-auto pr-1">
                <MortgageCalculator
                  unitPrice={selectedUnit.price}
                  unitCode={selectedUnit.code}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
