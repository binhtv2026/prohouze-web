/**
 * Contract Amendments Tab
 * Shows parent contract link, amendment list (PL-01, PL-02...), field changes
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { contractApi } from '@/lib/contractApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FilePlus,
  FileText,
  ArrowRight,
  Calendar,
  User,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

const AMENDMENT_TYPES = [
  { value: 'price_change', label: 'Thay đổi giá', icon: '💰' },
  { value: 'schedule_change', label: 'Thay đổi tiến độ', icon: '📅' },
  { value: 'info_change', label: 'Thay đổi thông tin', icon: '📝' },
  { value: 'unit_change', label: 'Đổi căn', icon: '🏠' },
  { value: 'extension', label: 'Gia hạn', icon: '⏰' },
  { value: 'special_terms', label: 'Điều khoản đặc biệt', icon: '⚡' },
  { value: 'general', label: 'Phụ lục chung', icon: '📋' },
];

export default function ContractAmendmentsTab({ contract, amendments, isLocked, onRefresh }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    amendment_type: '',
    reason: '',
    changes_summary: '',
    effective_date: '',
    notes: '',
    changed_fields: [],
  });

  const handleCreate = async () => {
    if (!formData.amendment_type || !formData.reason || !formData.changes_summary) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setCreating(true);
    try {
      await contractApi.createAmendment(contract.id, {
        ...formData,
        parent_contract_id: contract.id,
      });
      toast.success('Đã tạo Phụ lục');
      setShowCreateDialog(false);
      setFormData({
        amendment_type: '',
        reason: '',
        changes_summary: '',
        effective_date: '',
        notes: '',
        changed_fields: [],
      });
      onRefresh();
    } catch (error) {
      toast.error(error.message || 'Lỗi tạo Phụ lục');
    } finally {
      setCreating(false);
    }
  };

  const getAmendmentTypeLabel = (type) => {
    const found = AMENDMENT_TYPES.find(t => t.value === type);
    return found ? `${found.icon} ${found.label}` : type;
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-700' },
      pending_approval: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-700' },
      active: { label: 'Có hiệu lực', className: 'bg-blue-100 text-blue-700' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700' },
    };
    const badge = badges[status] || badges.draft;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="amendments-tab">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-[#316585]" />
            Phụ lục hợp đồng
          </h3>
          <Badge variant="secondary">{amendments.length}</Badge>
        </div>

        {isLocked && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[#316585] hover:bg-[#265270]" data-testid="create-amendment-btn">
                <FilePlus className="w-4 h-4 mr-2" />
                Tạo Phụ lục mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Tạo Phụ lục hợp đồng</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Loại phụ lục *</label>
                  <Select 
                    value={formData.amendment_type} 
                    onValueChange={(v) => setFormData({...formData, amendment_type: v})}
                  >
                    <SelectTrigger className="mt-1" data-testid="amendment-type-select">
                      <SelectValue placeholder="Chọn loại phụ lục" />
                    </SelectTrigger>
                    <SelectContent>
                      {AMENDMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Lý do thay đổi *</label>
                  <Input
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Nhập lý do..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tóm tắt thay đổi *</label>
                  <Textarea
                    value={formData.changes_summary}
                    onChange={(e) => setFormData({...formData, changes_summary: e.target.value})}
                    placeholder="Mô tả chi tiết các thay đổi..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Ngày hiệu lực</label>
                  <Input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({...formData, effective_date: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Ghi chú</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Ghi chú thêm..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Hủy
                  </Button>
                  <Button 
                    onClick={handleCreate}
                    disabled={creating}
                    className="bg-[#316585] hover:bg-[#265270]"
                    data-testid="confirm-create-amendment-btn"
                  >
                    {creating ? 'Đang tạo...' : 'Tạo Phụ lục'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Info Alert for Locked Contracts */}
      {isLocked && (
        <Card className="bg-amber-50 border border-amber-200 shadow-sm">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Hợp đồng đã khóa</p>
              <p className="text-sm text-amber-700">
                Để thay đổi thông tin hợp đồng (giá, tiến độ, thông tin KH...), bạn cần tạo Phụ lục. 
                Phụ lục sẽ được đánh số tự động (PL-01, PL-02...) và liên kết với hợp đồng gốc.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parent Contract Reference */}
      {contract.parent_contract_id && (
        <Card className="bg-blue-50 border border-blue-200 shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-blue-600 mb-2">Hợp đồng gốc</p>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              <span className="font-medium text-blue-800">{contract.parent_contract_code}</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span className="text-blue-700">Phụ lục số {contract.amendment_number}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amendments List */}
      {amendments.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center text-slate-500">
            <FilePlus className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có phụ lục nào</p>
            {isLocked && (
              <p className="text-sm">Click "Tạo Phụ lục mới" để thêm</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {amendments.map((amendment) => (
            <Card key={amendment.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-[#316585]/10 flex items-center justify-center">
                      <FilePlus className="w-6 h-6 text-[#316585]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-[#316585]">{amendment.amendment_code}</span>
                        {getStatusBadge(amendment.status)}
                      </div>
                      <p className="text-sm font-medium">{getAmendmentTypeLabel(amendment.amendment_type)}</p>
                      <p className="text-sm text-slate-600 mt-1">{amendment.reason}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Tạo bởi: {amendment.created_by_name || '-'} | {formatDate(amendment.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    {amendment.effective_date && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Hiệu lực: {formatDate(amendment.effective_date)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Changes Summary */}
                {amendment.changes_summary && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Tóm tắt thay đổi</p>
                    <p className="text-sm text-slate-700">{amendment.changes_summary}</p>
                  </div>
                )}

                {/* Changed Fields */}
                {amendment.changed_fields && amendment.changed_fields.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Chi tiết thay đổi</p>
                    <div className="space-y-2">
                      {amendment.changed_fields.map((field, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm bg-amber-50 p-2 rounded">
                          <Edit className="w-4 h-4 text-amber-600" />
                          <span className="font-medium">{field.field_name}:</span>
                          <span className="text-slate-500 line-through">{field.old_value}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="text-green-600 font-medium">{field.new_value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
