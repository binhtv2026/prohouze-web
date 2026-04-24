/**
 * ProHouze Master Data Management Page
 * Version: 1.0 - Prompt 3/20
 * 
 * Admin interface for viewing and managing master data configurations.
 * Allows admins to view, add, edit, and disable picklist items.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import api from '@/lib/api';
import { toast } from 'sonner';
import { governanceFoundationService } from '@/services/governanceFoundationService';
import { governanceFoundationApi } from '@/api/governanceFoundationApi';
import {
  ArrowRight,
  Database,
  Settings2,
  Search,
  Edit,
  Plus,
  Loader2,
  RefreshCw,
  BookOpen,
  FileJson,
  GitBranch,
  ShieldCheck,
  History,
  AlertTriangle,
} from 'lucide-react';

export default function MasterDataPage() {
  const [masterData, setMasterData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    code: '',
    label: '',
    label_en: '',
    color: '',
    icon: '',
    group: '',
    order: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [alignment, setAlignment] = useState([]);
  const [statusNormalization, setStatusNormalization] = useState([]);
  const governanceSummary = governanceFoundationService.getGovernanceSummary();

  // Load master data
  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    let active = true;

    const loadAlignment = async () => {
      try {
        const [alignmentData, normalizationData] = await Promise.all([
          governanceFoundationApi.getMasterDataAlignment(),
          governanceFoundationApi.getStatusNormalization(),
        ]);
        if (active) {
          setAlignment(alignmentData);
          setStatusNormalization(normalizationData);
        }
      } catch (error) {
        console.warn('Master data alignment API unavailable, using empty alignment fallback.', error);
      }
    };

    loadAlignment();

    return () => {
      active = false;
    };
  }, []);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/master-data');
      setMasterData(response.data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu cấu hình');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter categories by search term
  const filteredCategories = Object.values(masterData).filter((category) =>
    category.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group categories
  const categoryGroups = {
    crm: {
      label: 'CRM & Sales',
      categories: ['lead_statuses', 'lead_sources', 'lead_segments', 'deal_stages', 'loss_reasons'],
    },
    product: {
      label: 'Sản phẩm & Dự án',
      categories: ['property_types', 'product_statuses', 'project_statuses'],
    },
    task: {
      label: 'Công việc',
      categories: ['task_statuses', 'task_priorities', 'task_types'],
    },
    operations: {
      label: 'Vận hành',
      categories: ['booking_statuses', 'campaign_types', 'campaign_statuses', 'activity_types'],
    },
    finance: {
      label: 'Tài chính & Pháp lý',
      categories: ['contract_statuses', 'payment_methods'],
    },
    system: {
      label: 'Hệ thống',
      categories: ['user_roles', 'provinces', 'price_ranges', 'area_ranges'],
    },
  };

  const getCategoryByKey = (key) => masterData[key];
  const selectedAlignment = selectedCategory
    ? alignment.find((item) => item.category_key === selectedCategory.key)
    : null;
  const selectedNormalization = useMemo(
    () => (selectedCategory ? statusNormalization.filter((item) => item.category_key === selectedCategory.key) : []),
    [selectedCategory, statusNormalization],
  );

  // Open Add/Edit Modal
  const openAddModal = () => {
    setEditingItem(null);
    setItemForm({
      code: '',
      label: '',
      label_en: '',
      color: '',
      icon: '',
      group: '',
      order: selectedCategory?.items?.length + 1 || 1,
      is_active: true,
    });
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setItemForm({
      code: item.code,
      label: item.label,
      label_en: item.label_en || '',
      color: item.color || '',
      icon: item.icon || '',
      group: item.group || '',
      order: item.order,
      is_active: item.is_active,
    });
    setShowItemModal(true);
  };

  // Save Item (Create or Update)
  const handleSaveItem = async () => {
    if (!selectedCategory) return;
    
    setSaving(true);
    try {
      if (editingItem) {
        // Update existing
        await api.put(`/config/master-data/${selectedCategory.key}/items/${editingItem.code}`, {
          label: itemForm.label,
          label_en: itemForm.label_en || null,
          color: itemForm.color || null,
          icon: itemForm.icon || null,
          group: itemForm.group || null,
          order: itemForm.order,
          is_active: itemForm.is_active,
        });
        toast.success('Đã cập nhật item');
      } else {
        // Create new
        await api.post(`/config/master-data/${selectedCategory.key}/items`, {
          code: itemForm.code,
          label: itemForm.label,
          label_en: itemForm.label_en || null,
          color: itemForm.color || null,
          icon: itemForm.icon || null,
          group: itemForm.group || null,
          order: itemForm.order,
          is_active: itemForm.is_active,
        });
        toast.success('Đã thêm item mới');
      }
      
      setShowItemModal(false);
      loadMasterData();
      // Re-select category to refresh items
      setTimeout(() => {
        const updated = masterData[selectedCategory.key];
        if (updated) setSelectedCategory(updated);
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Có lỗi xảy ra');
    } finally {
      setSaving(false);
    }
  };

  // Toggle item active status
  const handleToggleActive = async (item) => {
    if (!selectedCategory) return;
    
    try {
      if (item.is_active) {
        await api.delete(`/config/master-data/${selectedCategory.key}/items/${item.code}`);
        toast.success('Đã tắt item');
      } else {
        await api.post(`/config/master-data/${selectedCategory.key}/items/${item.code}/activate`);
        toast.success('Đã bật lại item');
      }
      loadMasterData();
    } catch (error) {
      toast.error('Có lỗi xảy ra');
    }
  };

  const renderCategoryCard = (category) => {
    if (!category) return null;
    
    const activeCount = category.items.filter(i => i.is_active).length;
    const totalCount = category.items.length;
    const categoryMismatchCount = statusNormalization.filter((item) => item.category_key === category.key).length;
    
    return (
      <Card
        key={category.key}
        className={`cursor-pointer transition-all hover:shadow-md border-2 ${
          selectedCategory?.key === category.key
            ? 'border-[#316585] bg-[#316585]/5'
            : 'border-slate-200 hover:border-slate-300'
        }`}
        onClick={() => setSelectedCategory(category)}
        data-testid={`category-card-${category.key}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-slate-900">{category.label}</h3>
              <p className="text-xs text-slate-500 mt-1">{category.key}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {activeCount}/{totalCount}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-3">
            {category.is_editable && (
              <Badge variant="secondary" className="text-xs">
                <Edit className="w-3 h-3 mr-1" />
                Có thể sửa
              </Badge>
            )}
            {category.is_extendable && (
              <Badge variant="secondary" className="text-xs">
                <Plus className="w-3 h-3 mr-1" />
                Có thể thêm
              </Badge>
            )}
            {categoryMismatchCount > 0 && (
              <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                {categoryMismatchCount} mismatch
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderItemRow = (item, index) => (
    <TableRow key={item.code} className={!item.is_active ? 'opacity-50 bg-slate-50' : ''}>
      <TableCell className="font-mono text-xs">{item.code}</TableCell>
      <TableCell className="font-medium">{item.label}</TableCell>
      <TableCell className="text-slate-500 text-sm">{item.label_en || '-'}</TableCell>
      <TableCell>
        {item.color ? (
          <Badge className={item.color}>{item.color.split(' ')[0]}</Badge>
        ) : '-'}
      </TableCell>
      <TableCell className="text-slate-500">{item.group || '-'}</TableCell>
      <TableCell className="text-center">{item.order}</TableCell>
      <TableCell className="text-center">
        <Switch 
          checked={item.is_active} 
          onCheckedChange={() => handleToggleActive(item)}
          disabled={!selectedCategory?.is_editable}
        />
      </TableCell>
      <TableCell className="text-right">
        {selectedCategory?.is_editable && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => openEditModal(item)}
            data-testid={`edit-${item.code}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );

  return (
    <div className="min-h-screen bg-slate-50" data-testid="master-data-page">
      <PageHeader
        title="Cấu hình Master Data"
        subtitle="Quản lý danh mục dùng chung, trạng thái chuẩn và dữ liệu cấu hình hệ thống"
        breadcrumbs={[
          { label: 'Cài đặt', path: '/settings' },
          { label: 'Master Data', path: '/settings/master-data' },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={loadMasterData}
            disabled={loading}
          >
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
            <Card className="border-slate-200 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
              <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <Badge className="bg-white/10 text-white hover:bg-white/10">Master Data Governance</Badge>
                  <h2 className="mt-4 text-3xl font-bold">Master Data phải song hành với trạng thái, phê duyệt và nhật ký</h2>
                  <p className="mt-2 text-sm leading-6 text-white/75">
                    Đây là lớp cấu hình mà mọi workflow lõi sẽ đọc vào. Nếu danh mục trạng thái, approval hooks và
                    audit policy lệch nhau thì giai đoạn 1 sẽ không thể vận hành ổn định.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Categories</p>
                    <p className="mt-2 text-2xl font-bold">{Object.keys(masterData).length}</p>
                    <p className="text-sm text-white/75">Số category master data hiện có</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Status Models</p>
                    <p className="mt-2 text-2xl font-bold">{governanceSummary.statusModelCount}</p>
                    <p className="text-sm text-white/75">State machine đã khóa</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/55">Approval / Timeline</p>
                    <p className="mt-2 text-2xl font-bold">
                      {governanceSummary.approvalFlowCount + governanceSummary.timelineStreamCount}
                    </p>
                    <p className="text-sm text-white/75">Luồng duyệt và luồng lịch sử cần đồng bộ</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left Sidebar - Categories */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Danh mục dữ liệu
                  </CardTitle>
                  <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder="Tìm kiếm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="search-categories"
                    />
                  </div>
                </CardHeader>
                <CardContent className="max-h-[600px] overflow-y-auto">
                  <Accordion type="multiple" defaultValue={Object.keys(categoryGroups)}>
                    {Object.entries(categoryGroups).map(([groupKey, group]) => (
                      <AccordionItem key={groupKey} value={groupKey}>
                        <AccordionTrigger className="text-sm font-medium">
                          {group.label}
                          <Badge variant="outline" className="ml-auto mr-2 text-xs">
                            {group.categories.filter(k => masterData[k]).length}
                          </Badge>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 pt-2">
                            {group.categories.map((catKey) => {
                              const cat = getCategoryByKey(catKey);
                              if (!cat) return null;
                              return (
                                <button
                                  key={catKey}
                                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                    selectedCategory?.key === catKey
                                      ? 'bg-[#316585]/10 text-[#316585]'
                                      : 'hover:bg-slate-100 text-slate-700'
                                  }`}
                                  onClick={() => setSelectedCategory(cat)}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{cat.label}</span>
                                    <Badge variant="secondary" className="text-xs">
                                      {cat.items.filter(i => i.is_active).length}
                                    </Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
              
              {/* Stats */}
              <Card className="border-slate-200 bg-gradient-to-br from-[#316585]/5 to-white">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#316585]">
                        {Object.keys(masterData).length}
                      </p>
                      <p className="text-xs text-slate-500">Danh mục</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-[#316585]">
                        {Object.values(masterData).reduce((acc, cat) => acc + cat.items.length, 0)}
                      </p>
                      <p className="text-xs text-slate-500">Tổng items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Alignment Controls</CardTitle>
                  <CardDescription>Master data phải đồng bộ với 3 lớp điều khiển bên dưới.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <GitBranch className="mt-0.5 h-5 w-5 text-[#316585]" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Status Model</p>
                      <p className="text-sm leading-6 text-slate-600">Danh mục trạng thái phải map vào state machine chuẩn.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <ShieldCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Approval Matrix</p>
                      <p className="text-sm leading-6 text-slate-600">Các giá trị nhạy cảm không được tách rời khỏi luồng duyệt.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <History className="mt-0.5 h-5 w-5 text-[#316585]" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Audit / Timeline</p>
                      <p className="text-sm leading-6 text-slate-600">Mọi thay đổi master data quan trọng phải để lại dấu vết.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Alignment Coverage</CardTitle>
                  <CardDescription>Category nào đang cấp dữ liệu cho schema và governance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mapped Categories</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {alignment.filter((item) => item.linked_entities.length > 0).length}
                    </p>
                    <p className="text-sm text-slate-600">Đang được field schema sử dụng.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Status-Controlled</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">
                      {alignment.filter((item) => item.linked_status_model).length}
                    </p>
                    <p className="text-sm text-slate-600">Gắn với state machine chuẩn.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Content - Category Detail */}
            <div className="lg:col-span-2">
              {selectedCategory ? (
                <Card className="border-slate-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Settings2 className="w-5 h-5 text-[#316585]" />
                          {selectedCategory.label}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <code className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                            {selectedCategory.key}
                          </code>
                          {selectedCategory.description && (
                            <span className="ml-2">{selectedCategory.description}</span>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCategory.is_extendable && (
                          <Button variant="outline" size="sm" onClick={openAddModal} data-testid="add-item-btn">
                            <Plus className="w-4 h-4 mr-1" />
                            Thêm mới
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <FileJson className="w-4 h-4 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {selectedAlignment && (
                      <div className="mb-6 grid gap-4 xl:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Miền nghiệp vụ</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {selectedAlignment.governance_domain || 'Chưa map'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mô hình trạng thái</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {selectedAlignment.linked_status_model || 'Không có'}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Entity liên kết</p>
                          <p className="mt-2 text-base font-semibold text-slate-900">
                            {selectedAlignment.linked_entities.length}
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNormalization.length > 0 && (
                      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-amber-700" />
                              <h4 className="text-sm font-semibold text-slate-900">Cần chuẩn hóa trạng thái</h4>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              Category này đang có trạng thái legacy lệch với canonical model. Cần chuẩn hóa trước khi xem là khóa xong giai đoạn 1.
                            </p>
                          </div>
                          <Button asChild size="sm" variant="outline">
                            <Link to="/settings/governance-remediation">Mở Kế hoạch chuẩn hóa</Link>
                          </Button>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          {selectedNormalization.map((item) => (
                            <div key={`${item.legacy_state}-${item.suggestion_type}`} className="rounded-2xl border border-amber-200 bg-white p-4">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                                  {item.legacy_state}
                                </Badge>
                                <ArrowRight className="h-4 w-4 text-slate-400" />
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
                              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                                {item.suggestion_type}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-700">{item.rationale}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="font-bold text-slate-700 w-32">Code</TableHead>
                          <TableHead className="font-bold text-slate-700">Label (VI)</TableHead>
                          <TableHead className="font-bold text-slate-700">Label (EN)</TableHead>
                          <TableHead className="font-bold text-slate-700 w-32">Color</TableHead>
                          <TableHead className="font-bold text-slate-700 w-24">Group</TableHead>
                          <TableHead className="font-bold text-slate-700 w-16 text-center">Order</TableHead>
                          <TableHead className="font-bold text-slate-700 w-20 text-center">Active</TableHead>
                          <TableHead className="font-bold text-slate-700 w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedCategory.items.map((item, index) => renderItemRow(item, index))}
                      </TableBody>
                    </Table>

                    {/* Metadata preview */}
                    {selectedCategory.items.some(i => Object.keys(i.metadata || {}).length > 0) && (
                      <div className="mt-6 pt-4 border-t">
                        <h4 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Metadata Preview
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {selectedCategory.items
                            .filter(i => Object.keys(i.metadata || {}).length > 0)
                            .slice(0, 4)
                            .map((item) => (
                              <div key={item.code} className="bg-slate-50 rounded-lg p-3">
                                <p className="text-xs font-medium text-slate-600 mb-1">{item.label}</p>
                                <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                                  {JSON.stringify(item.metadata, null, 2)}
                                </pre>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {selectedAlignment && (
                      <div className="mt-6 border-t pt-4">
                        <h4 className="mb-3 text-sm font-medium text-slate-700">Liên kết với schema</h4>
                        {selectedAlignment.linked_fields.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {selectedAlignment.linked_fields.map((fieldRef) => (
                              <div key={`${fieldRef.entity}-${fieldRef.field_key}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-sm font-medium text-slate-900">
                                  {fieldRef.entity_label} · {fieldRef.field_label}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {fieldRef.entity}.{fieldRef.field_key} · {fieldRef.field_type} · {fieldRef.section || 'no-section'}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">Danh mục này hiện chưa được field schema nào sử dụng.</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-slate-200">
                  <CardContent className="p-12 text-center">
                    <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-600 mb-2">
                      Chọn một danh mục
                    </h3>
                    <p className="text-sm text-slate-500">
                      Chọn danh mục từ bên trái để xem và quản lý các giá trị
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
            <Card className="border-slate-200 bg-white">
              <CardContent className="flex flex-wrap gap-3 p-6">
                <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                  <Link to="/settings/status-model">
                  Đi tới Mô hình trạng thái
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/approval-matrix">Đi tới Ma trận phê duyệt</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/audit-timeline">Đi tới Lịch sử / Nhật ký</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/governance-remediation">Đi tới Kế hoạch chuẩn hóa</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/settings/governance">Quay lại Trung tâm quản trị</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add/Edit Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? `Sửa: ${editingItem.label}` : 'Thêm item mới'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.label}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code *</Label>
                <Input
                  value={itemForm.code}
                  onChange={(e) => setItemForm({ ...itemForm, code: e.target.value })}
                  placeholder="new_status"
                  disabled={!!editingItem}
                  data-testid="item-code"
                />
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={itemForm.order}
                  onChange={(e) => setItemForm({ ...itemForm, order: parseInt(e.target.value) || 0 })}
                  data-testid="item-order"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Label (VI) *</Label>
                <Input
                  value={itemForm.label}
                  onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                  placeholder="Trạng thái mới"
                  data-testid="item-label"
                />
              </div>
              <div className="space-y-2">
                <Label>Label (EN)</Label>
                <Input
                  value={itemForm.label_en}
                  onChange={(e) => setItemForm({ ...itemForm, label_en: e.target.value })}
                  placeholder="New Status"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Color Class</Label>
                <Input
                  value={itemForm.color}
                  onChange={(e) => setItemForm({ ...itemForm, color: e.target.value })}
                  placeholder="bg-blue-100 text-blue-700"
                />
                {itemForm.color && (
                  <Badge className={itemForm.color}>Preview</Badge>
                )}
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Input
                  value={itemForm.group}
                  onChange={(e) => setItemForm({ ...itemForm, group: e.target.value })}
                  placeholder="engaged"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input
                value={itemForm.icon}
                onChange={(e) => setItemForm({ ...itemForm, icon: e.target.value })}
                placeholder="check-circle"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={itemForm.is_active}
                onCheckedChange={(checked) => setItemForm({ ...itemForm, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleSaveItem} 
              disabled={!itemForm.code || !itemForm.label || saving}
              className="bg-[#316585] hover:bg-[#264f68]"
              data-testid="save-item-btn"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingItem ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
