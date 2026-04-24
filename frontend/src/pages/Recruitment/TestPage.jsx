/**
 * Test Page - Recruitment Flow Step 4
 * Online assessment with auto-grading
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { getCandidate, scoreCandidate, startTest, submitTest, makeDecision } from '../../api/recruitmentApi';
import { 
  ClipboardList, Clock, ArrowRight, ArrowLeft, Loader2, 
  CheckCircle, XCircle, AlertTriangle, Trophy
} from 'lucide-react';

const DEMO_CANDIDATE = {
  id: 'candidate-demo',
  full_name: 'Phạm Quốc Bảo',
  ai_score: 78,
};

const DEMO_TEST = {
  attempt_id: 'attempt-demo',
  time_limit: 30,
  questions: [
    {
      id: 'q1',
      question: 'Khi khách hàng nói cần thêm thời gian suy nghĩ, bước nào phù hợp nhất?',
      options: [
        { value: 'a', text: 'Ép khách chốt ngay' },
        { value: 'b', text: 'Xác nhận nhu cầu và hẹn thời điểm follow cụ thể' },
        { value: 'c', text: 'Không liên hệ lại nữa' },
      ],
    },
    {
      id: 'q2',
      question: 'Yếu tố nào giúp khách hàng tin tưởng dự án hơn?',
      options: [
        { value: 'a', text: 'Chỉ nhấn mạnh giá rẻ' },
        { value: 'b', text: 'Pháp lý rõ ràng, tiến độ thực tế, chính sách minh bạch' },
        { value: 'c', text: 'Hứa hẹn lợi nhuận không căn cứ' },
      ],
    },
    {
      id: 'q3',
      question: 'Trong CRM, điều quan trọng nhất sau cuộc gọi đầu tiên là gì?',
      options: [
        { value: 'a', text: 'Cập nhật trạng thái và nhu cầu khách hàng' },
        { value: 'b', text: 'Xóa lead để đỡ rối' },
        { value: 'c', text: 'Chờ quản lý nhập hộ' },
      ],
    },
  ],
};

const DEMO_TEST_RESULT = {
  score: 84,
  category_scores: {
    sales: 88,
    communication: 82,
    process: 80,
  },
};

const DEMO_DECISION = {
  decision: 'pass',
  ai_score: 78,
  final_score: 82,
};

export default function TestPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateId = searchParams.get('candidate_id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [candidate, setCandidate] = useState(null);
  const [testData, setTestData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [decisionResult, setDecisionResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes

  const initTest = useCallback(async () => {
    if (!candidateId) {
      setCandidate(DEMO_CANDIDATE);
      setTestData(DEMO_TEST);
      setTimeLeft(DEMO_TEST.time_limit * 60);
      setLoading(false);
      return;
    }
    try {
      const candidateData = await getCandidate(candidateId);
      setCandidate(candidateData);

      if (!candidateData.ai_score) {
        await scoreCandidate(candidateId);
      }

      const test = await startTest(candidateId);
      setTestData(test);
      setTimeLeft(test.time_limit * 60);
    } catch (error) {
      toast.error(error.message || 'Không thể tải bài test, đang hiển thị bài mẫu');
      setCandidate(DEMO_CANDIDATE);
      setTestData(DEMO_TEST);
      setTimeLeft(DEMO_TEST.time_limit * 60);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    initTest();
  }, [initTest]);

  const handleSubmitTest = useCallback(async () => {
    if (submitting) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < testData.questions.length) {
      const confirm = window.confirm(
        `Bạn mới trả lời ${answeredCount}/${testData.questions.length} câu. Bạn có chắc muốn nộp bài?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer: answer,
      }));

      const result = await submitTest(testData.attempt_id, formattedAnswers);
      setTestResult(result);

      const decision = await makeDecision(candidateId);
      setDecisionResult(decision);

      if (decision.decision === 'pass') {
        toast.success('Chúc mừng! Bạn đã vượt qua bài test!');
      } else {
        toast.info('Kết quả đã được ghi nhận');
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi khi nộp bài, đang dùng kết quả mẫu');
      setTestResult(DEMO_TEST_RESULT);
      setDecisionResult(DEMO_DECISION);
    } finally {
      setSubmitting(false);
    }
  }, [answers, candidateId, submitting, testData]);

  // Timer
  useEffect(() => {
    if (!testData || testResult) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleSubmitTest, testData, testResult]);

  const handleAnswer = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải bài test...</p>
        </div>
      </div>
    );
  }

  // Show result
  if (testResult && decisionResult) {
    const passed = decisionResult.decision === 'pass';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardContent className="pt-8 text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                passed ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {passed ? (
                  <Trophy className="w-10 h-10 text-green-600" />
                ) : (
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                )}
              </div>

              <h2 className={`text-2xl font-bold mb-2 ${passed ? 'text-green-700' : 'text-red-700'}`}>
                {passed ? 'Chúc mừng!' : 'Chưa đạt yêu cầu'}
              </h2>
              <p className="text-gray-600 mb-6">
                {passed 
                  ? 'Bạn đã vượt qua vòng đánh giá' 
                  : 'Kết quả chưa đạt ngưỡng yêu cầu'}
              </p>

              {/* Scores */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm bài test:</span>
                  <span className="font-bold">{testResult.score.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Điểm AI:</span>
                  <span className="font-bold">{decisionResult.ai_score?.toFixed(1) || 'N/A'}%</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600 font-medium">Điểm tổng:</span>
                  <span className={`font-bold text-lg ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {decisionResult.final_score?.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Category breakdown */}
              {testResult.category_scores && (
                <div className="mb-6 text-left">
                  <p className="text-sm font-medium text-gray-700 mb-2">Chi tiết theo lĩnh vực:</p>
                  <div className="space-y-2">
                    {Object.entries(testResult.category_scores).map(([cat, score]) => (
                      <div key={cat} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 capitalize">{cat}:</span>
                        <Progress value={score} className="flex-1 h-2" />
                        <span className="text-xs font-medium w-10">{score.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {passed ? (
                <Button 
                  onClick={() => navigate(`/recruitment/contract?candidate_id=${candidateId}`)}
                  className="w-full"
                  data-testid="btn-continue"
                >
                  Tiếp tục ký hợp đồng
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/recruitment/apply')}
                  className="w-full"
                >
                  Đăng ký lại
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test UI
  const questions = testData?.questions || [];
  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Bài test đánh giá</span>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
            timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
          }`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Câu {currentQuestion + 1} / {questions.length}</span>
            <span>{Object.keys(answers).length} đã trả lời</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold">{currentQuestion + 1}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{question?.question}</CardTitle>
                <CardDescription className="mt-1">
                  Chọn một đáp án đúng nhất
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={answers[question?.id] || ''}
              onValueChange={(value) => handleAnswer(question?.id, value)}
              className="space-y-3"
            >
              {question?.options?.map((option, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    answers[question?.id] === option ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => handleAnswer(question?.id, option)}
                >
                  <RadioGroupItem value={option} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Câu trước
              </Button>

              {currentQuestion < questions.length - 1 ? (
                <Button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  disabled={!answers[question?.id]}
                >
                  Câu tiếp
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitTest}
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="btn-submit-test"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang nộp...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Nộp bài
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Navigator */}
        <div className="mt-4 p-4 bg-white rounded-lg border">
          <p className="text-sm text-gray-600 mb-2">Điều hướng nhanh:</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                  idx === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[q.id]
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
