import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, Pencil, Trash2, Building2, Landmark, RefreshCw, ExternalLink, Image
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_PARTNERS = [
  {
    id: 'partner-1',
    name: 'Masterise Homes',
    logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=80&fit=crop',
    website: 'https://example.com/masterise',
    description: 'Đối tác chủ đầu tư chiến lược cho các dự án cao tầng.',
    category: 'developer',
    is_active: true,
    order: 1,
  },
  {
    id: 'partner-2',
    name: 'Techcombank',
    logo: 'https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=200&h=80&fit=crop',
    website: 'https://example.com/techcombank',
    description: 'Ngân hàng hỗ trợ giải ngân và ưu đãi lãi suất.',
    category: 'bank',
    is_active: true,
    order: 2,
  },
  {
    id: 'partner-3',
    name: 'PQR Realty',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&h=80&fit=crop',
    website: 'https://example.com/pqr',
    description: 'Đại lý phân phối trọng điểm tại khu Đông.',
    category: 'agency',
    is_active: true,
    order: 3,
  },
];

const CATEGORIES = [
  { value: 'developer', label: 'Chủ đầu tư' },
  { value: 'bank', label: 'Ngân hàng' },
  { value: 'agency', label: 'Đại lý' },
  { value: 'other', label: 'Khác' },
];

const emptyForm = {
  name: '',
  logo: '',
  website: '',
  description: '',
  category: 'developer',
  is_active: true,
  order: 0,
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/partners`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setPartners(Array.isArray(data) && data.length > 0 ? data : DEMO_PARTNERS);
    } catch (err) {
      setPartners(DEMO_PARTNERS);
      toast.error('Không thể tải danh sách đối tác');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/seed`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed');
      toast.success('Đã tạo dữ liệu mẫu thành công');
      fetchPartners();
    } catch (err) {
      toast.error('Không thể tạo dữ liệu mẫu');
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const filteredPartners = partners.filter(p => 
    filterCategory === 'all' || p.category === filterCategory
  );

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, order: partners.length + 1 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setForm(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.logo) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const url = editingItem 
        ? `${API_URL}/api/admin/content/partners/${editingItem.id}`
        : `${API_URL}/api/admin/content/partners`;
      
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      toast.success(editingItem ? 'Đã cập nhật' : 'Đã tạo mới');
      setIsDialogOpen(false);
      fetchPartners();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đối tác này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/content/partners/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Đã xóa');
      fetchPartners();
    } catch (err) {
      toast.error('Không thể xóa');
    }
  };

  const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;

  return (
    <div className="p-6 space-y-6" data-testid="admin-partners-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đối tác</h1>
          <p className="text-muted-foreground">Quản lý logo đối tác hiển thị trên trang chủ</p>
        </div>
        <div className="flex gap-2">
          {partners.length === 0 && (
            <Button variant="outline" onClick={seedData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tạo dữ liệu mẫu
            </Button>
          )}
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm đối tác
          </Button>
        </div>
      </div>

      {/* Stats & Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-4">
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xl font-bold">{partners.filter(p => p.category === 'developer').length}</p>
                <p className="text-xs text-muted-foreground">Chủ đầu tư</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <Landmark className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xl font-bold">{partners.filter(p => p.category === 'bank').length}</p>
                <p className="text-xs text-muted-foreground">Ngân hàng</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {loading ? (
          <p className="col-span-6 text-center py-8">Đang tải...</p>
        ) : filteredPartners.length === 0 ? (
          <p className="col-span-6 text-center py-8 text-muted-foreground">Chưa có đối tác nào</p>
        ) : (
          filteredPartners.map((item) => (
            <Card key={item.id} className={`relative group ${!item.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="p-4">
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>

                <div className="h-16 flex items-center justify-center mb-3">
                  {item.logo ? (
                    <img 
                      src={item.logo} 
                      alt={item.name} 
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="hidden w-full h-full bg-muted rounded items-center justify-center">
                    <Image className="w-6 h-6 text-muted-foreground" />
                  </div>
                </div>

                <p className="font-medium text-sm text-center truncate">{item.name}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(item.category)}
                  </Badge>
                  {item.website && (
                    <a href={item.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Chỉnh sửa đối tác' : 'Thêm đối tác mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tên đối tác *</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Vinhomes"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Logo URL *</label>
              <Input
                value={form.logo}
                onChange={(e) => setForm({ ...form, logo: e.target.value })}
                placeholder="https://..."
              />
              {form.logo && (
                <div className="mt-2 p-4 bg-muted rounded-lg flex items-center justify-center">
                  <img src={form.logo} alt="Preview" className="max-h-16 object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Loại</label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Thứ tự</label>
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Website</label>
              <Input
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://vinhomes.vn"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Mô tả</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về đối tác"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Hiển thị trên website</span>
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? 'Đang lưu...' : (editingItem ? 'Cập nhật' : 'Tạo mới')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
