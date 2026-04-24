/**
 * ProHouze Entity Schemas Page
 * Version: 1.0 - Prompt 3/20
 * 
 * Admin interface for viewing entity schema configurations.
 * Displays field definitions, sections, and validation rules.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import api from '@/lib/api';
import { toast } from 'sonner';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';
import {
  ArrowRight,
  AlertTriangle,
  Database,
  FileCode,
  Columns3,
  FormInput,
  Loader2,
  RefreshCw,
  ChevronRight,
  Filter,
  ListOrdered,
  Network,
  ShieldCheck,
  History,
} from 'lucide-react';

const FIELD_TYPE_COLORS = {
  text: 'bg-blue-100 text-blue-700',
  textarea: 'bg-blue-100 text-blue-700',
  number: 'bg-green-100 text-green-700',
  currency: 'bg-emerald-100 text-emerald-700',
  date: 'bg-purple-100 text-purple-700',
  datetime: 'bg-purple-100 text-purple-700',
  select: 'bg-amber-100 text-amber-700',
  multi_select: 'bg-amber-100 text-amber-700',
  phone: 'bg-cyan-100 text-cyan-700',
  email: 'bg-cyan-100 text-cyan-700',
  boolean: 'bg-pink-100 text-pink-700',
  tags: 'bg-indigo-100 text-indigo-700',
  user_picker: 'bg-orange-100 text-orange-700',
  entity_relation: 'bg-red-100 text-red-700',
};

const LAYER_COLORS = {
  core: 'bg-slate-600 text-white',
  business: 'bg-[#316585] text-white',
  extension: 'bg-slate-400 text-white',
  computed: 'bg-purple-600 text-white',
};

export default function EntitySchemasPage() {
  const [entities, setEntities] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [schema, setSchema] = useState(null);
  const [formConfig, setFormConfig] = useState(null);
  const [listConfig, setListConfig] = useState(null);
  const [schemaAlignment, setSchemaAlignment] = useState([]);
  const [statusNormalization, setStatusNormalization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const governanceIndex = governanceFoundationService.getEntityGovernanceIndex();
  const governanceCoverage = governanceFoundationService.getEntityGovernanceCoverage(
    entities.map((entity) => entity.entity),
  );
  const selectedGovernance = selectedEntity
    ? governanceFoundationService.getEntityGovernanceForEntity(selectedEntity)
    : null;
  const selectedSchemaAlignment = selectedEntity
    ? schemaAlignment.find((item) => item.entity === selectedEntity)
    : null;
  const selectedNormalization = selectedSchemaAlignment
    ? statusNormalization.filter((item) => selectedSchemaAlignment.masterDataDependencies.includes(item.category_key))
    : [];

  useEffect(() => {
    let active = true;

    const loadSchemaAlignment = async () => {
      try {
        const [data, normalizationData] = await Promise.all([
          governanceFoundationApi.getEntitySchemaAlignment(),
          governanceFoundationApi.getStatusNormalization(),
        ]);
        if (active) {
          setSchemaAlignment(
            data.map((item) => ({
              entity: item.entity,
              entityLabel: item.entity_label,
              governanceDomain: item.governance_domain,
              masterDataDependencies: item.master_data_dependencies,
              masterDataFields: item.master_data_fields,
              statusModels: item.status_models,
              approvalFlows: item.approval_flows,
              timelineStreams: item.timeline_streams,
            })),
          );
          setStatusNormalization(normalizationData);
        }
      } catch (error) {
        console.warn('Entity schema alignment API unavailable, using local fallback.', error);
      }
    };

    loadSchemaAlignment();

    return () => {
      active = false;
    };
  }, []);

  const loadEntities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/entity-schemas');
      setEntities(response.data);
      // Auto-select first entity
      if (response.data.length > 0) {
        handleSelectEntity(response.data[0].entity);
      }
    } catch (error) {
      toast.error('Không thể tải danh sách entities');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load entity list
  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  const handleSelectEntity = async (entityName) => {
    try {
      setLoadingDetail(true);
      setSelectedEntity(entityName);
      
      const [schemaRes, formRes, listRes] = await Promise.all([
        api.get(`/config/entity-schemas/${entityName}`),
        api.get(`/config/entity-schemas/${entityName}/form-config`),
        api.get(`/config/entity-schemas/${entityName}/list-config`),
      ]);
      
      setSchema(schemaRes.data);
      setFormConfig(formRes.data);
      setListConfig(listRes.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết entity');
      console.error(error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const renderFlagBadges = (flags) => (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag) => (
        <Badge key={flag} variant="outline" className="text-[10px] py-0 px-1">
          {flag.replace(/_/g, ' ')}
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="entity-schemas-page">
      <PageHeader
        title="Entity Schema"
        subtitle="Cấu hình cấu trúc dữ liệu và biểu mẫu cho các thực thể nghiệp vụ"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Entity Schema', path: '/settings/entity-schemas' },
        ]}
        actions={
          <Button variant="outline" onClick={loadEntities} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        }
      />

      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#316585]" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-[#16314f] text-white">
              <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <Badge className="bg-white/10 text-white hover:bg-white/10">Schema có kiểm soát</Badge>
                  <h2 className="mt-4 text-3xl font-bold">Entity schema phải map được vào cụm quản trị của giai đoạn 1</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Màn hình này không chỉ để xem field. Đây là nơi kiểm tra entity nào đã map domain,
                    workflow và lớp kiểm soát, entity nào còn hở để không build lệch quy chiếu.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Thực thể</p>
                    <p className="mt-2 text-2xl font-bold">{entities.length}</p>
                    <p className="text-sm text-white/75">Hiện có trong schema registry</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Đã map</p>
                    <p className="mt-2 text-2xl font-bold">{governanceCoverage.mapped}</p>
                    <p className="text-sm text-white/75">Đã có domain và lớp kiểm soát</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Chưa map</p>
                    <p className="mt-2 text-2xl font-bold">{governanceCoverage.unmapped}</p>
                    <p className="text-sm text-white/75">Cần rà soát với governance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Left - Entity List */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Thực thể
                  </CardTitle>
                  <CardDescription>Danh sách schema kèm theo trạng thái kiểm soát.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entities.map((entity) => (
                    (() => {
                      const mapping = governanceFoundationService.getEntityGovernanceForEntity(entity.entity);
                      return (
                    <button
                      key={entity.entity}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                        selectedEntity === entity.entity
                          ? 'bg-[#316585]/10 border-2 border-[#316585]'
                          : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                      }`}
                      onClick={() => handleSelectEntity(entity.entity)}
                      data-testid={`entity-btn-${entity.entity}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{entity.label}</p>
                          <p className="text-xs text-slate-500">{entity.entity}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {mapping ? (
                          <>
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              {mapping.domain}
                            </Badge>
                            <Badge variant="outline" className="border-[#316585]/20 text-[#316585]">
                              đã kiểm soát
                            </Badge>
                          </>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            cần rà soát
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {entity.field_count} trường
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {entity.section_count} nhóm
                        </Badge>
                      </div>
                    </button>
                      );
                    })()
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Ảnh chụp độ phủ</CardTitle>
                  <CardDescription>Kết quả map schema vào cụm quản trị nền tảng.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Registry</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{governanceIndex.length}</p>
                    <p className="text-sm text-slate-600">Liên kết thực thể chuẩn đã được khóa</p>
                  </div>
                  {governanceCoverage.unmappedEntities.length > 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Cần rà soát</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {governanceCoverage.unmappedEntities.map((entityName) => (
                          <Badge key={entityName} className="bg-white text-amber-700">
                            {entityName}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm leading-6 text-emerald-700">
                        Toàn bộ entity trong danh sách schema hiện đã map vào governance registry.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right - Entity Detail */}
            <div className="lg:col-span-3">
              {loadingDetail ? (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-[#316585] mx-auto" />
                  </CardContent>
                </Card>
              ) : schema ? (
                <Tabs defaultValue="fields" className="space-y-4">
                  <Card className="border-slate-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-[#316585]" />
                            {schema.label}
                            <Badge variant="outline">{schema.entity}</Badge>
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Trường chính: <code className="bg-slate-100 px-1 rounded">{schema.primary_field}</code>
                          </CardDescription>
                        </div>
                        <TabsList>
                          <TabsTrigger value="fields" className="gap-1">
                            <Columns3 className="w-4 h-4" />
                            Trường dữ liệu
                          </TabsTrigger>
                          <TabsTrigger value="form" className="gap-1">
                            <FormInput className="w-4 h-4" />
                            Biểu mẫu
                          </TabsTrigger>
                          <TabsTrigger value="list" className="gap-1">
                            <ListOrdered className="w-4 h-4" />
                            Danh sách
                          </TabsTrigger>
                        </TabsList>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card className="border-slate-200 bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg">Độ phủ quản trị</CardTitle>
                      <CardDescription>Trạng thái map của entity này với domain, workflow và lớp kiểm soát của giai đoạn 1.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedGovernance ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr_1fr]">
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center gap-3">
                                <Database className="h-5 w-5 text-slate-700" />
                                <h3 className="font-semibold text-slate-900">Miền nghiệp vụ</h3>
                              </div>
                              <p className="mt-3 text-base font-semibold text-slate-900">{selectedGovernance.domain}</p>
                              <p className="mt-2 text-sm leading-6 text-slate-600">{selectedGovernance.purpose}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center gap-3">
                                <Network className="h-5 w-5 text-slate-700" />
                                <h3 className="font-semibold text-slate-900">Luồng nghiệp vụ</h3>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedGovernance.workflows.map((workflow) => (
                                  <Badge key={workflow} className="bg-[#316585]/10 text-[#316585] hover:bg-[#316585]/10">
                                    {workflow}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 p-4">
                              <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-slate-700" />
                                <h3 className="font-semibold text-slate-900">Lớp kiểm soát</h3>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedGovernance.controls.map((control) => (
                                  <Badge key={control} variant="outline" className="border-slate-200 text-slate-700">
                                    {control}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mô hình trạng thái</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedGovernance.linkedStatusModels.length > 0 ? (
                                  selectedGovernance.linkedStatusModels.map((item) => (
                                    <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                                      {item}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-500">Không bắt buộc cho entity này</span>
                                )}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Luồng phê duyệt</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedGovernance.linkedApprovalFlows.length > 0 ? (
                                  selectedGovernance.linkedApprovalFlows.map((item) => (
                                    <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                                      {item}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-500">Không có luồng duyệt mặc định</span>
                                )}
                              </div>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Luồng lịch sử</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {selectedGovernance.linkedTimelineStreams.length > 0 ? (
                                  selectedGovernance.linkedTimelineStreams.map((item) => (
                                    <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                                      {item}
                                    </Badge>
                                  ))
                                ) : (
                                  <span className="text-sm text-slate-500">Không có luồng lịch sử mặc định</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm leading-6 text-amber-700">
                            Entity này chưa map vào canonical governance registry. Cần rà soát trước khi xem là hoàn tất giai đoạn 1.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {selectedSchemaAlignment && (
                    <Card className="border-slate-200 bg-white">
                      <CardHeader>
                        <CardTitle className="text-lg">Liên kết Master Data</CardTitle>
                        <CardDescription>Những danh mục cấu hình đang cấp dữ liệu cho entity này.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phụ thuộc dữ liệu</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{selectedSchemaAlignment.masterDataDependencies.length}</p>
                            <p className="text-sm text-slate-600">Category master data</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mô hình trạng thái</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{selectedSchemaAlignment.statusModels.length}</p>
                            <p className="text-sm text-slate-600">Liên kết state machine</p>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Phê duyệt / Lịch sử</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">
                              {selectedSchemaAlignment.approvalFlows.length + selectedSchemaAlignment.timelineStreams.length}
                            </p>
                            <p className="text-sm text-slate-600">Điểm gắn kiểm soát</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Category master data</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedSchemaAlignment.masterDataDependencies.length > 0 ? (
                              selectedSchemaAlignment.masterDataDependencies.map((item) => (
                                <Badge key={item} className="bg-white text-[#316585] border border-[#316585]/20">
                                  {item}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-slate-500">Không có phụ thuộc master data</span>
                            )}
                          </div>
                        </div>

                        {selectedSchemaAlignment.masterDataFields.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Liên kết field</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                              {selectedSchemaAlignment.masterDataFields.map((fieldRef) => (
                                <div key={`${fieldRef.entity}-${fieldRef.field_key}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                  <p className="text-sm font-medium text-slate-900">{fieldRef.field_label}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {fieldRef.field_key} · {fieldRef.field_type} · {fieldRef.section || 'no-section'}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {selectedNormalization.length > 0 && (
                    <Card className="border-amber-200 bg-amber-50/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-700" />
                          Ảnh hưởng chuẩn hóa
                        </CardTitle>
                        <CardDescription>Entity này đang dùng những category master data cần được chuẩn hóa về canonical state machine.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {selectedNormalization.map((item) => (
                          <div key={`${item.category_key}-${item.legacy_state}`} className="rounded-2xl border border-amber-200 bg-white p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="border-slate-200 text-slate-700">
                                {item.category_key}
                              </Badge>
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                {item.legacy_state}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-slate-400" />
                              <Badge
                                className={
                                  item.suggested_canonical_state
                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                }
                              >
                                {item.suggested_canonical_state || 'cần rà soát tay'}
                              </Badge>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-700">{item.rationale}</p>
                          </div>
                        ))}
                        <div className="flex flex-wrap gap-3 pt-1">
                          <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                            <Link to="/settings/governance-remediation">
                              Mở Kế hoạch chuẩn hóa
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                          <Button asChild variant="outline">
                            <Link to="/settings/master-data">Mở Master Data</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Fields Tab */}
                  <TabsContent value="fields">
                    <Card className="border-slate-200">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead className="font-bold text-slate-700 w-32">Key</TableHead>
                              <TableHead className="font-bold text-slate-700">Nhãn hiển thị</TableHead>
                              <TableHead className="font-bold text-slate-700 w-28">Kiểu dữ liệu</TableHead>
                              <TableHead className="font-bold text-slate-700 w-24">Lớp</TableHead>
                              <TableHead className="font-bold text-slate-700 w-24">Nhóm</TableHead>
                              <TableHead className="font-bold text-slate-700">Thuộc tính</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {schema.fields.map((field) => (
                              <TableRow key={field.key} className={field.system ? 'opacity-50' : ''}>
                                <TableCell className="font-mono text-xs">{field.key}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{field.label}</p>
                                    {field.label_en && (
                                      <p className="text-xs text-slate-500">{field.label_en}</p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={FIELD_TYPE_COLORS[field.type] || 'bg-slate-100'}>
                                    {field.type}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={LAYER_COLORS[field.layer] || 'bg-slate-400'}>
                                    {field.layer}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-slate-600">
                                  {field.section || '-'}
                                </TableCell>
                                <TableCell>{renderFlagBadges(field.flags)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Form Tab */}
                  <TabsContent value="form">
                    <div className="space-y-4">
                      {formConfig?.sections.map((section) => (
                        <Card key={section.key} className="border-slate-200">
                          <CardHeader className="py-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              {section.label}
                              <Badge variant="outline" className="text-xs">
                                {section.fields.length} trường
                              </Badge>
                              {section.collapsible && (
                                <Badge variant="secondary" className="text-xs">thu gọn được</Badge>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                              {section.fields.map((field) => (
                                <div key={field.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{field.label}</p>
                                    <p className="text-xs text-slate-500 font-mono">{field.key}</p>
                                  </div>
                                  <Badge className={FIELD_TYPE_COLORS[field.type] || 'bg-slate-100'}>
                                    {field.type}
                                  </Badge>
                                  {field.flags.includes('required') && (
                                    <Badge variant="destructive" className="text-xs">*</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  {/* List Tab */}
                  <TabsContent value="list">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Columns */}
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Columns3 className="w-4 h-4" />
                            Cột hiển thị
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {listConfig?.columns.map((col, idx) => (
                              <div key={col.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <Badge variant="secondary" className="text-xs w-6 h-6 flex items-center justify-center p-0">
                                  {idx + 1}
                                </Badge>
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{col.label}</p>
                                  <p className="text-xs text-slate-500 font-mono">{col.key}</p>
                                </div>
                                <Badge className={FIELD_TYPE_COLORS[col.type] || 'bg-slate-100'}>
                                  {col.type}
                                </Badge>
                                {col.sortable && (
                                  <Badge variant="outline" className="text-xs">sắp xếp được</Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Filters */}
                      <Card className="border-slate-200">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Bộ lọc khả dụng
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {listConfig?.filters.map((filter) => (
                              <div key={filter.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{filter.label}</p>
                                  <p className="text-xs text-slate-500 font-mono">{filter.key}</p>
                                </div>
                                <Badge className={FIELD_TYPE_COLORS[filter.type] || 'bg-slate-100'}>
                                  {filter.type}
                                </Badge>
                              </div>
                            ))}
                            {(!listConfig?.filters || listConfig.filters.length === 0) && (
                              <p className="text-sm text-slate-500 text-center py-4">
                                Không có bộ lọc
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <FileCode className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">
                      Chọn một thực thể
                    </h3>
                    <p className="text-sm text-slate-500">
                      Chọn thực thể ở cột trái để xem schema chi tiết
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-wrap gap-3 p-6">
                <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                  <Link to="/settings/entity-governance">
                    Đi tới Liên kết thực thể
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/governance">Quay lại Trung tâm quản trị</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
