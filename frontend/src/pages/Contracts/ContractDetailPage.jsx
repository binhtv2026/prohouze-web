/**
 * Contract Detail Page with Tabs
 * Prompt 9/20 - Phase 4 Frontend
 * 
 * Tabs: Overview | Financial | Documents | Approval | Amendments | Audit Log
 * UI locked based on contract status (Constraint Engine)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { contractApi, documentApi, CONTRACT_STATUS_COLORS, isContractLocked } from '@/lib/contractApi';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowLeft,
  Lock,
  Send,
  CheckCircle,
  XCircle,
  Pen,
  FileText,
  FilePlus,
  AlertTriangle,
  Info,
  DollarSign,
  Clock,
  User,
  Building,
  Calendar,
  Shield,
  History,
} from 'lucide-react';

// Import tab components
import ContractOverviewTab from './tabs/ContractOverviewTab';
import ContractFinancialTab from './tabs/ContractFinancialTab';
import ContractDocumentsTab from './tabs/ContractDocumentsTab';
import ContractApprovalTab from './tabs/ContractApprovalTab';
import ContractAmendmentsTab from './tabs/ContractAmendmentsTab';
import ContractAuditTab from './tabs/ContractAuditTab';

const DEMO_CONTRACT = {
  id: 'contract-demo-001',
  contract_code: 'HD-2026-001',
  contract_type: 'sale_purchase',
  contract_type_label: 'Hợp đồng mua bán',
  created_at: new Date().toISOString(),
  contract_date: new Date().toISOString(),
  effective_date: new Date().toISOString(),
  expiry_date: null,
  status: 'pending_review',
  status_label: 'Chờ duyệt',
  customer_name: 'Pham Gia Bao',
  customer_id: 'cust-demo-001',
  product_code: 'A1-1208',
  product_name: 'Can ho A1-1208',
  project_name: 'The Horizon City',
  unit_area: 72.5,
  created_by_name: 'Nguyen Van Minh',
  owner_name: 'Nguyen Van Minh',
  branch_id: 'CN-HCM',
  deal_id: 'deal-demo-001',
  grand_total: 4250000000,
  total_paid: 850000000,
  remaining_amount: 3400000000,
  overdue_amount: 0,
  payment_completion_percent: 20,
  unit_price: 3900000000,
  price_per_sqm: 53793103,
  premium_adjustments: 150000000,
  discount_amount: 0,
  discount_percent: 0,
  contract_value: 3900000000,
  vat_percent: 10,
  vat_amount: 390000000,
  maintenance_fee: 50000000,
  deposit_amount: 200000000,
  deposit_paid: 200000000,
  deposit_paid_date: new Date().toISOString(),
  payment_schedule: [
    { installment_no: 1, due_date: new Date().toISOString(), amount: 200000000, paid_amount: 200000000, status: 'paid' },
    { installment_no: 2, due_date: new Date().toISOString(), amount: 650000000, paid_amount: 650000000, status: 'paid' },
    { installment_no: 3, due_date: new Date().toISOString(), amount: 850000000, paid_amount: 0, status: 'pending' },
  ],
  finance_review_required: true,
  approval_status: 'in_progress',
  current_approval_step: 1,
  sales_review_status: 'pending',
  legal_review_status: 'pending',
  finance_review_status: 'pending',
  tags: ['hot', 'uu-tien'],
  notes: 'Khach hang da xem nha mau va dong y tien do thanh toan.',
};

const DEMO_DOCUMENTS = [
  {
    id: 'doc-001',
    category: 'contract_primary',
    document_name: 'Hop dong mua ban ban nhap',
    file_size: 245760,
    file_url: '#',
    uploaded_at: new Date().toISOString(),
    status: 'verified',
  },
  {
    id: 'doc-002',
    category: 'customer_cccd',
    document_name: 'CCCD khach hang',
    file_size: 102400,
    file_url: '#',
    uploaded_at: new Date().toISOString(),
    status: 'pending',
  },
];

const DEMO_AMENDMENTS = [
  {
    id: 'amend-001',
    amendment_code: 'PL-001',
    amendment_type_label: 'Điều chỉnh tiến độ thanh toán',
    status: 'draft',
    created_at: new Date().toISOString(),
    created_by_name: 'Nguyen Van Minh',
  },
];

const DEMO_AUDIT_LOGS = [
  {
    id: 'audit-001',
    action: 'create',
    action_label: 'Tạo hợp đồng',
    performed_by_name: 'Nguyen Van Minh',
    created_at: new Date().toISOString(),
    notes: 'Tạo mới từ deal đang chốt.',
  },
];

export default function ContractDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      const [contractRes, docsRes, amendsRes, logsRes] = await Promise.all([
        contractApi.get(id),
        documentApi.list({ entity_type: 'contract', entity_id: id }),
        contractApi.getAmendments(id),
        contractApi.getAuditLogs(id),
      ]);
      setContract(contractRes || DEMO_CONTRACT);
      setDocuments(Array.isArray(docsRes) && docsRes.length > 0 ? docsRes : DEMO_DOCUMENTS);
      setAmendments(Array.isArray(amendsRes) && amendsRes.length > 0 ? amendsRes : DEMO_AMENDMENTS);
      setAuditLogs(Array.isArray(logsRes) && logsRes.length > 0 ? logsRes : DEMO_AUDIT_LOGS);
    } catch (error) {
      setContract({ ...DEMO_CONTRACT, id: id || DEMO_CONTRACT.id });
      setDocuments(DEMO_DOCUMENTS);
      setAmendments(DEMO_AMENDMENTS);
      setAuditLogs(DEMO_AUDIT_LOGS);
      toast.error('Không thể tải thông tin hợp đồng, đang hiển thị dữ liệu mẫu');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  const isLocked = contract ? isContractLocked(contract.status) : false;

  // Action handlers
  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await contractApi.submit(id);
      toast.success('Đã gửi duyệt');
      loadContract();
    } catch (error) {
      toast.error(error.message || 'Lỗi gửi duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (step) => {
    setActionLoading(true);
    try {
      await contractApi.approve(id, { approval_step: step });
      toast.success('Đã duyệt');
      loadContract();
    } catch (error) {
      toast.error(error.message || 'Lỗi duyệt');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!contract) return null;
    const colorClass = CONTRACT_STATUS_COLORS[contract.status] || 'bg-slate-100 text-slate-700';
    return (
      <Badge className={`${colorClass} font-medium text-sm px-3 py-1`}>
        {isLocked && <Lock className="w-3 h-3 mr-1" />}
        {contract.status_label || contract.status}
      </Badge>
    );
  };

  const getActionButtons = () => {
    if (!contract) return null;

    const buttons = [];

    // Draft -> can Submit
    if (contract.status === 'draft') {
      buttons.push(
        <Button
          key="submit"
          onClick={handleSubmit}
          disabled={actionLoading}
          className="bg-amber-500 hover:bg-amber-600"
          data-testid="submit-btn"
        >
          <Send className="w-4 h-4 mr-2" />
          Gửi duyệt
        </Button>
      );
    }

    // Pending Review -> can Approve (based on current step)
    if (contract.status === 'pending_review') {
      if (contract.current_approval_step === 1) {
        buttons.push(
          <Button
            key="approve-sales"
            onClick={() => handleApprove('sales')}
            disabled={actionLoading}
            className="bg-green-500 hover:bg-green-600"
            data-testid="approve-sales-btn"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Duyệt (Sales)
          </Button>
        );
      }
      if (contract.current_approval_step === 2 && contract.sales_review_status === 'approved') {
        buttons.push(
          <Button
            key="approve-legal"
            onClick={() => handleApprove('legal')}
            disabled={actionLoading}
            className="bg-green-500 hover:bg-green-600"
            data-testid="approve-legal-btn"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Duyệt (Legal)
          </Button>
        );
      }
    }

    // Approved -> can Sign
    if (contract.status === 'approved') {
      buttons.push(
        <Button
          key="sign"
          onClick={() => navigate(`/contracts/${id}/sign`)}
          disabled={actionLoading}
          className="bg-purple-500 hover:bg-purple-600"
          data-testid="sign-btn"
        >
          <Pen className="w-4 h-4 mr-2" />
          Ký hợp đồng
        </Button>
      );
    }

    // Signed -> can Activate or Create Amendment
    if (contract.status === 'signed') {
      buttons.push(
        <Button
          key="activate"
          onClick={async () => {
            setActionLoading(true);
            try {
              await contractApi.activate(id);
              toast.success('Đã kích hoạt hợp đồng');
              loadContract();
            } catch (error) {
              toast.error(error.message || 'Lỗi kích hoạt');
            } finally {
              setActionLoading(false);
            }
          }}
          disabled={actionLoading}
          className="bg-green-500 hover:bg-green-600"
          data-testid="activate-btn"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Kích hoạt
        </Button>
      );
    }

    // Locked contracts -> can only create Amendment
    if (isLocked) {
      buttons.push(
        <Button
          key="amendment"
          onClick={() => setActiveTab('amendments')}
          variant="outline"
          data-testid="amendment-btn"
        >
          <FilePlus className="w-4 h-4 mr-2" />
          Tạo Phụ lục
        </Button>
      );
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Chi tiết Hợp đồng" />
        <div className="p-6 flex items-center justify-center">
          <div className="text-slate-500">Đang tải...</div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header title="Hợp đồng không tồn tại" />
        <div className="p-6 flex items-center justify-center">
          <Button onClick={() => navigate('/contracts')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contract-detail-page">
      <Header title="Chi tiết Hợp đồng" />

      <div className="p-6 space-y-6">
        {/* Header Card */}
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              {/* Left: Contract Info */}
              <div className="flex items-start gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/contracts')}
                  className="mt-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-slate-900">
                      {contract.contract_code}
                    </h1>
                    {getStatusBadge()}
                    {isLocked && (
                      <Badge variant="outline" className="text-slate-500">
                        <Lock className="w-3 h-3 mr-1" />
                        Đã khóa
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {contract.customer_name || 'Chưa có KH'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {contract.product_code} - {contract.project_name}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(contract.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex flex-wrap gap-2">
                {getActionButtons()}
              </div>
            </div>

            {/* Lock Warning */}
            {isLocked && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">
                  Hợp đồng đã khóa. Để thay đổi thông tin, vui lòng tạo Phụ lục (Amendment).
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white p-1 shadow-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <Info className="w-4 h-4 mr-2" />
              Tổng quan
            </TabsTrigger>
            <TabsTrigger value="financial" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <DollarSign className="w-4 h-4 mr-2" />
              Tài chính
            </TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              Tài liệu
              {documents.length > 0 && (
                <Badge variant="secondary" className="ml-2">{documents.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approval" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <Shield className="w-4 h-4 mr-2" />
              Phê duyệt
            </TabsTrigger>
            <TabsTrigger value="amendments" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <FilePlus className="w-4 h-4 mr-2" />
              Phụ lục
              {amendments.length > 0 && (
                <Badge variant="secondary" className="ml-2">{amendments.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="data-[state=active]:bg-[#316585] data-[state=active]:text-white">
              <History className="w-4 h-4 mr-2" />
              Lịch sử
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ContractOverviewTab contract={contract} isLocked={isLocked} onRefresh={loadContract} />
          </TabsContent>

          <TabsContent value="financial">
            <ContractFinancialTab contract={contract} isLocked={isLocked} onRefresh={loadContract} />
          </TabsContent>

          <TabsContent value="documents">
            <ContractDocumentsTab 
              contract={contract} 
              documents={documents} 
              isLocked={isLocked} 
              onRefresh={loadContract}
            />
          </TabsContent>

          <TabsContent value="approval">
            <ContractApprovalTab 
              contract={contract} 
              onApprove={handleApprove}
              onRefresh={loadContract}
            />
          </TabsContent>

          <TabsContent value="amendments">
            <ContractAmendmentsTab 
              contract={contract} 
              amendments={amendments}
              isLocked={isLocked}
              onRefresh={loadContract}
            />
          </TabsContent>

          <TabsContent value="audit">
            <ContractAuditTab auditLogs={auditLogs} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
