import React, { useEffect, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Database, Loader2, Network, ShieldCheck } from 'lucide-react';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';

export default function EntityGovernanceMappingPage() {
  const [mappings, setMappings] = useState(governanceFoundationService.getCanonicalEntities());
  const [entityMappings, setEntityMappings] = useState(governanceFoundationService.getEntityGovernanceIndex());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMappings = async () => {
      try {
        const [apiMappings, apiEntityMappings] = await Promise.all([
          governanceFoundationApi.getCanonicalDomains(),
          governanceFoundationApi.getEntityMapping(),
        ]);
        if (active) {
          setMappings(apiMappings);
          setEntityMappings(
            apiEntityMappings.map((item) => ({
              entity: item.entity,
              domain: item.domain,
              purpose: item.purpose,
              workflows: item.workflows,
              controls: item.controls,
              linkedStatusModels: item.linked_status_models,
              linkedApprovalFlows: item.linked_approval_flows,
              linkedTimelineStreams: item.linked_timeline_streams,
            })),
          );
        }
      } catch (error) {
        console.warn('Governance mapping API unavailable, using local registry fallback.', error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMappings();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="entity-governance-mapping-page">
      <PageHeader
        title="Entity Governance Mapping"
        subtitle="Map domain -> entities -> workflow -> governance controls de phase 1 build dung mot he quy chieu"
        breadcrumbs={[
          { label: 'Cai dat', path: '/settings' },
          { label: 'Governance Console', path: '/settings/governance' },
          { label: 'Entity Governance Mapping', path: '/settings/entity-governance' },
        ]}
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-[#16314f] text-white">
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="bg-white/10 text-white hover:bg-white/10">Canonical Mapping</Badge>
              <h2 className="mt-4 text-3xl font-bold">Moi domain phai map duoc du lieu, workflow va governance control</h2>
              <p className="mt-2 text-sm leading-6 text-white/75">
                Trang nay la cau noi giua Data Foundation va Governance Console, giup phase 1 khong bi build lech entity.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">Registry</p>
              <p className="mt-2 text-2xl font-bold">{mappings.length} domains</p>
              <p className="text-sm text-white/75">Canonical mapping cho cluster phase 1.</p>
            </div>
          </CardContent>
        </Card>

        {loading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-[#316585]" />
            Dang tai canonical governance mapping...
          </div>
        )}

        <div className="space-y-4">
          {mappings.map((mapping) => (
            <Card key={mapping.domain} className="border-slate-200 bg-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{mapping.domain}</CardTitle>
                    <CardDescription>{mapping.purpose}</CardDescription>
                  </div>
                  <Badge variant="outline" className="border-[#316585]/20 text-[#316585]">
                    {mapping.entities.length} entities
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-slate-900">Entities</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mapping.entities.map((entity) => (
                      <Badge key={entity} variant="secondary" className="bg-slate-100 text-slate-700">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <Network className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-slate-900">Workflows</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mapping.workflows.map((workflow) => (
                      <Badge key={workflow} className="bg-[#316585]/10 text-[#316585] hover:bg-[#316585]/10">
                        {workflow}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-slate-700" />
                    <h3 className="font-semibold text-slate-900">Governance</h3>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mapping.governance.map((item) => (
                      <Badge key={item} variant="outline" className="border-slate-200 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Entity-Level Control Coverage</CardTitle>
            <CardDescription>Day la lop kiem tra xuong den tung entity de biet entity nao co status, approval va timeline hooks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {entityMappings.map((item) => (
              <div key={item.entity} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">{item.entity}</h3>
                      <Badge variant="outline" className="border-[#316585]/20 text-[#316585]">
                        {item.domain}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.purpose}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.controls.map((control) => (
                      <Badge key={control} variant="secondary" className="bg-slate-100 text-slate-700">
                        {control}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.linkedStatusModels.length > 0 ? item.linkedStatusModels.map((value) => (
                        <Badge key={value} className="bg-white text-[#316585] border border-[#316585]/20">
                          {value}
                        </Badge>
                      )) : <span className="text-sm text-slate-500">Khong bat buoc</span>}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.linkedApprovalFlows.length > 0 ? item.linkedApprovalFlows.map((value) => (
                        <Badge key={value} className="bg-white text-[#316585] border border-[#316585]/20">
                          {value}
                        </Badge>
                      )) : <span className="text-sm text-slate-500">Khong co flow mac dinh</span>}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timeline</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.linkedTimelineStreams.length > 0 ? item.linkedTimelineStreams.map((value) => (
                        <Badge key={value} className="bg-white text-[#316585] border border-[#316585]/20">
                          {value}
                        </Badge>
                      )) : <span className="text-sm text-slate-500">Khong co stream mac dinh</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white">
          <CardContent className="flex flex-wrap gap-3 p-6">
            <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
              <Link to="/settings/governance">
                Quay lai Governance Console
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/settings/data-foundation">Di toi Data Foundation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
