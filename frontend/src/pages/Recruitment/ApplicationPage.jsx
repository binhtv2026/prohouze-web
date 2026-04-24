/**
 * Public Application Page - Recruitment Flow Step 1
 * Candidates apply here via link/QR with optional ref_id
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { submitApplication, getRecruitmentConfig } from '../../api/recruitmentApi';
import { Building2, User, Phone, Mail, Briefcase, MapPin, CheckCircle2, Loader2 } from 'lucide-react';

const POSITIONS = [
  { value: 'ctv', label: 'Cộng Tác Viên (CTV)' },
  { value: 'sale', label: 'Nhân viên Kinh doanh' },
  { value: 'leader', label: 'Trưởng nhóm' },
];

const REGIONS = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Bình Dương', 
  'Đồng Nai', 'Long An', 'Hải Phòng', 'Cần Thơ', 'Khác'
];

export default function ApplicationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [candidateId, setCandidateId] = useState(null);
  const [config, setConfig] = useState(null);

  const refId = searchParams.get('ref_id');
  const campaignId = searchParams.get('campaign_id');
  const utm_source = searchParams.get('utm_source');
  const utm_medium = searchParams.get('utm_medium');
  const utm_campaign = searchParams.get('utm_campaign');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    position: 'ctv',
    region: '',
    experience_years: 0,
    has_real_estate_exp: false,
    source: refId ? 'referral' : 'direct',
    ref_id: refId || null,
    campaign_id: campaignId || null,
    utm_source: utm_source || null,
    utm_medium: utm_medium || null,
    utm_campaign: utm_campaign || null,
  });

  useEffect(() => {
    getRecruitmentConfig().then(setConfig).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.phone || !formData.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!/^0\d{9}$/.test(formData.phone)) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567)');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const result = await submitApplication(formData);
      if (result.success) {
        setCandidateId(result.candidate_id);
        setSubmitted(true);
        toast.success(result.message || 'Đăng ký thành công!');
      }
    } catch (error) {
      toast.error(error.message || 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (submitted && candidateId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký thành công!</h2>
            <p className="text-gray-600 mb-6">
              Vui lòng xác thực email/số điện thoại để tiếp tục
            </p>
            <Button 
              onClick={() => navigate(`/recruitment/verify?candidate_id=${candidateId}`)}
              className="w-full"
            >
              Tiếp tục xác thực
            </Button>
            {config?.dev_mode && (
              <p className="text-xs text-orange-600 mt-4 bg-orange-50 p-2 rounded">
                🔧 DEV MODE: OTP = 123456
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">ProHouze</h1>
          <p className="text-gray-600 mt-2">Gia nhập đội ngũ Sales BĐS hàng đầu</p>
          {refId && (
            <div className="mt-2 inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
              <User className="w-4 h-4" />
              Được giới thiệu
            </div>
          )}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Đăng ký ứng tuyển</CardTitle>
            <CardDescription>
              Điền thông tin để bắt đầu quy trình tuyển dụng tự động
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="full_name">Họ và tên *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="full_name"
                    placeholder="Nguyễn Văn A"
                    className="pl-10"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                    data-testid="input-fullname"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0901234567"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    required
                    data-testid="input-phone"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              {/* Position */}
              <div className="space-y-2">
                <Label>Vị trí ứng tuyển</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger data-testid="select-position">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos.value} value={pos.value}>
                        {pos.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Region */}
              <div className="space-y-2">
                <Label>Khu vực làm việc</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger data-testid="select-region">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIONS.map((region) => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">Số năm kinh nghiệm Sales</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  max="30"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                  data-testid="input-experience"
                />
              </div>

              {/* Real Estate Experience */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="has_re_exp"
                  checked={formData.has_real_estate_exp}
                  onCheckedChange={(checked) => setFormData({ ...formData, has_real_estate_exp: checked })}
                  data-testid="checkbox-re-exp"
                />
                <Label htmlFor="has_re_exp" className="text-sm font-normal cursor-pointer">
                  Tôi có kinh nghiệm trong ngành Bất động sản
                </Label>
              </div>

              {/* Submit */}
              <Button 
                type="submit" 
                className="w-full mt-6" 
                disabled={loading}
                data-testid="btn-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Đăng ký ngay'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <a href="#" className="underline">Điều khoản sử dụng</a>
          {' '}và{' '}
          <a href="#" className="underline">Chính sách bảo mật</a>
        </p>
      </div>
    </div>
  );
}
