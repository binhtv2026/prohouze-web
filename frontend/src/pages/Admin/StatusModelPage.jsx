import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, GitBranch, Loader2, ShieldCheck } from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function StatusModelPage() {
  const [statusModels, setStatusModels] = useState(governanceFoundationService.getStatusModels());
  const [statusRules, setStatusRules] = useState(governanceFoundationService.getStatusRules());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadStatusModels = async () => {
      try {
        const [apiStatusModels, apiStatusRules] = await Promise.all([
          governanceFoundationApi.getStatusModels(),
          governanceFoundationApi.getStatusRules(),
        ]);
        if (active) {
          setStatusModels(apiStatusModels);
          setStatusRules(apiStatusRules);
        }
      } catch (error) {
        console.warn('Status model API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadStatusModels();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="status-model-page">
      <PageHeader
        title="Status Model"
        subtitle="Canonical state machines cho phase 1 de loai bo status tu do va chuan hoa workflow"
        breadcrumbs={[
          { label: 'Cai dat', path: '/settings' },
          { label: 'Data Foundation', path: '/settings/data-foundation' },
          { label: 'Status Model', path: '/settings/status-model' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-[#16314f] text-white">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Canonical State Machines</Badge>
              <h2 className="mt-4 text-3xl font-bold">Workflow se khong on dinh neu status khong duoc khoa</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Trang nay chot cac state machine loi cho Sales, CRM, Finance va Contract de phase 1 build dung mot ngon ngu van hanh.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Scope</p>
              <p className="mt-2 text-2xl font-bold">6 domains</p>
              <p className="text-sm text-white/75">Lead, deal, booking, contract, payment, payout.</p>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Dang dong bo canonical status models...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Quy Tac Xuyen Suot</CardTitle>
              <CardDescription>Cac nguyen tac nay ap dung cho moi status transition trong phase 1.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {statusRules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{rule}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Next Config Cluster</CardTitle>
              <CardDescription>Status Model phai di cung Approval Matrix va Audit Timeline.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[#316585]/35 bg-[#316585]/5 p-5">
                <p className="text-sm leading-6 text-slate-700">
                  Khi state machine duoc khoa, tung module se biet chinh xac:
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['allowed transitions', 'blocking conditions', 'alerts', 'approval hooks'].map((item) => (
                    <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                    <Link to="/settings/approval-matrix">
                      Mo Approval Matrix
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {statusModels.map((domain) => (
            <Card key={domain.code} className="border-slate-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                      <GitBranch className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{domain.title}</CardTitle>
                      <CardDescription>{domain.code}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-[#316585]/20 text-[#316585]">
                    Locked
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {domain.states.map((state) => (
                    <Badge key={state} variant="secondary" className="bg-slate-100 text-slate-700">
                      {state}
                    </Badge>
                  ))}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#316585]" />
                    <p className="text-sm leading-6 text-slate-700">{domain.rule}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
