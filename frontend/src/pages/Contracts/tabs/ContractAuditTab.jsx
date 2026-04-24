/**
 * Contract Audit Tab
 * Shows full audit trail of all actions
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import {
  History,
  User,
  FileText,
  CheckCircle,
  XCircle,
  Send,
  Pen,
  Edit,
  Plus,
  Clock,
  AlertTriangle,
} from 'lucide-react';

const ACTION_CONFIG = {
  create: { label: 'Tạo mới', icon: Plus, color: 'bg-blue-100 text-blue-700' },
  update: { label: 'Cập nhật', icon: Edit, color: 'bg-amber-100 text-amber-700' },
  submit: { label: 'Gửi duyệt', icon: Send, color: 'bg-purple-100 text-purple-700' },
  approve: { label: 'Phê duyệt', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  reject: { label: 'Từ chối', icon: XCircle, color: 'bg-red-100 text-red-700' },
  sign: { label: 'Ký hợp đồng', icon: Pen, color: 'bg-emerald-100 text-emerald-700' },
  activate: { label: 'Kích hoạt', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  complete: { label: 'Hoàn thành', icon: CheckCircle, color: 'bg-teal-100 text-teal-700' },
  cancel: { label: 'Hủy', icon: XCircle, color: 'bg-red-100 text-red-700' },
  amendment: { label: 'Tạo phụ lục', icon: FileText, color: 'bg-orange-100 text-orange-700' },
  payment: { label: 'Thanh toán', icon: FileText, color: 'bg-green-100 text-green-700' },
};

export default function ContractAuditTab({ auditLogs }) {
  const getActionConfig = (action) => {
    return ACTION_CONFIG[action] || { 
      label: action, 
      icon: Clock, 
      color: 'bg-slate-100 text-slate-700' 
    };
  };

  return (
    <div className="space-y-6" data-testid="audit-tab">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <History className="w-5 h-5 text-[#316585]" />
          Lịch sử hoạt động
        </h3>
        <Badge variant="secondary">{auditLogs.length}</Badge>
      </div>

      {/* Timeline */}
      {auditLogs.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center text-slate-500">
            <History className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có lịch sử hoạt động</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200" />

              <div className="space-y-6">
                {auditLogs.map((log, index) => {
                  const config = getActionConfig(log.action);
                  const Icon = config.icon;

                  return (
                    <div key={log.id || index} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className={`
                        relative z-10 w-12 h-12 rounded-full flex items-center justify-center
                        ${config.color}
                      `}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{config.label}</span>
                            <Badge variant="outline" className="text-xs">
                              {log.action}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-500">
                            {formatDate(log.timestamp, true)}
                          </span>
                        </div>

                        {log.description && (
                          <p className="text-sm text-slate-600 mt-1">{log.description}</p>
                        )}

                        {/* User info */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <User className="w-3 h-3" />
                          <span>{log.performed_by_name || log.performed_by || 'Hệ thống'}</span>
                        </div>

                        {/* Changes */}
                        {log.changes && Object.keys(log.changes).length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Thay đổi</p>
                            <div className="space-y-1">
                              {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="flex items-center gap-2 text-xs">
                                  <span className="font-medium text-slate-600">{field}:</span>
                                  {change.old_value !== undefined && (
                                    <>
                                      <span className="text-slate-400 line-through">{String(change.old_value)}</span>
                                      <span className="text-slate-400">→</span>
                                    </>
                                  )}
                                  <span className="text-green-600">{String(change.new_value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <Badge key={key} variant="outline" className="text-xs">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* IP Address */}
                        {log.ip_address && (
                          <div className="mt-2 text-xs text-slate-400">
                            IP: {log.ip_address}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
