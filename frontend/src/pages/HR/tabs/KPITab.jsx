/**
 * KPI Tab - KPI / Thu nhập / Hoa hồng
 */

import React, { useState } from 'react';
import { TrendingUp, DollarSign, Target, Calendar, BarChart3 } from 'lucide-react';

const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const RATING_COLORS = {
  'A': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Xuất sắc' },
  'B': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Tốt' },
  'C': { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Đạt' },
  'D': { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Cần cải thiện' },
  'E': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Không đạt' },
};

export default function KPITab({ profileId, kpiRecords, profile }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filteredRecords = kpiRecords?.filter(r => r.period_year === selectedYear) || [];
  
  // Calculate summary
  const summary = filteredRecords.reduce((acc, r) => ({
    totalDeals: acc.totalDeals + (r.deals_count || 0),
    totalValue: acc.totalValue + (r.deals_value || 0),
    totalRevenue: acc.totalRevenue + (r.revenue || 0),
    totalCommission: acc.totalCommission + (r.commission_earned || 0),
  }), { totalDeals: 0, totalValue: 0, totalRevenue: 0, totalCommission: 0 });

  const formatCurrency = (amount) => {
    if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(0)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  // Get unique years from records
  const availableYears = [...new Set(kpiRecords?.map(r => r.period_year) || [])];
  if (!availableYears.includes(new Date().getFullYear())) {
    availableYears.push(new Date().getFullYear());
  }
  availableYears.sort((a, b) => b - a);

  return (
    <div data-testid="kpi-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-cyan-400" />
          KPI / Thu nhập / Hoa hồng
        </h3>
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-gray-400" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Target className="text-cyan-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">{profile?.total_deals || summary.totalDeals}</span>
          </div>
          <div className="text-gray-400 text-sm mt-2">Tổng Deals</div>
          <div className="text-cyan-400 text-xs">{selectedYear}</div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <BarChart3 className="text-purple-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">{formatCurrency(profile?.total_revenue || summary.totalValue)}</span>
          </div>
          <div className="text-gray-400 text-sm mt-2">Giá trị Deals</div>
          <div className="text-purple-400 text-xs">VND</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="text-emerald-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">{formatCurrency(summary.totalRevenue)}</span>
          </div>
          <div className="text-gray-400 text-sm mt-2">Doanh thu</div>
          <div className="text-emerald-400 text-xs">VND</div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <DollarSign className="text-amber-400" size={20} />
            </div>
            <span className="text-2xl font-bold text-white">{formatCurrency(profile?.total_commission || summary.totalCommission)}</span>
          </div>
          <div className="text-gray-400 text-sm mt-2">Hoa hồng</div>
          <div className="text-amber-400 text-xs">VND</div>
        </div>
      </div>

      {/* Monthly KPI Table */}
      <div className="bg-gray-800/30 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h4 className="text-white font-medium">Chi tiết theo tháng - {selectedYear}</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                <th className="px-4 py-3">Tháng</th>
                <th className="px-4 py-3 text-right">Deals</th>
                <th className="px-4 py-3 text-right">Giá trị</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
                <th className="px-4 py-3 text-right">Hoa hồng</th>
                <th className="px-4 py-3 text-center">KPI %</th>
                <th className="px-4 py-3 text-center">Xếp hạng</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {MONTHS.map((monthName, idx) => {
                const monthData = filteredRecords.find(r => r.period_month === idx + 1);
                const kpiPercent = monthData?.kpi_percentage || 0;
                const rating = monthData?.rating;
                const ratingStyle = rating ? RATING_COLORS[rating] : null;
                
                return (
                  <tr key={idx} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-medium">{monthName}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{monthData?.deals_count || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-400">
                      {monthData?.deals_value ? formatCurrency(monthData.deals_value) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400">
                      {monthData?.revenue ? formatCurrency(monthData.revenue) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right text-amber-400">
                      {monthData?.commission_earned ? formatCurrency(monthData.commission_earned) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {monthData ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${kpiPercent >= 100 ? 'bg-emerald-500' : kpiPercent >= 80 ? 'bg-cyan-500' : kpiPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(kpiPercent, 100)}%` }}
                            ></div>
                          </div>
                          <span className={`text-sm ${kpiPercent >= 100 ? 'text-emerald-400' : kpiPercent >= 80 ? 'text-cyan-400' : kpiPercent >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                            {kpiPercent}%
                          </span>
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ratingStyle ? (
                        <span className={`px-2 py-1 rounded-lg text-xs ${ratingStyle.bg} ${ratingStyle.text}`}>
                          {rating} - {ratingStyle.label}
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-800/50">
              <tr className="text-white font-medium">
                <td className="px-4 py-3">Tổng năm {selectedYear}</td>
                <td className="px-4 py-3 text-right">{summary.totalDeals}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(summary.totalValue)}</td>
                <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(summary.totalRevenue)}</td>
                <td className="px-4 py-3 text-right text-amber-400">{formatCurrency(summary.totalCommission)}</td>
                <td className="px-4 py-3 text-center">-</td>
                <td className="px-4 py-3 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Note */}
      {filteredRecords.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto mb-4 text-gray-600" size={48} />
          <p className="text-gray-400">Chưa có dữ liệu KPI cho năm {selectedYear}</p>
          <p className="text-gray-500 text-sm mt-2">Dữ liệu sẽ được cập nhật từ hệ thống Finance</p>
        </div>
      )}
    </div>
  );
}
