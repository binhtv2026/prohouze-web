/**
 * Consent Page - Recruitment Flow Step 3
 * GDPR/PDPA compliant consent collection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { acceptConsent, getCandidate } from '../../api/recruitmentApi';
import { FileText, Shield, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const DEMO_CANDIDATE = {
  id: 'candidate-demo',
  full_name: 'Phạm Quốc Bảo',
  email: 'bao.demo@example.com',
  phone: '0909123456',
  position_applied: 'Chuyên viên kinh doanh',
};

export default function ConsentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidate_id');

  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [consent, setConsent] = useState({
    data_processing: false,
    terms_of_service: false,
    privacy_policy: false,
    marketing_consent: false,
  });

  const allRequired = consent.data_processing && consent.terms_of_service && consent.privacy_policy;

  const loadCandidate = useCallback(async () => {
    if (!candidateId) {
      setCandidate(DEMO_CANDIDATE);
      return;
    }
    getCandidate(candidateId).then(setCandidate).catch(() => {
      toast.error('Không tìm thấy thông tin, đang hiển thị dữ liệu mẫu');
      setCandidate(DEMO_CANDIDATE);
    });
  }, [candidateId]);

  useEffect(() => {
    loadCandidate();
  }, [loadCandidate]);

  const handleSubmit = async () => {
    if (!allRequired) {
      toast.error('Vui lòng đồng ý với các điều khoản bắt buộc');
      return;
    }

    setLoading(true);
    try {
      const result = await acceptConsent({
        candidate_id: candidateId,
        ...consent,
      });
      if (result.success) {
        toast.success('Đã ghi nhận đồng ý!');
        navigate(`/recruitment/test?candidate_id=${candidateId || DEMO_CANDIDATE.id}`);
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-green-600" />
            </div>
            <CardTitle>Điều khoản & Quyền riêng tư</CardTitle>
            <CardDescription>
              Xin chào <span className="font-medium">{candidate.full_name}</span>, 
              vui lòng đọc và đồng ý với các điều khoản dưới đây
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Processing */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="data_processing"
                  checked={consent.data_processing}
                  onCheckedChange={(checked) => setConsent({ ...consent, data_processing: checked })}
                  data-testid="consent-data"
                />
                <label htmlFor="data_processing" className="cursor-pointer">
                  <span className="font-medium text-gray-900">Đồng ý xử lý dữ liệu *</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Tôi đồng ý cho ProHouze thu thập và xử lý thông tin cá nhân của tôi 
                    cho mục đích tuyển dụng và đánh giá năng lực.
                  </p>
                </label>
              </div>
            </div>

            {/* Terms of Service */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms_of_service"
                  checked={consent.terms_of_service}
                  onCheckedChange={(checked) => setConsent({ ...consent, terms_of_service: checked })}
                  data-testid="consent-terms"
                />
                <label htmlFor="terms_of_service" className="cursor-pointer">
                  <span className="font-medium text-gray-900">Điều khoản sử dụng *</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Tôi đã đọc và đồng ý với{' '}
                    <a href="#" className="text-blue-600 underline">Điều khoản sử dụng</a>
                    {' '}của hệ thống tuyển dụng ProHouze.
                  </p>
                </label>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="privacy_policy"
                  checked={consent.privacy_policy}
                  onCheckedChange={(checked) => setConsent({ ...consent, privacy_policy: checked })}
                  data-testid="consent-privacy"
                />
                <label htmlFor="privacy_policy" className="cursor-pointer">
                  <span className="font-medium text-gray-900">Chính sách bảo mật *</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Tôi đã đọc và đồng ý với{' '}
                    <a href="#" className="text-blue-600 underline">Chính sách bảo mật</a>
                    {' '}(GDPR/PDPA compliant).
                  </p>
                </label>
              </div>
            </div>

            {/* Marketing (Optional) */}
            <div className="p-4 border border-dashed rounded-lg space-y-3 bg-gray-50">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="marketing_consent"
                  checked={consent.marketing_consent}
                  onCheckedChange={(checked) => setConsent({ ...consent, marketing_consent: checked })}
                  data-testid="consent-marketing"
                />
                <label htmlFor="marketing_consent" className="cursor-pointer">
                  <span className="font-medium text-gray-700">Nhận thông tin (tùy chọn)</span>
                  <p className="text-sm text-gray-500 mt-1">
                    Tôi đồng ý nhận thông tin về cơ hội nghề nghiệp, 
                    chương trình đào tạo và ưu đãi từ ProHouze.
                  </p>
                </label>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Quyền của bạn</p>
                  <p className="text-blue-700 mt-1">
                    Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu cá nhân của mình 
                    bất kỳ lúc nào theo quy định GDPR/PDPA.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button 
              onClick={handleSubmit} 
              className="w-full" 
              disabled={loading || !allRequired}
              data-testid="btn-accept"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Đồng ý & Tiếp tục
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              * Các mục bắt buộc
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
