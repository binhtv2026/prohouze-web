import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Flag, LifeBuoy, Rocket, ShieldCheck } from 'lucide-react';
import {
  getPlatformFinalGoLiveGates,
  getPlatformFinalGoLiveSummary,
  getPlatformRunbookMatrix,
  getPlatformWaveMatrix,
  PLATFORM_FINAL_GO_LIVE_PHASE_8,
} from '@/config/platformFinalGoLivePhaseEight';

export default function PlatformFinalGoLivePage() {
  const summary = useMemo(() => getPlatformFinalGoLiveSummary(), []);
  const gates = useMemo(() => getPlatformFinalGoLiveGates(), []);
  const waves = useMemo(() => getPlatformWaveMatrix(), []);
  const runbook = useMemo(() => getPlatformRunbookMatrix(), []);

  return (
    <div className="space-y-6" data-testid="platform-final-go-live-page">
      <PageHeader
        title="Pilot + Go-live Final"
        subtitle="Khóa bước 8: command center cuối cùng để quyết định go/no-go dựa trên gate, wave triển khai và runbook hypercare."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Pilot + Go-live Final' },
        ]}
      />

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle>{PLATFORM_FINAL_GO_LIVE_PHASE_8.label}</CardTitle>
          <CardDescription className="text-white/75">
            {PLATFORM_FINAL_GO_LIVE_PHASE_8.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Gate cuối</p>
            <p className="mt-2 text-sm text-white/75">Chỉ được go-live khi toàn bộ gate bước 1-7 đều pass.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Wave triển khai</p>
            <p className="mt-2 text-sm text-white/75">Pilot nội bộ, controlled launch và completion wave đều phải có owner và exit criteria.</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4">
            <p className="text-sm font-semibold">Hypercare / rollback</p>
            <p className="mt-2 text-sm text-white/75">Support roster, issue triage, rollback plan và launch command center phải sẵn sàng.</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Gate đã khóa</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.lockedGates}/{summary.totalGates}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Wave triển khai</CardDescription>
            <CardTitle className="text-3xl text-sky-700">{summary.lockedWaves}/{summary.totalWaves}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Runbook hypercare</CardDescription>
            <CardTitle className="text-3xl text-emerald-700">{summary.lockedRunbookItems}/{summary.totalRunbookItems}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Trạng thái cuối</CardDescription>
            <CardTitle className={`text-3xl ${summary.fullyLocked ? 'text-emerald-700' : 'text-rose-700'}`}>
              {summary.fullyLocked ? 'Locked' : 'Chưa khóa'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="gates" className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          <TabsTrigger value="gates">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Final gates
          </TabsTrigger>
          <TabsTrigger value="waves">
            <Rocket className="mr-2 h-4 w-4" />
            Launch waves
          </TabsTrigger>
          <TabsTrigger value="runbook">
            <LifeBuoy className="mr-2 h-4 w-4" />
            Hypercare runbook
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gates" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {gates.map((gate) => (
              <Card key={gate.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{gate.label}</CardTitle>
                      <CardDescription>{gate.detail}</CardDescription>
                    </div>
                    <Badge className={gate.locked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {gate.locked ? 'Locked' : 'Thiếu'}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="waves" className="space-y-4">
          <div className="grid gap-4">
            {waves.map((wave) => (
              <Card key={wave.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{wave.label}</CardTitle>
                      <CardDescription>{wave.focus}</CardDescription>
                    </div>
                    <Badge className={wave.locked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                      <Flag className="mr-1 h-3 w-3" />
                      {wave.locked ? 'Wave locked' : 'Thiếu'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
                  <div className="space-y-3">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Vai trò trong wave</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {wave.rolesDetail.map((item) => (
                          <Badge key={item.role} variant="outline" className="border-slate-200 text-slate-700">
                            {item.profile.ten}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">Owner</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {wave.owners.map((owner) => (
                          <Badge key={owner} variant="outline" className="border-slate-200 text-slate-700">
                            {owner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Exit criteria</p>
                    <div className="mt-3 space-y-2">
                      {wave.exitCriteria.map((entry) => (
                        <div key={entry} className="rounded-lg bg-white p-3 text-sm text-slate-600">
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="runbook" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {runbook.map((item) => (
              <Card key={item.id} className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{item.label}</CardTitle>
                      <CardDescription>{item.note}</CardDescription>
                    </div>
                    <Badge className={item.locked ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-rose-100 text-rose-700 border-0'}>
                      {item.locked ? 'Locked' : 'Thiếu'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Owner</p>
                    <p className="mt-1">{item.owner}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">Artifact / điểm kiểm soát</p>
                    <p className="mt-1 break-all">{item.artifact}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
