import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  ArrowRight,
  Clock3,
  FileClock,
  History,
  Loader2,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function AuditTimelineFoundationPage() {
  const [auditRules, setAuditRules] = useState(governanceFoundationService.getAuditRules());
  const [criticalMoments, setCriticalMoments] = useState(governanceFoundationService.getCriticalMoments());
  const [timelineStreams, setTimelineStreams] = useState(governanceFoundationService.getTimelineStreams());
  const [deliverables, setDeliverables] = useState(governanceFoundationService.getAuditDeliverables());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadAuditTimeline = async () => {
      try {
        const [apiAuditRules, apiCriticalMoments, apiTimelineStreams, apiAuditDeliverables] = await Promise.all([
          governanceFoundationApi.getAuditRules(),
          governanceFoundationApi.getCriticalMoments(),
          governanceFoundationApi.getTimelineStreams(),
          governanceFoundationApi.getAuditDeliverables(),
        ]);

        if (active) {
          setAuditRules(apiAuditRules);
          setCriticalMoments(apiCriticalMoments);
          setTimelineStreams(apiTimelineStreams);
          setDeliverables(apiAuditDeliverables);
        }
      } catch (error) {
        console.warn('Audit/timeline API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAuditTimeline();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="audit-timeline-foundation-page">
      <PageHeader
        title="Audit / Timeline Foundation"
        subtitle="Nen truy vet va lich su thao tac cho cac workflow core cua phase 1"
        breadcrumbs={[
          { label: 'Cai dat', path: '/settings' },
          { label: 'Data Foundation', path: '/settings/data-foundation' },
          { label: 'Audit / Timeline', path: '/settings/audit-timeline' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#334155] text-white">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Traceability Layer</Badge>
              <h2 className="mt-4 text-3xl font-bold">Khong co audit va timeline thi se khong co quan tri that</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Lop nay khoa cach he thong ghi nho ai da lam gi, tren doi tuong nao, vao luc nao va thay doi dieu gi trong cac workflow phase 1.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Core Promise</p>
                <p className="mt-2 text-2xl font-bold">Trace every change</p>
                <p className="text-sm text-white/75">Khong mat dau vet thao tac nhay cam.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Usage</p>
                <p className="mt-2 text-2xl font-bold">Ops + CEO</p>
                <p className="text-sm text-white/75">Dung cho doi soat, canh bao, dieu hanh.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Dang dong bo audit va timeline foundation...
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Audit Rules</CardTitle>
              <CardDescription>Bat buoc dung chung cho moi event nhay cam.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {auditRules.map((rule) => (
                <div key={rule} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{rule}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Critical Moments</CardTitle>
              <CardDescription>Nhung thay doi nay phai co audit va timeline ngay khi xay ra.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {criticalMoments.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Timeline Streams</CardTitle>
            <CardDescription>Nhung dong su kien can xuat hien tren profile, deal, booking va finance.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {timelineStreams.map((stream) => (
              <div key={stream.title} className="rounded-2xl border border-slate-200 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100">
                    <History className="h-5 w-5 text-slate-700" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{stream.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stream.items.map((item) => (
                    <Badge key={item} variant="secondary" className="bg-slate-100 text-slate-700">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Definition of Done</CardTitle>
              <CardDescription>Lop nay xong khi co du output sau.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliverables.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4">
                  <FileClock className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Cluster Linkage</CardTitle>
              <CardDescription>Audit / Timeline phai di cung Status Model va Approval Matrix.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-dashed border-[#316585]/35 bg-[#316585]/5 p-5">
                <div className="flex items-center gap-3">
                  <Activity className="h-5 w-5 text-[#316585]" />
                  <h3 className="font-semibold text-slate-900">Cach 3 lop nay lien ket</h3>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <Clock3 className="h-5 w-5 text-slate-700" />
                    <p className="mt-2 text-sm font-medium text-slate-900">Status Model</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Quyet dinh transition nao hop le.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <UserCheck className="h-5 w-5 text-slate-700" />
                    <p className="mt-2 text-sm font-medium text-slate-900">Approval Matrix</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Quyet dinh ai duoc duyet ngoai le.</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <History className="h-5 w-5 text-slate-700" />
                    <p className="mt-2 text-sm font-medium text-slate-900">Audit / Timeline</p>
                    <p className="mt-1 text-xs leading-5 text-slate-600">Ghi lai da co chuyen gi xay ra.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                  <Link to="/settings/status-model">
                    Di toi Status Model
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/approval-matrix">Di toi Approval Matrix</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/data-foundation">Quay lai Data Foundation</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
