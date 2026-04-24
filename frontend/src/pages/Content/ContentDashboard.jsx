/**
 * ContentDashboard — Nhân viên Content / CMS Web Dashboard
 * ProHouze Enterprise — 10/10 Locked
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText, PenTool, Globe, BarChart3, Calendar, Image,
  ArrowUpRight, CheckCircle2, Clock, AlertTriangle, Plus,
  Layers, Rss, Video, Users,
} from 'lucide-react';

const STATS = [
  { label: 'Bài viết đã đăng', value: 47, icon: FileText,    color: 'bg-violet-50 border-violet-100 text-violet-700' },
  { label: 'Chờ duyệt',        value: 6,  icon: Clock,        color: 'bg-amber-50 border-amber-100 text-amber-700' },
  { label: 'Landing page live', value: 8, icon: Globe,        color: 'bg-emerald-50 border-emerald-100 text-emerald-700' },
  { label: 'Traffic tháng',    value: '12.4k', icon: BarChart3, color: 'bg-blue-50 border-blue-100 text-blue-700' },
];

const RECENT_ARTICLES = [
  { id: 1, title: 'The Privé Residence — Khu đô thị xanh tại TP.HCM', status: 'published', date: '23/04/2026', views: 1240 },
  { id: 2, title: 'Hướng dẫn mua nhà lần đầu 2026 — Những điều cần biết', status: 'pending', date: '24/04/2026', views: 0 },
  { id: 3, title: 'Lumière Boulevard mở bán giai đoạn 2', status: 'draft', date: '24/04/2026', views: 0 },
  { id: 4, title: 'So sánh các dự án Q2 vs Q7 — Đâu là lựa chọn tốt?', status: 'published', date: '22/04/2026', views: 860 },
];

const statusCfg = {
  published: { label: 'Đã đăng',  cls: 'bg-emerald-100 text-emerald-700' },
  pending:   { label: 'Chờ duyệt', cls: 'bg-amber-100 text-amber-700' },
  draft:     { label: 'Nháp',     cls: 'bg-slate-100 text-slate-600' },
};

const QUICK_LINKS = [
  { icon: Plus,      label: 'Viết bài mới',     path: '/cms/articles?action=new', color: 'bg-violet-50 border-violet-200 text-violet-700' },
  { icon: FileText,  label: 'Bài viết',          path: '/cms/articles',            color: 'bg-blue-50 border-blue-200 text-blue-700' },
  { icon: Globe,     label: 'Landing page',      path: '/cms/landing-pages',       color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  { icon: Rss,       label: 'Tin tức / SEO',     path: '/cms/news',                color: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
  { icon: Image,     label: 'Media / Hình ảnh', path: '/cms/media',               color: 'bg-pink-50 border-pink-200 text-pink-700' },
  { icon: Layers,    label: 'Trang web (Pages)', path: '/cms/pages',               color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { icon: Calendar,  label: 'Lịch đăng bài',    path: '/work/calendar',           color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
  { icon: BarChart3, label: 'Analytics nội dung', path: '/analytics/content',     color: 'bg-rose-50 border-rose-200 text-rose-700' },
];

export default function ContentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6 p-6" data-testid="content-dashboard">

      {/* ── PREMIUM HEADER ── */}
      <div className="rounded-2xl bg-gradient-to-r from-[#4c1d95] to-[#7c3aed] p-6 text-white">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                NHÂN VIÊN CONTENT · {user?.full_name || ''}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Content & CMS Hub</h1>
            <p className="mt-1 text-white/60 text-sm">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <Button size="sm" className="bg-white text-[#7c3aed] hover:bg-white/90 self-start"
            onClick={() => navigate('/cms/articles?action=new')}>
            <Plus className="h-4 w-4 mr-2" />Viết bài mới
          </Button>
        </div>

        {/* Tab nav strip */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/20 pt-4">
          {[
            { label: 'Tổng quan',     icon: BarChart3, path: '/content/dashboard' },
            { label: 'Bài viết',      icon: FileText,  path: '/cms/articles' },
            { label: 'Trang web',     icon: Layers,    path: '/cms/pages' },
            { label: 'Landing pages', icon: Globe,     path: '/cms/landing-pages' },
            { label: 'Tin tức',       icon: Rss,       path: '/cms/news' },
            { label: 'Media',         icon: Image,     path: '/cms/media' },
            { label: 'Lịch đăng',    icon: Calendar,  path: '/work/calendar' },
            { label: 'Analytics',     icon: BarChart3, path: '/analytics/content' },
            { label: 'Marketing',     icon: Users,     path: '/marketing/content' },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.path + t.label} onClick={() => navigate(t.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/15 hover:bg-white/30 text-white transition-colors">
                <Icon className="h-3 w-3" />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.color}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{s.label}</p>
                    <p className="text-3xl font-bold mt-1">{s.value}</p>
                  </div>
                  <Icon className="h-8 w-8 opacity-25" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── QUICK LINKS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {QUICK_LINKS.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.path + item.label} onClick={() => navigate(item.path)}
              className={`rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${item.color}`}>
              <Icon className="h-5 w-5 mb-2" />
              <p className="text-sm font-semibold">{item.label}</p>
            </button>
          );
        })}
      </div>

      {/* ── RECENT ARTICLES ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-violet-600" />Bài viết gần đây
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/cms/articles')}>Xem tất cả →</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {RECENT_ARTICLES.map(article => {
            const st = statusCfg[article.status];
            return (
              <button key={article.id} onClick={() => navigate('/cms/articles')}
                className="w-full text-left rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between hover:shadow-sm transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={st.cls}>{st.label}</Badge>
                    <span className="text-xs text-slate-400">{article.date}</span>
                    {article.views > 0 && <span className="text-xs text-slate-400">{article.views.toLocaleString()} lượt xem</span>}
                  </div>
                  <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-violet-600 shrink-0 ml-3 transition-colors" />
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
