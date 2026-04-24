/**
 * Contacts Page - Contact-centric CRM
 * Prompt 6/20 - CRM Unified Profile Standardization
 * UPDATED: Using Dynamic Form Renderer (Prompt 3/20 Phase 4)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { contactsAPI, crmConfigAPI } from '@/lib/crmApi';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Plus,
  MoreVertical,
  Phone,
  Mail,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  User,
  Building2,
  MapPin,
  Calendar,
  Tag,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import UnifiedProfileModal from '@/components/crm/UnifiedProfileModal';
import { CustomerFormModal } from '@/components/forms/CustomerFormModal';

const DEFAULT_CONTACT_STATUSES = [
  { code: 'active', label: 'Đang theo', color: 'bg-blue-100 text-blue-700' },
  { code: 'potential', label: 'Tiềm năng', color: 'bg-amber-100 text-amber-700' },
  { code: 'won', label: 'Đã chốt', color: 'bg-emerald-100 text-emerald-700' },
  { code: 'lost', label: 'Đã mất', color: 'bg-rose-100 text-rose-700' },
];

const buildDemoContacts = ({ status = '', search = '' } = {}) => {
  const demoContacts = [
    {
      id: 'demo-contact-1',
      full_name: 'Nguyễn Thành Nam',
      phone: '0903 111 222',
      phone_masked: '0903 *** 222',
      email: 'nam.demo@prohouze.com',
      contact_type: 'individual',
      status: 'active',
      total_leads: 3,
      created_at: new Date().toISOString(),
    },
    {
      id: 'demo-contact-2',
      full_name: 'Trần Mỹ Linh',
      phone: '0912 555 666',
      phone_masked: '0912 *** 666',
      email: 'linh.demo@prohouze.com',
      contact_type: 'individual',
      status: 'potential',
      total_leads: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'demo-contact-3',
      full_name: 'Công ty Minh Quân Land',
      phone: '028 9999 8888',
      phone_masked: '028 *** 8888',
      email: 'contact@minhquanland.vn',
      company_name: 'Minh Quân Land',
      contact_type: 'company',
      status: 'won',
      total_leads: 5,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  return demoContacts.filter((contact) => {
    const matchesStatus = !status || contact.status === status;
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      [contact.full_name, contact.phone, contact.email, contact.company_name].some((value) =>
        String(value || '').toLowerCase().includes(normalizedSearch)
      );
    return matchesStatus && matchesSearch;
  });
};

export default function ContactsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactStatuses, setContactStatuses] = useState([]);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
  });

  const loadConfig = useCallback(async () => {
    try {
      const res = await crmConfigAPI.getContactStatuses();
      setContactStatuses(res.data?.statuses?.length ? res.data.statuses : DEFAULT_CONTACT_STATUSES);
    } catch (error) {
      console.error('Failed to load config:', error);
      setContactStatuses(DEFAULT_CONTACT_STATUSES);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      
      const response = await contactsAPI.getAll(params);
      const nextContacts = Array.isArray(response.data) ? response.data : [];
      setContacts(nextContacts.length ? nextContacts : buildDemoContacts(filters));
    } catch (error) {
      console.error('Failed to load contacts:', error);
      setContacts(buildDemoContacts(filters));
      toast.warning('Đang hiển thị dữ liệu mẫu vì chưa tải được contact thật');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadConfig();
    
    if (searchParams.get('new') === 'true') {
      setShowAddModal(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('new');
      setSearchParams(nextParams, { replace: true });
    }
  }, [loadConfig, loadContacts, searchParams, setSearchParams]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Handle Edit Contact
  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setShowEditModal(true);
  };

  const handleViewProfile = (contact) => {
    setSelectedContact(contact);
    setShowProfileModal(true);
  };

  const getStatusBadge = (statusCode) => {
    const status = contactStatuses.find(s => s.code === statusCode);
    return (
      <Badge className={status?.color || 'bg-slate-100 text-slate-700'}>
        {status?.label || statusCode}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="contacts-page">
      <PageHeader
        title="Quản lý Contacts"
        subtitle="Danh bạ khách hàng - Single source of identity"
        breadcrumbs={[
          { label: 'CRM', path: '/crm' },
          { label: 'Contacts', path: '/crm/contacts' },
        ]}
        onSearch={(value) => setFilters(prev => ({ ...prev, search: value }))}
        searchPlaceholder="Tìm kiếm contact..."
        onAddNew={() => setShowAddModal(true)}
        addNewLabel="Thêm Contact"
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Trạng thái</Label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value === 'all' ? '' : e.target.value }))}
                className="h-10 w-40 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:border-[#316585] focus:outline-none"
                data-testid="filter-status"
              >
                <option value="all">Tất cả</option>
                {contactStatuses.map((status) => (
                  <option key={status.code} value={status.code}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <Badge variant="outline" className="text-slate-600">
              {contacts.length} contacts
            </Badge>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadContacts}
            data-testid="refresh-btn"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>

        {/* Contacts Table */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center">
                <User className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Chưa có contact nào</h3>
                <p className="text-slate-500 mb-4">Bắt đầu bằng cách thêm contact đầu tiên</p>
                <Button onClick={() => setShowAddModal(true)} className="bg-[#316585] hover:bg-[#264f68]">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm Contact
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold text-slate-700">Họ tên</TableHead>
                    <TableHead className="font-bold text-slate-700">SĐT</TableHead>
                    <TableHead className="font-bold text-slate-700">Email</TableHead>
                    <TableHead className="font-bold text-slate-700">Loại</TableHead>
                    <TableHead className="font-bold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="font-bold text-slate-700">Leads</TableHead>
                    <TableHead className="font-bold text-slate-700">Ngày tạo</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow 
                      key={contact.id} 
                      className="table-row-hover cursor-pointer"
                      onClick={() => handleViewProfile(contact)}
                      data-testid={`contact-row-${contact.id}`}
                    >
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#316585]/10 flex items-center justify-center text-[#316585] font-medium">
                            {contact.full_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium">{contact.full_name}</p>
                            {contact.company_name && (
                              <p className="text-xs text-slate-500">{contact.company_name}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {contact.phone_masked || contact.phone}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {contact.email || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {contact.contact_type === 'individual' ? 'Cá nhân' : 'Doanh nghiệp'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(contact.status)}
                      </TableCell>
                      <TableCell className="text-slate-600">
                        {contact.total_leads || 0}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {formatDate(contact.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" data-testid={`contact-actions-${contact.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewProfile(contact); }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Xem Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedContact(contact); setShowEditModal(true); }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Add Contact Modal - Using Dynamic Form */}
      <CustomerFormModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        customer={null}
        onSuccess={loadContacts}
      />

      {/* Edit Contact Modal - Using Dynamic Form */}
      <CustomerFormModal
        open={showEditModal}
        onOpenChange={(open) => {
          setShowEditModal(open);
          if (!open) setEditingContact(null);
        }}
        customer={editingContact || selectedContact}
        onSuccess={loadContacts}
      />

      {/* Unified Profile Modal */}
      <UnifiedProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        contactId={selectedContact?.id}
      />
    </div>
  );
}
