/**
 * Contract Overview Tab
 * Basic contract information display
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  User,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  FileText,
  Tag,
} from 'lucide-react';

export default function ContractOverviewTab({ contract, isLocked }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="overview-tab">
      {/* Contract Information */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#316585]" />
            Thông tin Hợp đồng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Mã hợp đồng</label>
              <p className="font-semibold text-[#316585]">{contract.contract_code}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Loại hợp đồng</label>
              <p className="font-medium">{contract.contract_type_label || contract.contract_type}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Ngày tạo</label>
              <p className="font-medium">{formatDate(contract.created_at)}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Ngày hợp đồng</label>
              <p className="font-medium">{formatDate(contract.contract_date) || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Ngày hiệu lực</label>
              <p className="font-medium">{formatDate(contract.effective_date) || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Ngày hết hạn</label>
              <p className="font-medium">{formatDate(contract.expiry_date) || '-'}</p>
            </div>
          </div>

          {/* Tags */}
          {contract.tags && contract.tags.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </label>
              <div className="flex flex-wrap gap-2 mt-1">
                {contract.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {contract.notes && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Ghi chú</label>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-1">
                {contract.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Information */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-[#316585]" />
            Thông tin Khách hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#316585]/10 flex items-center justify-center">
              <User className="w-8 h-8 text-[#316585]" />
            </div>
            <div>
              <p className="font-semibold text-lg">{contract.customer_name || 'Chưa có thông tin'}</p>
              <p className="text-sm text-slate-500">Mã KH: {contract.customer_id?.slice(0, 8) || '-'}</p>
            </div>
          </div>

          {/* Co-owners */}
          {contract.co_owners && contract.co_owners.length > 0 && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Đồng sở hữu</label>
              <div className="mt-1 space-y-1">
                {contract.co_owners.map((owner, i) => (
                  <div key={i} className="text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {owner}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Information */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5 text-[#316585]" />
            Thông tin Sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Mã sản phẩm</label>
              <p className="font-semibold text-[#316585]">{contract.product_code || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Tên sản phẩm</label>
              <p className="font-medium">{contract.product_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Dự án</label>
              <p className="font-medium">{contract.project_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Diện tích</label>
              <p className="font-medium">{contract.unit_area ? `${contract.unit_area} m²` : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Information */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-[#316585]" />
            Thông tin Sales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Người tạo</label>
              <p className="font-medium">{contract.created_by_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Chủ sở hữu</label>
              <p className="font-medium">{contract.owner_name || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Chi nhánh</label>
              <p className="font-medium">{contract.branch_id || '-'}</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide">Deal</label>
              <p className="font-medium">{contract.deal_id?.slice(0, 8) || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
