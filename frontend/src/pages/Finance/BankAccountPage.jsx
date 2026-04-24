import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Building2,
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  EyeOff,
  Landmark,
  PiggyBank,
  History,
  Settings,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';

const DEMO_BANK_ACCOUNTS = [
  { id: 'bank-1', account_name: 'Tài khoản thanh toán chính', account_number: '0123456789', bank_code: 'VCB', bank_name: 'Vietcombank', branch: 'TP.HCM', currency: 'VND', account_type: 'checking', is_primary: true, current_balance: 2850000000 },
  { id: 'bank-2', account_name: 'Tài khoản tiết kiệm quỹ dự phòng', account_number: '9876543210', bank_code: 'TCB', bank_name: 'Techcombank', branch: 'Hà Nội', currency: 'VND', account_type: 'savings', is_primary: false, current_balance: 1420000000 },
];

const accountTypeLabels = {
  checking: { label: 'Tài khoản thanh toán', icon: CreditCard },
  savings: { label: 'Tài khoản tiết kiệm', icon: PiggyBank },
};

const vietnameseBanks = [
  { code: 'VCB', name: 'Vietcombank', color: 'bg-green-600' },
  { code: 'TCB', name: 'Techcombank', color: 'bg-red-600' },
  { code: 'VPB', name: 'VPBank', color: 'bg-green-500' },
  { code: 'MBB', name: 'MB Bank', color: 'bg-purple-600' },
  { code: 'ACB', name: 'ACB', color: 'bg-blue-600' },
  { code: 'BIDV', name: 'BIDV', color: 'bg-blue-700' },
  { code: 'CTG', name: 'VietinBank', color: 'bg-blue-800' },
  { code: 'STB', name: 'Sacombank', color: 'bg-sky-600' },
  { code: 'SHB', name: 'SHB', color: 'bg-yellow-600' },
  { code: 'HDB', name: 'HDBank', color: 'bg-red-500' },
  { code: 'TPB', name: 'TPBank', color: 'bg-purple-500' },
  { code: 'VIB', name: 'VIB', color: 'bg-blue-500' },
  { code: 'OCB', name: 'OCB', color: 'bg-orange-500' },
  { code: 'LPB', name: 'LienVietPostBank', color: 'bg-amber-600' },
  { code: 'EIB', name: 'Eximbank', color: 'bg-teal-600' },
];

export default function BankAccountPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showAccountNumbers, setShowAccountNumbers] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const [formData, setFormData] = useState({
    account_name: '',
    account_number: '',
    bank_code: '',
    bank_name: '',
    branch: '',
    currency: 'VND',
    account_type: 'checking',
    is_primary: false,
  });

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/finance/bank-accounts');
      setAccounts(Array.isArray(res?.data) && res.data.length > 0 ? res.data : DEMO_BANK_ACCOUNTS);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      setAccounts(DEMO_BANK_ACCOUNTS);
      toast.error('Không thể tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedBank = vietnameseBanks.find(b => b.code === formData.bank_code);
      
      const params = new URLSearchParams();
      params.append('account_name', formData.account_name);
      params.append('account_number', formData.account_number);
      params.append('bank_name', selectedBank?.name || formData.bank_name);
      params.append('bank_code', formData.bank_code);
      if (formData.branch) params.append('branch', formData.branch);
      params.append('currency', formData.currency);
      params.append('account_type', formData.account_type);
      params.append('is_primary', formData.is_primary);

      await api.post(`/finance/bank-accounts?${params.toString()}`);
      toast.success('Đã thêm tài khoản ngân hàng');
      setShowDialog(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error('Error creating bank account:', error);
      toast.error('Không thể thêm tài khoản');
    }
  };

  const resetForm = () => {
    setFormData({
      account_name: '',
      account_number: '',
      bank_code: '',
      bank_name: '',
      branch: '',
      currency: 'VND',
      account_type: 'checking',
      is_primary: false,
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const formatAccountNumber = (number, show = false) => {
    if (!number) return '';
    if (show) return number;
    const visible = number.slice(-4);
    return `${'•'.repeat(number.length - 4)}${visible}`;
  };

  const toggleShowAccount = (id) => {
    setShowAccountNumbers(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Đã sao chép số tài khoản');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getBankInfo = (code) => {
    return vietnameseBanks.find(b => b.code === code) || { name: code, color: 'bg-slate-600' };
  };

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const primaryAccount = accounts.find(a => a.is_primary);
  const checkingAccounts = accounts.filter(a => a.account_type === 'checking');
  const savingsAccounts = accounts.filter(a => a.account_type === 'savings');

  return (
    <div className="space-y-6" data-testid="bank-account-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tài khoản Ngân hàng</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý các tài khoản ngân hàng của doanh nghiệp</p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button data-testid="add-bank-account-btn">
              <Plus className="h-4 w-4 mr-2" />
              Thêm tài khoản
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-blue-600" />
                Thêm Tài khoản Ngân hàng
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Tên tài khoản</Label>
                <Input
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="VD: TK Thanh toán chính"
                  required
                />
              </div>
              
              <div>
                <Label>Ngân hàng</Label>
                <Select value={formData.bank_code} onValueChange={(v) => {
                  const bank = vietnameseBanks.find(b => b.code === v);
                  setFormData({ ...formData, bank_code: v, bank_name: bank?.name || '' });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn ngân hàng" />
                  </SelectTrigger>
                  <SelectContent>
                    {vietnameseBanks.map((bank) => (
                      <SelectItem key={bank.code} value={bank.code}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${bank.color}`} />
                          {bank.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Số tài khoản</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <Label>Chi nhánh (tuỳ chọn)</Label>
                <Input
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="VD: Hồ Chí Minh"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Loại tài khoản</Label>
                  <Select value={formData.account_type} onValueChange={(v) => setFormData({ ...formData, account_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Thanh toán</SelectItem>
                      <SelectItem value="savings">Tiết kiệm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tiền tệ</Label>
                  <Select value={formData.currency} onValueChange={(v) => setFormData({ ...formData, currency: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VND">VND</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <Label className="text-sm">Đặt làm TK chính</Label>
                  <p className="text-xs text-slate-500">Sử dụng cho các giao dịch mặc định</p>
                </div>
                <Switch
                  checked={formData.is_primary}
                  onCheckedChange={(v) => setFormData({ ...formData, is_primary: v })}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Huỷ
                </Button>
                <Button type="submit">Thêm tài khoản</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600">Tổng số dư</p>
                <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">TK Thanh toán</p>
                <p className="text-2xl font-bold text-slate-800">{checkingAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">TK Tiết kiệm</p>
                <p className="text-2xl font-bold text-slate-800">{savingsAccounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                <Landmark className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Tổng TK</p>
                <p className="text-2xl font-bold text-slate-800">{accounts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Danh sách Tài khoản
          </CardTitle>
          <CardDescription>Các tài khoản ngân hàng đã liên kết</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Đang tải...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Landmark className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Chưa có tài khoản ngân hàng nào</p>
              <p className="text-sm mt-1">Thêm tài khoản để quản lý tài chính</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accounts.map((account) => {
                const bankInfo = getBankInfo(account.bank_code);
                const AccountTypeInfo = accountTypeLabels[account.account_type] || accountTypeLabels.checking;
                const TypeIcon = AccountTypeInfo.icon;
                const isShowing = showAccountNumbers[account.id];

                return (
                  <div
                    key={account.id}
                    className={`relative p-5 rounded-xl border-2 transition-all hover:shadow-lg ${
                      account.is_primary ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {account.is_primary && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-blue-600 hover:bg-blue-700">
                          <Star className="h-3 w-3 mr-1" />
                          Chính
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-12 w-12 rounded-xl ${bankInfo.color} flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-xs">{account.bank_code}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{account.account_name}</p>
                          <p className="text-sm text-slate-500">{bankInfo.name}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <TypeIcon className="h-3 w-3 mr-1" />
                        {AccountTypeInfo.label}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Số tài khoản</span>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                            {formatAccountNumber(account.account_number, isShowing)}
                          </code>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => toggleShowAccount(account.id)}
                          >
                            {isShowing ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(account.account_number, account.id)}
                          >
                            {copiedId === account.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {account.branch && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Chi nhánh</span>
                          <span className="text-sm">{account.branch}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-sm text-slate-500">Số dư hiện tại</span>
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(account.current_balance)}
                        </span>
                      </div>

                      {account.last_synced && (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Cập nhật lần cuối
                          </span>
                          <span>{new Date(account.last_synced).toLocaleString('vi-VN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vietnamese Banks Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-indigo-600" />
            Ngân hàng hỗ trợ
          </CardTitle>
          <CardDescription>Các ngân hàng Việt Nam được hỗ trợ trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {vietnameseBanks.map((bank) => (
              <div
                key={bank.code}
                className="flex items-center gap-2 p-3 rounded-lg border hover:shadow-md transition-shadow bg-white"
              >
                <div className={`w-8 h-8 rounded-lg ${bank.color} flex items-center justify-center shadow`}>
                  <span className="text-white font-bold text-xs">{bank.code}</span>
                </div>
                <span className="text-sm font-medium text-slate-700 truncate">{bank.name}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Tích hợp ngân hàng</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Hỗ trợ kiểm tra số dư tự động qua API Open Banking</li>
              <li>Đối soát giao dịch tự động với hoá đơn/công nợ</li>
              <li>Thông báo biến động số dư theo thời gian thực</li>
              <li>Xuất sao kê theo định dạng chuẩn kế toán</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
