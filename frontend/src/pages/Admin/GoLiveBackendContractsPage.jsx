import React, { useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Database, Network, Shield } from 'lucide-react';
import { getBackendContractSummary, getGoLiveBackendContracts } from '@/config/goLiveBackendContracts';

export default function GoLiveBackendContractsPage() {
  const contracts = useMemo(() => getGoLiveBackendContracts(), []);
  const summary = useMemo(() => getBackendContractSummary(), []);
  const contractsByDomain = useMemo(
    () =>
      contracts.reduce((accumulator, contract) => {
        accumulator[contract.domain] = accumulator[contract.domain] || [];
        accumulator[contract.domain].push(contract);
        return accumulator;
      }, {}),
    [contracts],
  );
  const domains = Object.keys(contractsByDomain);

  return (
    <div className="space-y-6" data-testid="go-live-backend-contracts-page">
      <PageHeader
        title="Hợp đồng backend go-live"
        subtitle="Nguồn chuẩn cho endpoint, request/response và phạm vi route bắt buộc phải khóa trước khi vận hành."
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Hợp đồng backend go-live' },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Tổng contract</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.totalContracts}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Các contract nằm trong go-live đợt 1.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Đã khóa</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.lockedContracts}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Route chỉ pass khi contract backend đã khóa.</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Domain</CardDescription>
            <CardTitle className="text-3xl text-[#16314f]">{summary.domains}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Auth, CRM, Sales, Marketing, Finance, HR, Legal, CMS...</CardContent>
        </Card>
        <Card className="border-[#316585]/15">
          <CardHeader className="pb-3">
            <CardDescription>Trạng thái</CardDescription>
            <CardTitle className="text-xl text-[#16314f]">{summary.fullyLocked ? 'Locked 100%' : 'Chưa đủ'}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600">Chỉ nghiệm thu khi toàn bộ contract đạt trạng thái khóa.</CardContent>
        </Card>
      </div>

      <Card className="border-[#316585]/15 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Tiêu chuẩn khóa bước 4
          </CardTitle>
          <CardDescription className="text-white/75">
            Mỗi route go-live phải map được tới contract backend cụ thể, có method, endpoint, request shape, response shape và owner chịu trách nhiệm.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge className="bg-white/10 text-white">{summary.lockedContracts}/{summary.totalContracts} contract đã khóa</Badge>
          <Badge className="bg-white/10 text-white">{summary.domains} domain backend</Badge>
        </CardContent>
      </Card>

      <Tabs defaultValue={domains[0]} className="space-y-4">
        <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
          {domains.map((domain) => (
            <TabsTrigger key={domain} value={domain}>
              <Network className="mr-2 h-4 w-4" />
              {domain}
            </TabsTrigger>
          ))}
        </TabsList>

        {domains.map((domain) => (
          <TabsContent key={domain} value={domain} className="space-y-4">
            <div className="grid gap-4">
              {contractsByDomain[domain].map((contract) => (
                <Card key={contract.key} className="border-slate-200">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">{contract.label}</CardTitle>
                        <CardDescription>{contract.key}</CardDescription>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="border-0 bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Locked
                        </Badge>
                        <Badge variant="outline">{contract.method}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Endpoint</p>
                        <p className="mt-1 break-all">{contract.endpoint}</p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Request shape</p>
                          <p className="mt-1">{contract.requestShape}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                          <p className="font-semibold text-slate-900">Response shape</p>
                          <p className="mt-1">{contract.responseShape}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Owner</p>
                        <p className="mt-1">{contract.owner}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Consumer</p>
                        <p className="mt-1">{contract.consumer}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                        <p className="font-semibold text-slate-900">Route gắn với contract</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {contract.routePrefixes.map((prefix) => (
                            <Badge key={prefix} variant="outline" className="border-[#316585]/20 text-[#16314f]">
                              {prefix}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5 text-[#316585]" />
            Kết luận khóa bước 4
          </CardTitle>
          <CardDescription>
            Tất cả route go-live chính thức đã được buộc vào contract backend cụ thể và trạng thái khóa.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
