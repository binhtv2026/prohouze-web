/**
 * Demand Profile Form Component
 * Prompt 6/20 - CRM Unified Profile Standardization
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { demandsAPI } from '@/lib/crmApi';
import { toast } from 'sonner';

const PROPERTY_TYPES = [
  { value: 'apartment', label: 'Căn hộ' },
  { value: 'villa', label: 'Biệt thự' },
  { value: 'townhouse', label: 'Nhà phố' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'land', label: 'Đất nền' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'duplex', label: 'Duplex' },
];

const PURPOSE_OPTIONS = [
  { value: 'residence', label: 'Để ở' },
  { value: 'investment', label: 'Đầu tư cho thuê' },
  { value: 'flip', label: 'Đầu tư lướt sóng' },
  { value: 'both', label: 'Vừa ở vừa đầu tư' },
  { value: 'business', label: 'Kinh doanh' },
  { value: 'gift', label: 'Tặng/cho con cái' },
];

const URGENCY_OPTIONS = [
  { value: 'immediate', label: 'Cần ngay (< 1 tháng)' },
  { value: 'short_term', label: 'Ngắn hạn (1-3 tháng)' },
  { value: 'medium_term', label: 'Trung hạn (3-6 tháng)' },
  { value: 'long_term', label: 'Dài hạn (> 6 tháng)' },
  { value: 'exploring', label: 'Chỉ tìm hiểu' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Tiền mặt 100%' },
  { value: 'loan', label: 'Vay ngân hàng' },
  { value: 'installment', label: 'Trả góp CĐT' },
  { value: 'mixed', label: 'Kết hợp' },
];

const FLOOR_PREFERENCES = [
  { value: 'low', label: 'Tầng thấp (1-5)' },
  { value: 'mid', label: 'Tầng trung (6-15)' },
  { value: 'high', label: 'Tầng cao (16-25)' },
  { value: 'top', label: 'Tầng cao nhất' },
  { value: 'penthouse', label: 'Penthouse' },
  { value: 'any', label: 'Không quan trọng' },
];

const DIRECTION_OPTIONS = [
  { value: 'east', label: 'Đông' },
  { value: 'west', label: 'Tây' },
  { value: 'south', label: 'Nam' },
  { value: 'north', label: 'Bắc' },
  { value: 'northeast', label: 'Đông Bắc' },
  { value: 'northwest', label: 'Tây Bắc' },
  { value: 'southeast', label: 'Đông Nam' },
  { value: 'southwest', label: 'Tây Nam' },
];

const VIEW_OPTIONS = [
  { value: 'city', label: 'View thành phố' },
  { value: 'river', label: 'View sông' },
  { value: 'sea', label: 'View biển' },
  { value: 'park', label: 'View công viên' },
  { value: 'pool', label: 'View hồ bơi' },
  { value: 'garden', label: 'View vườn' },
  { value: 'mountain', label: 'View núi' },
  { value: 'internal', label: 'View nội khu' },
];

export default function DemandProfileForm({ contacts = [], onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contact_id: '',
    purpose: 'residence',
    urgency: 'exploring',
    budget_min: '',
    budget_max: '',
    payment_method: '',
    property_types: [],
    area_min: '',
    area_max: '',
    bedrooms_min: '',
    bedrooms_max: '',
    preferred_districts: '',
    preferred_cities: '',
    floor_preference: 'any',
    directions: [],
    views: [],
    must_have_features: '',
    special_requirements: '',
    is_active: true,
    confidence_level: 50,
  });

  const handlePropertyTypeChange = (value, checked) => {
    setFormData(prev => ({
      ...prev,
      property_types: checked 
        ? [...prev.property_types, value]
        : prev.property_types.filter(t => t !== value)
    }));
  };

  const handleDirectionChange = (value, checked) => {
    setFormData(prev => ({
      ...prev,
      directions: checked 
        ? [...prev.directions, value]
        : prev.directions.filter(d => d !== value)
    }));
  };

  const handleViewChange = (value, checked) => {
    setFormData(prev => ({
      ...prev,
      views: checked 
        ? [...prev.views, value]
        : prev.views.filter(v => v !== value)
    }));
  };

  const handleSubmit = async () => {
    if (!formData.contact_id) {
      toast.error('Vui lòng chọn Contact');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        ...formData,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        area_min: formData.area_min ? parseFloat(formData.area_min) : null,
        area_max: formData.area_max ? parseFloat(formData.area_max) : null,
        bedrooms_min: formData.bedrooms_min ? parseInt(formData.bedrooms_min) : null,
        bedrooms_max: formData.bedrooms_max ? parseInt(formData.bedrooms_max) : null,
        preferred_districts: formData.preferred_districts 
          ? formData.preferred_districts.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        preferred_cities: formData.preferred_cities 
          ? formData.preferred_cities.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        must_have_features: formData.must_have_features 
          ? formData.must_have_features.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      await demandsAPI.create(payload);
      toast.success('Thêm nhu cầu thành công!');
      onSuccess?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(e => e.msg || e).join(', ')
        : (typeof detail === 'string' ? detail : 'Không thể thêm nhu cầu');
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Cơ bản</TabsTrigger>
          <TabsTrigger value="property">BĐS</TabsTrigger>
          <TabsTrigger value="location">Vị trí</TabsTrigger>
          <TabsTrigger value="preferences">Ưu tiên</TabsTrigger>
        </TabsList>

        {/* Basic Tab */}
        <TabsContent value="basic" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Contact *</Label>
            <Select
              value={formData.contact_id}
              onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
            >
              <SelectTrigger data-testid="demand-contact">
                <SelectValue placeholder="Chọn contact" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map(contact => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.full_name} - {contact.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mục đích</Label>
              <Select
                value={formData.purpose}
                onValueChange={(value) => setFormData({ ...formData, purpose: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Độ khẩn cấp</Label>
              <Select
                value={formData.urgency}
                onValueChange={(value) => setFormData({ ...formData, urgency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ngân sách từ (VND)</Label>
              <Input
                type="number"
                value={formData.budget_min}
                onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                placeholder="1000000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Ngân sách đến (VND)</Label>
              <Input
                type="number"
                value={formData.budget_max}
                onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                placeholder="3000000000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn phương thức" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Property Tab */}
        <TabsContent value="property" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Loại BĐS</Label>
            <div className="grid grid-cols-3 gap-3">
              {PROPERTY_TYPES.map(type => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={formData.property_types.includes(type.value)}
                    onCheckedChange={(checked) => handlePropertyTypeChange(type.value, checked)}
                  />
                  <Label htmlFor={`type-${type.value}`} className="text-sm cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Diện tích từ (m²)</Label>
              <Input
                type="number"
                value={formData.area_min}
                onChange={(e) => setFormData({ ...formData, area_min: e.target.value })}
                placeholder="50"
              />
            </div>
            <div className="space-y-2">
              <Label>Diện tích đến (m²)</Label>
              <Input
                type="number"
                value={formData.area_max}
                onChange={(e) => setFormData({ ...formData, area_max: e.target.value })}
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Số phòng ngủ từ</Label>
              <Input
                type="number"
                value={formData.bedrooms_min}
                onChange={(e) => setFormData({ ...formData, bedrooms_min: e.target.value })}
                placeholder="2"
              />
            </div>
            <div className="space-y-2">
              <Label>Số phòng ngủ đến</Label>
              <Input
                type="number"
                value={formData.bedrooms_max}
                onChange={(e) => setFormData({ ...formData, bedrooms_max: e.target.value })}
                placeholder="3"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tầng ưu tiên</Label>
            <Select
              value={formData.floor_preference}
              onValueChange={(value) => setFormData({ ...formData, floor_preference: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FLOOR_PREFERENCES.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Thành phố ưu tiên</Label>
            <Input
              value={formData.preferred_cities}
              onChange={(e) => setFormData({ ...formData, preferred_cities: e.target.value })}
              placeholder="TP. Hồ Chí Minh, Hà Nội (phân cách bằng dấu phẩy)"
            />
          </div>

          <div className="space-y-2">
            <Label>Quận/Huyện ưu tiên</Label>
            <Input
              value={formData.preferred_districts}
              onChange={(e) => setFormData({ ...formData, preferred_districts: e.target.value })}
              placeholder="Quận 1, Quận 2, Quận 7 (phân cách bằng dấu phẩy)"
            />
          </div>

          <div className="space-y-2">
            <Label>Hướng nhà</Label>
            <div className="grid grid-cols-4 gap-3">
              {DIRECTION_OPTIONS.map(dir => (
                <div key={dir.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`dir-${dir.value}`}
                    checked={formData.directions.includes(dir.value)}
                    onCheckedChange={(checked) => handleDirectionChange(dir.value, checked)}
                  />
                  <Label htmlFor={`dir-${dir.value}`} className="text-sm cursor-pointer">
                    {dir.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>View ưu tiên</Label>
            <div className="grid grid-cols-4 gap-3">
              {VIEW_OPTIONS.map(view => (
                <div key={view.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`view-${view.value}`}
                    checked={formData.views.includes(view.value)}
                    onCheckedChange={(checked) => handleViewChange(view.value, checked)}
                  />
                  <Label htmlFor={`view-${view.value}`} className="text-sm cursor-pointer">
                    {view.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Tiện ích bắt buộc</Label>
            <Input
              value={formData.must_have_features}
              onChange={(e) => setFormData({ ...formData, must_have_features: e.target.value })}
              placeholder="Hồ bơi, Gym, Bãi đỗ xe (phân cách bằng dấu phẩy)"
            />
          </div>

          <div className="space-y-2">
            <Label>Yêu cầu đặc biệt</Label>
            <Textarea
              value={formData.special_requirements}
              onChange={(e) => setFormData({ ...formData, special_requirements: e.target.value })}
              placeholder="Mô tả các yêu cầu đặc biệt khác..."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Nhu cầu đang active
            </Label>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading}
          className="bg-[#316585] hover:bg-[#264f68]"
          data-testid="demand-submit"
        >
          {loading ? 'Đang lưu...' : 'Thêm Nhu cầu'}
        </Button>
      </div>
    </div>
  );
}
