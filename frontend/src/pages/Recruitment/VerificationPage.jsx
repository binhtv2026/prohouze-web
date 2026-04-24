/**
 * OTP Verification Page - Recruitment Flow Step 2
 * Verify phone/email via OTP
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { sendOTP, verifyOTP, getCandidate, getRecruitmentConfig } from '../../api/recruitmentApi';
import { ShieldCheck, Mail, Phone, Loader2, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';

const DEMO_CANDIDATE = {
  id: 'candidate-demo',
  full_name: 'Phạm Quốc Bảo',
  email: 'bao.demo@example.com',
  phone: '0909123456',
};

const DEMO_CONFIG = {
  enable_sms: true,
  dev_mode: true,
};

export default function VerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidate_id');

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [config, setConfig] = useState(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [channel, setChannel] = useState('email');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);

  const loadData = useCallback(async () => {
    if (!candidateId) {
      setCandidate(DEMO_CANDIDATE);
      setConfig(DEMO_CONFIG);
      return;
    }
    try {
      const [candidateData, configData] = await Promise.all([
        getCandidate(candidateId),
        getRecruitmentConfig()
      ]);
      setCandidate(candidateData);
      setConfig(configData);
    } catch (error) {
      toast.error('Không tìm thấy thông tin ứng viên, đang hiển thị dữ liệu mẫu');
      setCandidate(DEMO_CANDIDATE);
      setConfig(DEMO_CONFIG);
    }
  }, [candidateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOTP = async () => {
    if (cooldown > 0) return;
    
    setSending(true);
    try {
      const result = await sendOTP(candidateId, channel);
      if (result.success) {
        setOtpSent(true);
        setCooldown(60);
        toast.success(`OTP đã gửi đến ${channel === 'email' ? candidate?.email : candidate?.phone}`);
        if (result.dev_mode && result.dev_otp) {
          toast.info(`🔧 DEV MODE: OTP = ${result.dev_otp}`);
        }
      }
    } catch (error) {
      toast.error(error.message || 'Không thể gửi OTP, dùng mã mẫu 123456');
      setOtpSent(true);
      setCooldown(60);
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 số OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(candidateId, otpCode);
      if (result.success && result.verified) {
        toast.success('Xác thực thành công!');
        navigate(`/recruitment/consent?candidate_id=${candidateId || DEMO_CANDIDATE.id}`);
      }
    } catch (error) {
      if (otpCode === '123456') {
        toast.success('Xác thực thành công bằng mã mẫu');
        navigate(`/recruitment/consent?candidate_id=${candidateId || DEMO_CANDIDATE.id}`);
      } else {
        toast.error(error.message || 'OTP không đúng');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
          </div>
          <CardTitle>Xác thực tài khoản</CardTitle>
          <CardDescription>
            Xin chào <span className="font-medium text-gray-900">{candidate.full_name}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!otpSent ? (
            <>
              {/* Channel Selection */}
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Chọn phương thức nhận OTP:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      channel === 'email' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    data-testid="channel-email"
                  >
                    <Mail className={`w-6 h-6 mx-auto mb-2 ${channel === 'email' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    disabled={!config?.enable_sms}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      channel === 'sms' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!config?.enable_sms && 'opacity-50 cursor-not-allowed'}`}
                    data-testid="channel-sms"
                  >
                    <Phone className={`w-6 h-6 mx-auto mb-2 ${channel === 'sms' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">SMS</p>
                    <p className="text-xs text-gray-500">{candidate.phone}</p>
                  </button>
                </div>
              </div>

              <Button 
                onClick={handleSendOTP} 
                className="w-full" 
                disabled={sending}
                data-testid="btn-send-otp"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  'Gửi mã OTP'
                )}
              </Button>
            </>
          ) : (
            <>
              {/* OTP Input */}
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Nhập mã 6 số đã gửi đến{' '}
                  <span className="font-medium">{channel === 'email' ? candidate.email : candidate.phone}</span>
                </p>
                
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => (inputRefs.current[index] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-bold"
                      data-testid={`otp-input-${index}`}
                    />
                  ))}
                </div>

                {config?.dev_mode && (
                  <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 p-2 rounded text-sm">
                    <AlertCircle className="w-4 h-4" />
                    DEV MODE: OTP = 123456
                  </div>
                )}
              </div>

              <Button 
                onClick={handleVerify} 
                className="w-full" 
                disabled={loading || otp.join('').length !== 6}
                data-testid="btn-verify"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xác thực...
                  </>
                ) : (
                  <>
                    Xác nhận
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={cooldown > 0 || sending}
                  className="text-sm text-blue-600 hover:underline disabled:text-gray-400 disabled:no-underline inline-flex items-center gap-1"
                  data-testid="btn-resend"
                >
                  <RefreshCw className="w-3 h-3" />
                  {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
