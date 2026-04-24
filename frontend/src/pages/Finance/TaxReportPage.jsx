import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Receipt,
  Calculator,
  FileText,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_TAX_REPORT = {
  total_tax_payable: 1840000000,
  total_tax_paid: 1210000000,
  total_tax_remaining: 630000000,
  vat_output: 1245000000,
  vat_input: 610000000,
  vat_payable: 635000000,
  cit_taxable_income: 8590000000,
  cit_payable: 1718000000,
  pit_payable: 286000000,
  pit_employee_count: 148,
};

export default function TaxReportPage() {
  const [loading, setLoading] = useState(true);
  const [taxReport, setTaxReport] = useState(null);
  const [periodType, setPeriodType] = useState('quarterly');
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodQuarter, setPeriodQuarter] = useState(Math.ceil((new Date().getMonth() + 1) / 3));
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);

  const fetchTaxReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('period_type', periodType);
      params.append('period_year', periodYear);
      if (periodType === 'quarterly') params.append('period_quarter', periodQuarter);
      if (periodType === 'monthly') params.append('period_month', periodMonth);

      const res = await api.get(`/finance/tax/report?${params.toString()}`);
      setTaxReport(res?.data || DEMO_TAX_REPORT);
    } catch (error) {
      console.error('Error fetching tax report:', error);
      setTaxReport(DEMO_TAX_REPORT);
      toast.error('Không thể tải báo cáo thuế');
    } finally {
      setLoading(false);
    }
  }, [periodMonth, periodQuarter, periodType, periodYear]);

  useEffect(() => {
    fetchTaxReport();
  }, [fetchTaxReport]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));
  const quarters = [
    { value: 1, label: 'Quý 1' },
    { value: 2, label: 'Quý 2' },
    { value: 3, label: 'Quý 3' },
    { value: 4, label: 'Quý 4' },
  ];
  const years = [2024, 2025, 2026];

  const getPeriodLabel = () => {
    if (periodType === 'quarterly') return `Quý ${periodQuarter}/${periodYear}`;
    if (periodType === 'monthly') return `Tháng ${periodMonth}/${periodYear}`;
    return `Năm ${periodYear}`;
  };

  return (
    <div className="space-y-6" data-testid="tax-report-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Báo cáo Thuế</h1>
          <p className="text-slate-500 text-sm mt-1">Tổng hợp các khoản thuế phải nộp theo quy định</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={periodType} onValueChange={setPeriodType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Theo tháng</SelectItem>
              <SelectItem value="quarterly">Theo quý</SelectItem>
              <SelectItem value="yearly">Theo năm</SelectItem>
            </SelectContent>
          </Select>
          {periodType === 'monthly' && (
            <Select value={String(periodMonth)} onValueChange={(v) => setPeriodMonth(Number(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {periodType === 'quarterly' && (
            <Select value={String(periodQuarter)} onValueChange={(v) => setPeriodQuarter(Number(v))}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {quarters.map((q) => (
                  <SelectItem key={q.value} value={String(q.value)}>{q.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={String(periodYear)} onValueChange={(v) => setPeriodYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTaxReport}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Đang tải báo cáo...</div>
      ) : (
        <>
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600">Tổng thuế phải nộp - {getPeriodLabel()}</p>
                  <p className="text-3xl font-bold text-amber-700 mt-1">
                    {formatCurrency(taxReport?.total_tax_payable)}
                  </p>
                </div>
                <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <Calculator className="h-8 w-8 text-amber-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-amber-200">
                <div>
                  <p className="text-sm text-amber-600">Đã nộp</p>
                  <p className="text-xl font-semibold text-green-600">{formatCurrency(taxReport?.total_tax_paid)}</p>
                </div>
                <div>
                  <p className="text-sm text-amber-600">Còn phải nộp</p>
                  <p className="text-xl font-semibold text-red-600">{formatCurrency(taxReport?.total_tax_remaining)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tax Details */}
          <Tabs defaultValue="vat" className="space-y-4">
            <TabsList>
              <TabsTrigger value="vat" data-testid="tab-vat">Thuế GTGT</TabsTrigger>
              <TabsTrigger value="cit" data-testid="tab-cit">Thuế TNDN</TabsTrigger>
              <TabsTrigger value="pit" data-testid="tab-pit">Thuế TNCN</TabsTrigger>
            </TabsList>

            <TabsContent value="vat">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    Thuế Giá trị gia tăng (GTGT)
                  </CardTitle>
                  <CardDescription>Theo phương pháp khấu trừ - Thuế suất 10%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-emerald-50">
                        <p className="text-sm text-emerald-600 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Thuế GTGT đầu ra
                        </p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">
                          {formatCurrency(taxReport?.vat_output)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">10% trên doanh thu</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-50">
                        <p className="text-sm text-red-600 flex items-center gap-2">
                          <TrendingDown className="h-4 w-4" />
                          Thuế GTGT đầu vào
                        </p>
                        <p className="text-2xl font-bold text-red-700 mt-1">
                          {formatCurrency(taxReport?.vat_input)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Được khấu trừ</p>
                      </div>
                      <div className={`p-4 rounded-lg ${(taxReport?.vat_payable || 0) > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                        <p className={`text-sm flex items-center gap-2 ${(taxReport?.vat_payable || 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                          <DollarSign className="h-4 w-4" />
                          Thuế GTGT phải nộp
                        </p>
                        <p className={`text-2xl font-bold mt-1 ${(taxReport?.vat_payable || 0) > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                          {formatCurrency(taxReport?.vat_payable)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Đầu ra - Đầu vào</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-slate-50">
                      <h4 className="font-medium text-slate-700 mb-2">Công thức tính</h4>
                      <div className="text-sm text-slate-600 space-y-1">
                        <p>Thuế GTGT đầu ra = Doanh thu × 10%</p>
                        <p>Thuế GTGT đầu vào = Chi phí có hóa đơn GTGT × 10%</p>
                        <p className="font-medium">Thuế phải nộp = Thuế đầu ra - Thuế đầu vào</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Thuế Thu nhập doanh nghiệp (TNDN)
                  </CardTitle>
                  <CardDescription>Thuế suất phổ thông 20%</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-blue-50">
                        <p className="text-sm text-blue-600">Thu nhập chịu thuế</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">
                          {formatCurrency(taxReport?.cit_taxable_income)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Doanh thu - Chi phí hợp lệ</p>
                      </div>
                      <div className="p-4 rounded-lg bg-purple-50">
                        <p className="text-sm text-purple-600">Thuế TNDN phải nộp</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">
                          {formatCurrency(taxReport?.cit_amount)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Thuế suất: {taxReport?.cit_rate}%</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-slate-50">
                      <h4 className="font-medium text-slate-700 mb-2">Quy định</h4>
                      <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                        <li>Thuế suất phổ thông: 20%</li>
                        <li>DN vừa và nhỏ có thể được ưu đãi: 15-17%</li>
                        <li>Kê khai tạm tính theo quý, quyết toán năm</li>
                        <li>Nộp chậm nhất: Ngày cuối quý sau</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pit">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-teal-600" />
                    Thuế Thu nhập cá nhân (TNCN)
                  </CardTitle>
                  <CardDescription>Khấu trừ từ lương nhân viên</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-teal-50">
                        <p className="text-sm text-teal-600">Số nhân viên</p>
                        <p className="text-2xl font-bold text-teal-700 mt-1">
                          {taxReport?.pit_total_employees || 0}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Phát sinh thuế TNCN</p>
                      </div>
                      <div className="p-4 rounded-lg bg-orange-50">
                        <p className="text-sm text-orange-600">Tổng thuế TNCN khấu trừ</p>
                        <p className="text-2xl font-bold text-orange-700 mt-1">
                          {formatCurrency(taxReport?.pit_total_amount)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Phải nộp cho cơ quan thuế</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-slate-50">
                      <h4 className="font-medium text-slate-700 mb-2">Biểu thuế TNCN luỹ tiến</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-slate-500">
                            <th className="pb-2">Bậc</th>
                            <th className="pb-2">Thu nhập tính thuế/tháng</th>
                            <th className="pb-2">Thuế suất</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600">
                          <tr><td>1</td><td>Đến 5 triệu</td><td>5%</td></tr>
                          <tr><td>2</td><td>5 - 10 triệu</td><td>10%</td></tr>
                          <tr><td>3</td><td>10 - 18 triệu</td><td>15%</td></tr>
                          <tr><td>4</td><td>18 - 32 triệu</td><td>20%</td></tr>
                          <tr><td>5</td><td>32 - 52 triệu</td><td>25%</td></tr>
                          <tr><td>6</td><td>52 - 80 triệu</td><td>30%</td></tr>
                          <tr><td>7</td><td>Trên 80 triệu</td><td>35%</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Warning */}
          {(taxReport?.total_tax_remaining || 0) > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800">Lưu ý về nghĩa vụ thuế</h4>
                    <p className="text-sm text-orange-700 mt-1">
                      Tổng số thuế còn phải nộp là <strong>{formatCurrency(taxReport?.total_tax_remaining)}</strong>. 
                      Vui lòng đảm bảo nộp đúng hạn để tránh phạt chậm nộp (0.03%/ngày).
                    </p>
                    <div className="mt-3 text-sm text-orange-600">
                      <p>• Thuế GTGT: Nộp chậm nhất ngày 20 tháng sau</p>
                      <p>• Thuế TNDN: Nộp chậm nhất ngày cuối tháng đầu quý sau</p>
                      <p>• Thuế TNCN: Nộp chậm nhất ngày 20 tháng sau</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
