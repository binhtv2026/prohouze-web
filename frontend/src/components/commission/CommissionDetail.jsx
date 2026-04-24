/**
 * Commission Detail Modal/Component
 * Prompt 11/20 - Commission Engine + Snapshot Backward Compatibility
 * 
 * Hiển thị chi tiết commission record với:
 * - Record mới: Full snapshot info
 * - Record cũ (legacy): Warning + fallback display
 */

import React from 'react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { AlertTriangle, CheckCircle, Lock, FileText, User, Building, DollarSign } from 'lucide-react';

// Format currency VND
const formatCurrency = (amount) => {
  if (!amount) return '0 đ';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

export default function CommissionDetail({ record, onClose }) {
  if (!record) return null;

  const isLegacy = record.is_legacy;

  return (
    <div className="space-y-4">
      {/* Legacy Warning Banner */}
      {isLegacy && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Record Legacy (Ước tính)</p>
            <p className="text-sm text-amber-700 mt-1">
              {record.legacy_warning || 
                "Record này được tạo trước khi hệ thống snapshot. Giá trị hiển thị dựa trên dữ liệu gốc, không có chi tiết policy."}
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{record.code}</h3>
            {isLegacy && (
              <Badge variant="outline" className="border-amber-500 text-amber-700">
                Legacy
              </Badge>
            )}
            {record.is_locked && (
              <Badge variant="outline" className="border-gray-500 text-gray-600">
                <Lock className="w-3 h-3 mr-1" />
                Đã khóa
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">{record.contract_code}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(record.final_amount)}</p>
          <Badge className={
            record.status === 'paid' ? 'bg-emerald-600' :
            record.status === 'approved' ? 'bg-green-500' :
            record.status === 'pending_approval' ? 'bg-orange-500' : ''
          }>
            {record.status_label}
          </Badge>
        </div>
      </div>

      <Separator />

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-4">
        <InfoItem icon={User} label="Người nhận" value={record.recipient_name} />
        <InfoItem icon={Building} label="Vai trò" value={record.recipient_role_label || record.recipient_role} />
        <InfoItem icon={FileText} label="Dự án" value={record.project_name} />
        <InfoItem icon={DollarSign} label="Khách hàng" value={record.customer_name} />
      </div>

      <Separator />

      {/* Calculation Details */}
      <Card className={isLegacy ? 'border-amber-200 bg-amber-50' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            Chi tiết tính toán
            {isLegacy && <Badge variant="outline" className="text-xs border-amber-500 text-amber-700">Ước tính</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLegacy ? (
            // Record mới - có đầy đủ snapshot
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Giá trị HĐ (Base)</p>
                  <p className="font-medium">{formatCurrency(record.base_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tỷ lệ phí MG</p>
                  <p className="font-medium">{record.brokerage_rate}%</p>
                </div>
                <div>
                  <p className="text-gray-500">Phí môi giới</p>
                  <p className="font-medium">{formatCurrency(record.brokerage_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Tỷ lệ chia</p>
                  <p className="font-medium">{record.split_percent}%</p>
                </div>
              </div>
              
              {/* Formula */}
              <div className="bg-gray-100 rounded-lg p-3 mt-3">
                <p className="text-xs text-gray-500 mb-1">Công thức</p>
                <p className="font-mono text-sm">{record.applied_formula}</p>
              </div>

              {/* Policy Snapshot */}
              {record.rule_snapshot && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-600 font-medium mb-2">Policy Snapshot (tại thời điểm tính)</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Tên policy:</span>
                      <span className="ml-1 font-medium">{record.rule_snapshot.policy_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <span className="ml-1 font-medium">v{record.rule_snapshot.policy_version}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Trigger:</span>
                      <span className="ml-1 font-medium">{record.rule_snapshot.trigger_event}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Snapshot:</span>
                      <span className="ml-1 font-medium">{new Date(record.rule_snapshot.snapshot_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Split Structure */}
              {record.split_structure && (
                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-green-600 font-medium mb-2">Split Structure</p>
                  <div className="text-xs space-y-1">
                    <div><span className="text-gray-500">Type:</span> <span className="font-medium">{record.split_structure.split_type}</span></div>
                    <div><span className="text-gray-500">Calc:</span> <span className="font-medium">{record.split_structure.calc_type}</span></div>
                    <div><span className="text-gray-500">Value:</span> <span className="font-medium">{record.split_structure.calc_value}%</span></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Record cũ (Legacy) - không có snapshot chi tiết
            <div className="text-center py-6">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-amber-700 font-medium">Không có chi tiết tính toán</p>
              <p className="text-sm text-amber-600 mt-2">
                Record này được tạo trước khi hệ thống lưu snapshot.
              </p>
              <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                <p className="text-xs text-gray-500">Giá trị gốc (không xác nhận được formula)</p>
                <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(record.final_amount)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>Tạo lúc: {new Date(record.created_at).toLocaleString('vi-VN')}</p>
        {record.calculated_at && <p>Tính lúc: {new Date(record.calculated_at).toLocaleString('vi-VN')}</p>}
        {record.locked_at && <p>Khóa lúc: {new Date(record.locked_at).toLocaleString('vi-VN')}</p>}
      </div>
    </div>
  );
}

// Helper component
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-4 h-4 text-gray-400" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium">{value || 'N/A'}</p>
      </div>
    </div>
  );
}
