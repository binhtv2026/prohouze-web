/**
 * CEO Trust Panel - Block bổ sung cho CEO Dashboard
 * 
 * Hiển thị:
 * - Tổng tiền đã thu
 * - Tổng tiền đã chi
 * - Lợi nhuận thực = Doanh thu - Commission - Chi phí
 * 
 * Minh bạch tuyệt đối cho CEO
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  TrendingUp, TrendingDown, DollarSign, PieChart, Shield, Eye
} from 'lucide-react';

// Format VND
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export default function CEOTrustPanel({ data }) {
  // Extract data with defaults
  const {
    total_collected = 0,      // Tổng tiền đã thu từ CĐT
    total_paid_out = 0,       // Tổng tiền đã chi trả
    total_expenses = 0,       // Chi phí khác (nếu có)
    total_revenue = 0,        // Doanh thu = commission + VAT
    total_commission = 0,     // Tổng hoa hồng
    company_keep = 0,         // Công ty giữ (25-30%)
  } = data || {};
  
  // Lợi nhuận thực = Doanh thu - Đã chi - Chi phí
  // Hoặc = Tiền đã thu - Đã chi
  const real_profit = total_collected - total_paid_out - total_expenses;
  const profit_margin = total_collected > 0 
    ? (real_profit / total_collected * 100).toFixed(1)
    : 0;
  
  // Determine profit status
  const isProfitable = real_profit > 0;
  
  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white" data-testid="ceo-trust-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Trust Panel - Minh bạch tuyệt đối
          </CardTitle>
          <Badge variant="outline" className="text-blue-600 border-blue-200 text-xs">
            <Eye className="w-3 h-3 mr-1" />
            CEO View
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Stats - Clear labels */}
        <div className="grid grid-cols-3 gap-3">
          {/* Tổng thu */}
          <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-green-700" data-testid="trust-total-collected">
              {formatCurrency(total_collected)}
            </p>
            <p className="text-xs text-green-600 mt-1 font-medium">Đã thu từ CĐT</p>
          </div>
          
          {/* Tổng chi */}
          <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <TrendingDown className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-red-700" data-testid="trust-total-paid">
              {formatCurrency(total_paid_out)}
            </p>
            <p className="text-xs text-red-600 mt-1 font-medium">Chi trả nội bộ</p>
          </div>
          
          {/* Lợi nhuận thực */}
          <div className={`text-center p-3 rounded-lg border ${
            isProfitable 
              ? 'bg-blue-50 border-blue-100' 
              : 'bg-yellow-50 border-yellow-100'
          }`}>
            <div className={`flex items-center justify-center gap-1 mb-1 ${
              isProfitable ? 'text-blue-600' : 'text-yellow-600'
            }`}>
              <PieChart className="w-4 h-4" />
            </div>
            <p className={`text-2xl font-bold ${
              isProfitable ? 'text-blue-700' : 'text-yellow-700'
            }`} data-testid="trust-real-profit">
              {formatCurrency(real_profit)}
            </p>
            <p className={`text-xs mt-1 font-medium ${
              isProfitable ? 'text-blue-600' : 'text-yellow-600'
            }`}>Lợi nhuận thực</p>
          </div>
        </div>
        
        {/* Profit Margin with label */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-600 font-medium">Biên lợi nhuận</span>
            <span className={`text-sm font-bold ${
              isProfitable ? 'text-green-600' : 'text-red-600'
            }`}>
              {profit_margin}%
            </span>
          </div>
          
          {/* Progress bar with percentage in middle */}
          <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                isProfitable ? 'bg-green-500' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(Math.abs(parseFloat(profit_margin)), 100)}%` }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
              {profit_margin}%
            </span>
          </div>
        </div>
        
        {/* Breakdown with clear labels */}
        <div className="space-y-2 border-t pt-3">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Chi tiết</p>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 flex items-center gap-2">
              <DollarSign className="w-3 h-3" />
              Doanh thu (commission + VAT)
            </span>
            <span className="font-semibold">{formatCurrency(total_revenue)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" />
              Công ty giữ (25-30%)
            </span>
            <span className="font-semibold text-blue-600">{formatCurrency(company_keep)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 flex items-center gap-2">
              <TrendingDown className="w-3 h-3" />
              Chi trả cho nhân viên
            </span>
            <span className="font-semibold text-orange-600">-{formatCurrency(total_paid_out)}</span>
          </div>
          {total_expenses > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Chi phí khác</span>
              <span className="font-semibold text-red-600">-{formatCurrency(total_expenses)}</span>
            </div>
          )}
        </div>
        
        {/* Trust message */}
        <div className={`p-2 rounded text-xs text-center font-medium ${
          isProfitable 
            ? 'bg-green-100 text-green-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isProfitable 
            ? '✓ Dòng tiền dương - Hoạt động có lãi'
            : '⚠ Cần kiểm tra - Chi nhiều hơn thu'
          }
        </div>
      </CardContent>
    </Card>
  );
}
