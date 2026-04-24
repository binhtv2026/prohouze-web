/**
 * Candidate Status Page - Check application status
 * Public page for candidates to track their progress
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { getCandidateStatus, getCandidate, getAuditLog } from '../../api/recruitmentApi';
import { 
  Search, CheckCircle, Circle, Clock, XCircle, 
  Loader2, User, Phone, Mail, Calendar, ArrowRight
} from 'lucide-react';

const STEP_ICONS = {
  completed: CheckCircle,
  current: Clock,
  pending: Circle,
  failed: XCircle,
};

const STEP_COLORS = {
  completed: 'text-green-600 bg-green-100',
  current: 'text-blue-600 bg-blue-100 animate-pulse',
  pending: 'text-gray-400 bg-gray-100',
  failed: 'text-red-600 bg-red-100',
};

export default function StatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateIdParam = searchParams.get('candidate_id');

  const [loading, setLoading] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');
  const [candidate, setCandidate] = useState(null);
  const [status, setStatus] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  useEffect(() => {
    if (candidateIdParam) {
      loadStatus(candidateIdParam);
    }
  }, [candidateIdParam]);

  const loadStatus = async (candidateId) => {
    setLoading(true);
    try {
      const [candidateData, statusData, logData] = await Promise.all([
        getCandidate(candidateId),
        getCandidateStatus(candidateId),
        getAuditLog(candidateId),
      ]);
      setCandidate(candidateData);
      setStatus(statusData);
      setAuditLog(logData.logs || []);
    } catch (error) {
      toast.error('Không tìm thấy thông tin ứng viên');
      setCandidate(null);
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPhone || searchPhone.length < 10) {
      toast.error('Vui lòng nhập số điện thoại hợp lệ');
      return;
    }
    
    setLoading(true);
    try {
      // This would need a search by phone API
      // For now, redirect to apply if not found
      toast.info('Vui lòng nhập mã ứng viên để tra cứu');
    } catch (error) {
      toast.error('Không tìm thấy thông tin');
    } finally {
      setLoading(false);
    }
  };

  const getNextAction = () => {
    if (!status || !candidate) return null;
    
    const currentStep = status.current_step;
    const candidateStatus = candidate.status;
    
    if (candidateStatus === 'active') {
      return { text: 'Đăng nhập hệ thống', href: '/login' };
    }
    if (candidateStatus === 'rejected') {
      return { text: 'Đăng ký lại', href: '/recruitment/apply' };
    }
    
    switch (currentStep) {
      case 1: return { text: 'Tiếp tục xác thực', href: `/recruitment/verify?candidate_id=${candidate.id}` };
      case 2: return { text: 'Xác thực OTP', href: `/recruitment/verify?candidate_id=${candidate.id}` };
      case 3: return { text: 'Đồng ý điều khoản', href: `/recruitment/consent?candidate_id=${candidate.id}` };
      case 4: case 5: case 6: return { text: 'Làm bài test', href: `/recruitment/test?candidate_id=${candidate.id}` };
      case 7: case 8: case 9: return { text: 'Ký hợp đồng', href: `/recruitment/contract?candidate_id=${candidate.id}` };
      default: return null;
    }
  };

  const nextAction = getNextAction();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Tra cứu trạng thái ứng tuyển</h1>
          <p className="text-gray-600 mt-2">Kiểm tra tiến trình đơn ứng tuyển của bạn</p>
        </div>

        {/* Search Form */}
        {!candidate && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Nhập mã ứng viên hoặc số điện thoại"
                    value={searchPhone}
                    onChange={(e) => setSearchPhone(e.target.value)}
                    className="pl-10"
                    data-testid="input-search"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          </div>
        )}

        {candidate && status && (
          <>
            {/* Candidate Info */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>{candidate.full_name}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {candidate.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {candidate.email}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Vị trí</p>
                    <p className="font-medium capitalize">{candidate.position}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Ngày nộp</p>
                    <p className="font-medium">
                      {new Date(candidate.applied_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-500">Trạng thái</p>
                    <p className={`font-medium capitalize ${
                      candidate.status === 'active' ? 'text-green-600' :
                      candidate.status === 'rejected' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {candidate.status}
                    </p>
                  </div>
                </div>

                {/* Scores if available */}
                {(status.scores?.ai_score || status.scores?.test_score) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Điểm đánh giá:</p>
                    <div className="flex gap-6">
                      {status.scores?.ai_score && (
                        <div>
                          <span className="text-gray-600">AI: </span>
                          <span className="font-bold">{status.scores.ai_score.toFixed(1)}%</span>
                        </div>
                      )}
                      {status.scores?.test_score && (
                        <div>
                          <span className="text-gray-600">Test: </span>
                          <span className="font-bold">{status.scores.test_score.toFixed(1)}%</span>
                        </div>
                      )}
                      {status.scores?.final_score && (
                        <div>
                          <span className="text-gray-600">Tổng: </span>
                          <span className="font-bold text-blue-600">{status.scores.final_score.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Steps */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Tiến trình đăng ký</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {status.steps?.map((step, idx) => {
                    const Icon = STEP_ICONS[step.status] || Circle;
                    const colorClass = STEP_COLORS[step.status] || STEP_COLORS.pending;
                    const isLast = idx === status.steps.length - 1;

                    return (
                      <div key={step.step} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          {!isLast && (
                            <div className={`w-0.5 h-8 ${
                              step.status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                            }`} />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className={`font-medium ${
                            step.status === 'completed' ? 'text-gray-900' :
                            step.status === 'current' ? 'text-blue-600' :
                            'text-gray-400'
                          }`}>
                            {step.name}
                          </p>
                          <p className="text-xs text-gray-500">Bước {step.step}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Next Action */}
            {nextAction && (
              <Button 
                onClick={() => navigate(nextAction.href)}
                className="w-full"
                data-testid="btn-next-action"
              >
                {nextAction.text}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {/* Audit Log */}
            {auditLog.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Lịch sử hoạt động</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {auditLog.slice().reverse().map((log, idx) => (
                      <div key={log.id || idx} className="flex items-start gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-gray-900">{log.action}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
