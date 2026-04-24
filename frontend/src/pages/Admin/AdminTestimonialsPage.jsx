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
  Plus, Pencil, Trash2, Star, Quote, RefreshCw, GripVertical, User
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_TESTIMONIALS = [
  {
    id: 'testimonial-1',
    name: 'Lê Anh Tuấn',
    role: 'Khách hàng mua căn hộ',
    avatar: '',
    content: 'Đội ngũ tư vấn phản hồi nhanh, hồ sơ rõ ràng và hỗ trợ tới lúc ký hợp đồng.',
    rating: 5,
    project: 'The Global City',
    is_active: true,
    order: 1,
  },
  {
    id: 'testimonial-2',
    name: 'Nguyễn Minh Hà',
    role: 'Nhà đầu tư',
    avatar: '',
    content: 'Chính sách bán hàng và tiến độ pháp lý được cập nhật đều, rất yên tâm khi xuống tiền.',
    rating: 5,
    project: 'Masteri Centre Point',
    is_active: true,
    order: 2,
  },
  {
    id: 'testimonial-3',
    name: 'Trần Quỳnh Mai',
    role: 'Khách hàng mua ở thực',
    avatar: '',
    content: 'Sale chăm sóc sát sao, hướng dẫn từng bước từ booking đến ký kết.',
    rating: 4,
    project: 'Vinhomes Grand Park',
    is_active: true,
    order: 3,
  },
];

const emptyForm = {
  name: '',
  role: '',
  avatar: '',
  content: '',
  rating: 5,
  project: '',
  is_active: true,
  order: 0,
};

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchTestimonials = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/testimonials`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setTestimonials(Array.isArray(data) && data.length > 0 ? data : DEMO_TESTIMONIALS);
    } catch (err) {
      setTestimonials(DEMO_TESTIMONIALS);
      toast.error('Không thể tải danh sách đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const seedData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/content/seed`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed');
      toast.success('Đã tạo dữ liệu mẫu thành công');
      fetchTestimonials();
    } catch (err) {
      toast.error('Không thể tạo dữ liệu mẫu');
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const openCreateDialog = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, order: testimonials.length + 1 });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setForm(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.role || !form.content) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setSaving(true);
    try {
      const url = editingItem 
        ? `${API_URL}/api/admin/content/testimonials/${editingItem.id}`
        : `${API_URL}/api/admin/content/testimonials`;
      
      const res = await fetch(url, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Failed to save');
      
      toast.success(editingItem ? 'Đã cập nhật' : 'Đã tạo mới');
      setIsDialogOpen(false);
      fetchTestimonials();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đánh giá này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/admin/content/testimonials/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Đã xóa');
      fetchTestimonials();
    } catch (err) {
      toast.error('Không thể xóa');
    }
  };

  return (
    <div className="p-6 space-y-6" data-testid="admin-testimonials-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý Đánh giá</h1>
          <p className="text-muted-foreground">Quản lý testimonials hiển thị trên trang chủ</p>
        </div>
        <div className="flex gap-2">
          {testimonials.length === 0 && (
            <Button variant="outline" onClick={seedData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Tạo dữ liệu mẫu
            </Button>
          )}
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm đánh giá
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Quote className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.length}</p>
                <p className="text-sm text-muted-foreground">Tổng đánh giá</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{testimonials.filter(t => t.is_active).length}</p>
                <p className="text-sm text-muted-foreground">Đang hiển thị</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {testimonials.length > 0 
                    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length).toFixed(1)
                    : '0'
                  }
                </p>
                <p className="text-sm text-muted-foreground">Rating TB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-3 text-center py-8">Đang tải...</p>
        ) : testimonials.length === 0 ? (
          <p className="col-span-3 text-center py-8 text-muted-foreground">Chưa có đánh giá nào</p>
        ) : (
          testimonials.map((item) => (
            <Card key={item.id} className={`relative ${!item.is_active ? 'opacity-50' : ''}`}>
              <CardContent className="pt-4">
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  {item.avatar ? (
                    <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.role}</p>
                  </div>
                </div>

                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-4 h-4 ${i < item.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-3 mb-2">"{item.content}"</p>
                
                {item.project && (
                  <Badge variant="secondary">{item.project}</Badge>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Thứ tự: {item.order}
                  </span>
                  <Badge variant={item.is_active ? 'default' : 'secondary'}>
                    {item.is_active ? 'Hiển thị' : 'Ẩn'}
                  </Badge>
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
            <DialogTitle>{editingItem ? 'Chỉnh sửa đánh giá' : 'Thêm đánh giá mới'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tên *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Vai trò *</label>
                <Input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  placeholder="Khách hàng mua căn hộ"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Avatar URL</label>
              <Input
                value={form.avatar}
                onChange={(e) => setForm({ ...form, avatar: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">Nội dung đánh giá *</label>
              <textarea
                className="w-full min-h-[100px] p-2 border rounded-md resize-y"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Nội dung đánh giá của khách hàng..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Rating</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Dự án</label>
                <Input
                  value={form.project}
                  onChange={(e) => setForm({ ...form, project: e.target.value })}
                  placeholder="Vinhomes..."
                />
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
