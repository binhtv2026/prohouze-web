import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckSquare, FileCheck, Loader2, ShieldCheck, Users, Wallet } from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function ApprovalMatrixPage() {
  const [approvalFlows, setApprovalFlows] = useState(governanceFoundationService.getApprovalFlows());
  const [approvalRules, setApprovalRules] = useState(governanceFoundationService.getApprovalRules());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadApprovalFlows = async () => {
      try {
        const [apiApprovalFlows, apiApprovalRules] = await Promise.all([
          governanceFoundationApi.getApprovalFlows(),
          governanceFoundationApi.getApprovalRules(),
        ]);
        if (active) {
          setApprovalFlows(apiApprovalFlows);
          setApprovalRules(apiApprovalRules);
        }
      } catch (error) {
        console.warn('Approval matrix API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadApprovalFlows();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="approval-matrix-page">
      <PageHeader
        title="Approval Matrix"
        subtitle="Ma tran duyet cho booking, contract, payout va expense trong phase 1"
        breadcrumbs={[
          { label: 'Cai dat', path: '/settings' },
          { label: 'Data Foundation', path: '/settings/data-foundation' },
          { label: 'Approval Matrix', path: '/settings/approval-matrix' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#16314f] via-[#1d4460] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Approval Control</Badge>
              <h2 className="mt-4 text-3xl font-bold">Khong co approval matrix thi se khong co kiem soat ngoai le</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Approval Matrix khoa ai duoc duyet, duyet cai gi va trong thu tu nao cho cac workflow nhay cam cua phase 1.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Protected Flows</p>
              <p className="mt-2 text-2xl font-bold">4 workflows</p>
              <p className="text-sm text-white/75">Booking, contract, payout, expense.</p>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Dang dong bo approval matrix...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Nguyen Tac Duyet</CardTitle>
              <CardDescription>Quy tac phai dung chung cho moi approval workflow.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvalRules.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Config Linkage</CardTitle>
              <CardDescription>Approval Matrix phai lien ket voi status model va audit trail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-slate-900">Role Mapping</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Moi step map theo role: sales owner, manager, legal, finance, ops.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-slate-900">Money Control</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Dong tien va payout bat buoc di qua approval, khong xac nhan mieng.
                  </p>
                </div>
              </div>
              <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                <Link to="/settings/status-model">
                  Mo Status Model
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {approvalFlows.map((flow) => (
            <Card key={flow.title} className="border-slate-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                      <CheckSquare className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{flow.title}</CardTitle>
                      <CardDescription>Owner role: {flow.owner}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#316585]/20 text-[#316585]">
                    Controlled
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm leading-6 text-slate-700">{flow.trigger}</p>
                </div>
                <div className="space-y-2">
                  {flow.steps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#316585] text-sm font-semibold text-white">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{step}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <FileCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">
                    Moi approval request phai sinh ra timeline event va audit event de doi soat duoc ve sau.
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
