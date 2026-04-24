/**
 * Contract & E-Sign Page - Recruitment Flow Step 5
 * View contract and sign electronically
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { getCandidate, generateContract, getContract, signContract, executeOnboarding, activateUser } from '../../api/recruitmentApi';
import { 
  FileText, PenTool, CheckCircle, Loader2, ArrowRight, 
  Download, Trash2, Building2, User, Calendar
} from 'lucide-react';

const DEMO_CANDIDATE = {
  id: 'candidate-demo',
  full_name: 'Phạm Quốc Bảo',
  email: 'bao.demo@example.com',
  contract_id: 'contract-demo',
};

const DEMO_CONTRACT = {
  id: 'contract-demo',
  contract_number: 'HDCTV-2026-001',
  created_at: '2026-03-25T09:00:00',
  content: 'Hợp đồng cộng tác viên mẫu để kiểm tra luồng hiển thị khi backend chưa sẵn sàng.',
};

export default function ContractPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidate_id');
  const canvasRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [contract, setContract] = useState(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState(null);

  const loadData = useCallback(async () => {
    if (!candidateId) {
      setCandidate(DEMO_CANDIDATE);
      setContract(DEMO_CONTRACT);
      setLoading(false);
      return;
    }
    try {
      const candidateData = await getCandidate(candidateId);
      setCandidate(candidateData);

      let contractData;
      if (candidateData.contract_id) {
        contractData = await getContract(candidateData.contract_id);
      } else {
        contractData = await generateContract(candidateId);
        if (contractData.contract_id) {
          contractData = await getContract(contractData.contract_id);
        }
      }
      setContract(contractData);
    } catch (error) {
      toast.error(error.message || 'Không thể tải hợp đồng, đang hiển thị bản mẫu');
      setCandidate(DEMO_CANDIDATE);
      setContract(DEMO_CONTRACT);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [contract]);

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    if (!acceptTerms) {
      toast.error('Vui lòng đồng ý với điều khoản hợp đồng');
      return;
    }
    if (!hasSignature) {
      toast.error('Vui lòng ký tên vào ô chữ ký');
      return;
    }

    setSigning(true);
    try {
      // Get signature data
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');

      // Sign contract
      await signContract(contract.id, signatureData);
      toast.success('Ký hợp đồng thành công!');

      // Execute onboarding
      const onboarding = await executeOnboarding(candidateId);
      await activateUser(candidateId);
      setOnboardingResult(onboarding);
      toast.success('Hoàn tất đăng ký!');
    } catch (error) {
      toast.error(error.message || 'Có lỗi khi ký hợp đồng');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show onboarding success
  if (onboardingResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Chào mừng bạn đến ProHouze!
              </h2>
              <p className="text-gray-600 mb-6">
                Bạn đã chính thức trở thành thành viên của đội ngũ
              </p>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
                <h3 className="font-medium text-gray-900 mb-2">Thông tin tài khoản:</h3>
                <div className="flex justify-between">
                  <span className="text-gray-600">Username:</span>
                  <span className="font-mono font-bold">{onboardingResult.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mật khẩu tạm:</span>
                  <span className="font-mono font-bold text-orange-600">{onboardingResult.temp_password}</span>
                </div>
                {onboardingResult.team_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Team:</span>
                    <span className="font-medium">{onboardingResult.team_name}</span>
                  </div>
                )}
                {onboardingResult.manager_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quản lý:</span>
                    <span className="font-medium">{onboardingResult.manager_name}</span>
                  </div>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  ⚠️ Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu
                </p>
              </div>

              <Button 
                onClick={() => navigate('/login')}
                className="w-full"
                data-testid="btn-login"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Đăng nhập hệ thống
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Hợp đồng cộng tác</h1>
          <p className="text-gray-600">Vui lòng đọc kỹ và ký xác nhận</p>
        </div>

        {/* Contract Info */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{contract?.contract_number}</CardTitle>
                <CardDescription>
                  Ngày tạo: {new Date(contract?.created_at).toLocaleDateString('vi-VN')}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Tải PDF
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Contract Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div 
              className="prose prose-sm max-w-none bg-gray-50 p-6 rounded-lg border max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-sm"
              style={{ fontFamily: 'monospace' }}
            >
              {contract?.contract_content}
            </div>
          </CardContent>
        </Card>

        {/* Signature Area */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PenTool className="w-5 h-5" />
              Chữ ký điện tử
            </CardTitle>
            <CardDescription>
              Vẽ chữ ký của bạn vào ô bên dưới
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                data-testid="signature-canvas"
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-400">Ký tên tại đây</p>
                </div>
              )}
            </div>
            {hasSignature && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSignature}
                className="mt-2"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa chữ ký
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Terms Agreement */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accept_terms"
                checked={acceptTerms}
                onCheckedChange={setAcceptTerms}
                data-testid="accept-terms"
              />
              <label htmlFor="accept_terms" className="cursor-pointer">
                <span className="font-medium text-gray-900">Tôi xác nhận</span>
                <p className="text-sm text-gray-600 mt-1">
                  Tôi đã đọc, hiểu và đồng ý với toàn bộ nội dung hợp đồng trên. 
                  Chữ ký điện tử này có giá trị pháp lý như chữ ký tay.
                </p>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          onClick={handleSign}
          className="w-full"
          disabled={signing || !acceptTerms || !hasSignature}
          data-testid="btn-sign"
        >
          {signing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Ký hợp đồng
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>

        {/* Legal Note */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Hợp đồng sẽ được lưu trữ với timestamp, IP và device info theo quy định pháp luật
        </p>
      </div>
    </div>
  );
}
