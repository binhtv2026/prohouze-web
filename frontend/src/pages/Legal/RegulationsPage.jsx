import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  BookOpen,
  ExternalLink,
  Calendar,
  FileText,
  Download,
} from 'lucide-react';

export default function RegulationsPage() {
  const [loading, setLoading] = useState(true);
  const [regulations, setRegulations] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(false);
    setRegulations([
      { id: '1', name: 'Luật Kinh doanh Bất động sản 2014', number: '66/2014/QH13', category: 'Luật', effective_date: '2015-07-01', status: 'active' },
      { id: '2', name: 'Luật Đất đai 2024', number: '31/2024/QH15', category: 'Luật', effective_date: '2025-01-01', status: 'active' },
      { id: '3', name: 'Luật Nhà ở 2023', number: '27/2023/QH15', category: 'Luật', effective_date: '2024-01-01', status: 'active' },
      { id: '4', name: 'Nghị định về bảo vệ dữ liệu cá nhân', number: '13/2023/NĐ-CP', category: 'Nghị định', effective_date: '2023-07-01', status: 'active' },
      { id: '5', name: 'Thông tư hướng dẫn về thuế BĐS', number: '80/2021/TT-BTC', category: 'Thông tư', effective_date: '2021-10-01', status: 'active' },
      { id: '6', name: 'Quyết định về giá đất TP.HCM 2025', number: '98/2024/QĐ-UBND', category: 'Quyết định', effective_date: '2025-01-01', status: 'active' },
    ]);
  }, []);

  const filteredRegulations = regulations.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6" data-testid="regulations-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Văn bản pháp luật</h1>
        <p className="text-slate-500 text-sm mt-1">Tra cứu các văn bản pháp luật liên quan đến BĐS</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { name: 'Luật', count: 3, color: 'bg-blue-50 text-blue-600' },
          { name: 'Nghị định', count: 1, color: 'bg-green-50 text-green-600' },
          { name: 'Thông tư', count: 1, color: 'bg-purple-50 text-purple-600' },
          { name: 'Quyết định', count: 1, color: 'bg-amber-50 text-amber-600' },
        ].map((cat, i) => (
          <Card key={i} className={cat.color.split(' ')[0]}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <BookOpen className={`h-5 w-5 ${cat.color.split(' ')[1]}`} />
                <div>
                  <p className={`text-xs ${cat.color.split(' ')[1]}`}>{cat.name}</p>
                  <p className={`text-xl font-bold ${cat.color.split(' ')[1]}`}>{cat.count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Tìm kiếm văn bản..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Regulations List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filteredRegulations.map((reg) => (
              <div key={reg.id} className="p-4 hover:bg-slate-50 transition-colors" data-testid={`regulation-${reg.id}`}>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{reg.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span>Số: {reg.number}</span>
                      <Badge variant="outline">{reg.category}</Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Có hiệu lực: {new Date(reg.effective_date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Xem
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
