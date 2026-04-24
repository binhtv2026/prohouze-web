/**
 * Contract Financial Tab
 * Shows: contract value, deposit, payment progress, installment table, Finance Timeline
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  CreditCard,
  Percent,
} from 'lucide-react';
import ContractFinanceTimeline from './ContractFinanceTimeline';

export default function ContractFinancialTab({ contract, isLocked }) {
  const paymentSchedule = contract.payment_schedule || [];
  
  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chưa TT', className: 'bg-slate-100 text-slate-600' },
      partial: { label: 'TT một phần', className: 'bg-amber-100 text-amber-700' },
      paid: { label: 'Đã TT', className: 'bg-green-100 text-green-700' },
      overdue: { label: 'Quá hạn', className: 'bg-red-100 text-red-700' },
    };
    const badge = badges[status] || badges.pending;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="financial-tab">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Giá trị HĐ</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {formatCurrency(contract.grand_total)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Đã thanh toán</p>
                <p className="text-xl font-bold text-green-600 mt-1">
                  {formatCurrency(contract.total_paid)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Còn lại</p>
                <p className="text-xl font-bold text-orange-600 mt-1">
                  {formatCurrency(contract.remaining_amount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Quá hạn</p>
                <p className="text-xl font-bold text-red-600 mt-1">
                  {formatCurrency(contract.overdue_amount)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Progress */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#316585]" />
              Tiến độ thanh toán
            </span>
            <span className="text-2xl font-bold text-[#316585]">
              {contract.payment_completion_percent?.toFixed(1)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress 
            value={contract.payment_completion_percent || 0} 
            className="h-4 bg-slate-100"
          />
          <div className="flex justify-between mt-2 text-sm text-slate-500">
            <span>Đã TT: {formatCurrency(contract.total_paid)}</span>
            <span>Còn lại: {formatCurrency(contract.remaining_amount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#316585]" />
            Chi tiết giá trị
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-dashed">
              <span className="text-slate-600">Đơn giá</span>
              <span className="font-medium">{formatCurrency(contract.unit_price)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed">
              <span className="text-slate-600">Diện tích</span>
              <span className="font-medium">{contract.unit_area} m²</span>
            </div>
            {contract.price_per_sqm > 0 && (
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-slate-600">Giá/m²</span>
                <span className="font-medium">{formatCurrency(contract.price_per_sqm)}</span>
              </div>
            )}
            {contract.premium_adjustments !== 0 && (
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-slate-600">Điều chỉnh</span>
                <span className="font-medium text-amber-600">
                  {contract.premium_adjustments > 0 ? '+' : ''}{formatCurrency(contract.premium_adjustments)}
                </span>
              </div>
            )}
            {contract.discount_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-slate-600">Chiết khấu ({contract.discount_percent}%)</span>
                <span className="font-medium text-green-600">-{formatCurrency(contract.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-dashed">
              <span className="text-slate-600">Giá trị HĐ</span>
              <span className="font-medium">{formatCurrency(contract.contract_value)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dashed">
              <span className="text-slate-600">VAT ({contract.vat_percent}%)</span>
              <span className="font-medium">{formatCurrency(contract.vat_amount)}</span>
            </div>
            {contract.maintenance_fee > 0 && (
              <div className="flex justify-between py-2 border-b border-dashed">
                <span className="text-slate-600">Phí bảo trì</span>
                <span className="font-medium">{formatCurrency(contract.maintenance_fee)}</span>
              </div>
            )}
            <div className="flex justify-between py-3 bg-[#316585]/5 -mx-4 px-4 rounded-lg">
              <span className="font-semibold text-[#316585]">TỔNG GIÁ TRỊ</span>
              <span className="font-bold text-[#316585] text-lg">{formatCurrency(contract.grand_total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Information */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#316585]" />
            Tiền cọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase">Số tiền cọc</p>
              <p className="font-semibold text-lg">{formatCurrency(contract.deposit_amount)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Đã đóng</p>
              <p className="font-semibold text-lg text-green-600">{formatCurrency(contract.deposit_paid)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Ngày đóng</p>
              <p className="font-medium">{formatDate(contract.deposit_paid_date) || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase">Trạng thái</p>
              {getPaymentStatusBadge(contract.deposit_status)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Schedule Table */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#316585]" />
            Lịch thanh toán
            {contract.payment_plan_name && (
              <Badge variant="outline">{contract.payment_plan_name}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {paymentSchedule.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              Chưa có lịch thanh toán
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold">Đợt</TableHead>
                  <TableHead className="font-semibold">Mô tả</TableHead>
                  <TableHead className="font-semibold">Ngày đến hạn</TableHead>
                  <TableHead className="font-semibold text-right">Số tiền</TableHead>
                  <TableHead className="font-semibold text-right">Đã TT</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentSchedule.map((installment, index) => (
                  <TableRow key={index} className={installment.status === 'overdue' ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{installment.installment_number || index + 1}</TableCell>
                    <TableCell>{installment.description || `Đợt ${index + 1}`}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(installment.due_date)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(installment.amount)}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {formatCurrency(installment.paid_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(installment.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Next Payment Alert */}
      {contract.next_due_date && contract.next_due_amount > 0 && (
        <Card className="bg-amber-50 border border-amber-200 shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Đợt thanh toán tiếp theo</p>
              <p className="text-sm text-amber-700">
                <span className="font-medium">{formatCurrency(contract.next_due_amount)}</span>
                {' - '}Hạn: {formatDate(contract.next_due_date)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Finance Timeline - Flow from contract signed to payout */}
      <ContractFinanceTimeline contractId={contract.id} />
    </div>
  );
}
