import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { projectsAPI } from '@/lib/api';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Building2,
  MapPin,
  Home,
  DollarSign,
  Plus,
} from 'lucide-react';

const projectImages = [
  'https://images.unsplash.com/photo-1700745296929-064a7a2bef25?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
  'https://images.unsplash.com/photo-1717326996078-cf86b5d979c6?crop=entropy&cs=srgb&fm=jpg&q=85&w=600',
  'https://images.pexels.com/photos/18435276/pexels-photo-18435276.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export default function ProjectsPage() {
  const { hasRole } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      toast.error('Không thể tải danh sách dự án');
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleSearch = (value) => {
    setSearch(value);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="projects-page">
      <Header
        title="Dự án"
        onSearch={handleSearch}
        onAddNew={hasRole(['bod', 'admin']) ? () => {} : null}
        addNewLabel="Thêm Dự án"
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#316585]/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[#316585]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
                <p className="text-sm text-slate-500">Tổng dự án</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Home className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatNumber(projects.reduce((sum, p) => sum + p.available_units, 0))}
                </p>
                <p className="text-sm text-slate-500">Căn hộ còn</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {projects.length > 0 ? formatCurrency(Math.min(...projects.map(p => p.price_from))) : '0'}
                </p>
                <p className="text-sm text-slate-500">Giá từ</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {new Set(projects.map(p => p.province)).size}
                </p>
                <p className="text-sm text-slate-500">Tỉnh thành</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#316585]/30 border-t-[#316585] rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Chưa có dự án nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, index) => (
              <Card
                key={project.id}
                className="bg-white border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow group"
                data-testid={`project-card-${project.id}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.images?.[0] || projectImages[index % projectImages.length]}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className={project.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}>
                      {project.status === 'active' ? 'Đang mở bán' : 'Tạm ngưng'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{project.name}</h3>
                  <div className="flex items-center gap-1 text-slate-500 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}, {project.province}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-slate-500">Giá từ</p>
                      <p className="font-bold text-[#316585]">{formatCurrency(project.price_from)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Còn</p>
                      <p className="font-bold text-slate-900">{project.available_units}/{project.total_units} căn</p>
                    </div>
                  </div>
                  <Button className="w-full bg-[#316585] hover:bg-[#264f68]">
                    Xem chi tiết
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
