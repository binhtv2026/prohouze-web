import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Briefcase,
  Building2,
  CheckCircle2,
  Database,
  FileCheck,
  Gauge,
  Globe,
  Network,
  ShieldCheck,
  Target,
  Users,
  Wallet,
} from 'lucide-react';

const lockedDecisions = [
  'Kiến trúc 3 lớp: Website public, Backoffice quản trị, App giai đoạn 2.',
  'PostgreSQL là nguồn dữ liệu chuẩn cho phần build tiếp theo.',
  'Phase 1 ưu tiên vận hành thật trước app native.',
  'Mọi dữ liệu trọng yếu phải có RBAC, audit log, approval state và timeline.',
];

const phase1Modules = [
  {
    title: 'Executive Dashboard',
    icon: Gauge,
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    outcome: 'Lãnh đạo nhìn sức khỏe doanh nghiệp trong 5 phút.',
    deliverables: ['Metric dictionary', 'Alerts panel', 'Revenue / funnel / cash snapshot'],
    progress: 65,
  },
  {
    title: 'CRM & Customer 360',
    icon: Users,
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    outcome: 'Lead và khách hàng đi vào một nơi duy nhất, không thất lạc.',
    deliverables: ['Dedup rules', 'Timeline 360', 'Demand profile', 'Assignment'],
    progress: 70,
  },
  {
    title: 'Product / Project / Inventory',
    icon: Building2,
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    outcome: 'Giỏ hàng phản ánh đúng tình trạng bán hàng thực tế.',
    deliverables: ['Project hierarchy', 'Inventory state machine', 'Price history'],
    progress: 58,
  },
  {
    title: 'Sales & Booking',
    icon: Briefcase,
    color: 'bg-violet-50 text-violet-700 border-violet-200',
    outcome: 'Chuỗi lead -> deal -> booking chạy xuyên suốt và đo được.',
    deliverables: ['Deal stage model', 'Booking rules', 'Allocation logic'],
    progress: 62,
  },
  {
    title: 'Finance & Commission',
    icon: Wallet,
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    outcome: 'Kiểm soát thực thu, payout và hoa hồng theo rule.',
    deliverables: ['Commission policy model', 'Payout approval', 'Forecast view'],
    progress: 57,
  },
  {
    title: 'Website Public Foundation',
    icon: Globe,
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    outcome: 'Website tạo lead, tăng trust và hỗ trợ SEO tăng trưởng.',
    deliverables: ['Project templates', 'Lead forms', 'SEO metadata', 'Tracking'],
    progress: 68,
  },
];

const workstreams = [
  {
    title: 'Data Foundation',
    icon: Database,
    items: ['Master data', 'Canonical entities', 'Status model', 'Approval model', 'Migration strategy'],
  },
  {
    title: 'Governance & Control',
    icon: ShieldCheck,
    items: ['RBAC', 'Audit log', 'Ownership model', 'Approval matrix', 'Metric owners'],
  },
  {
    title: 'Business Workflows',
    icon: Network,
    items: ['Lead -> Deal -> Booking', 'Inventory updates', 'Receivables / payouts', 'Website -> CRM'],
  },
  {
    title: 'Reporting & BI',
    icon: BarChart3,
    items: ['Executive dashboard', 'Funnel reports', 'Project financial view', 'Ops alerts'],
  },
];

const kpis = [
  'Giam 25-40% thao tac van hanh lap lai.',
  'Giam 50-70% thoi gian tong hop bao cao dieu hanh.',
  '100% lead moi vao mot pipeline chuan.',
  '100% booking gan voi san pham cu the va co truy vet.',
  'Website public dua lead ve CRM voi tracking ro nguon.',
];

const acceptance = [
  'Du lieu chuan truoc, UI dep sau.',
  'Khong nghiem thu chi dua tren giao dien.',
  'Module chi hoan thanh khi du business outcome, workflow, data/control va reporting.',
  'Moi chi so lanh dao xem phai co dinh nghia va owner ro rang.',
];

export default function TransformationBlueprintPage() {
  return (
    <div className="min-h-screen bg-slate-50" data-testid="transformation-blueprint-page">
      <Header
        title="Transformation Blueprint"
        subtitle="Ban khoa pham vi, thu tu trien khai va tieu chi nghiem thu phase 1 cho ProHouze"
      />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Card className="border-slate-200 bg-gradient-to-r from-[#0d1f35] via-[#16314f] to-[#316585] text-white">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge className="w-fit bg-white/15 text-white hover:bg-white/15">Blueprint 10/10</Badge>
              <div>
                <h2 className="text-3xl font-bold">He dieu hanh so toan dien cho doanh nghiep moi gioi bat dong san so cap</h2>
                <p className="mt-2 text-sm text-white/80">
                  Giai doan nay tap trung khoa phan loi van hanh that: Sales, Product, CRM, Finance, HR,
                  Legal, Marketing, SEO va Website public. App mobile trien khai sau khi du lieu va quy trinh da on dinh.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:min-w-[360px]">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Phase 1</p>
                <p className="mt-2 text-2xl font-bold">6 module loi</p>
                <p className="text-sm text-white/75">Phai dat chuan van hanh truoc khi mo rong.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">Architecture</p>
                <p className="mt-2 text-2xl font-bold">3 lop</p>
                <p className="text-sm text-white/75">Public website, backoffice, app giai doan 2.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Quyet Dinh Da Khoa</CardTitle>
              <CardDescription>Nhung nguyen tac khong doi de tranh build lech huong.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {lockedDecisions.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Dich Giai Doan 1</CardTitle>
              <CardDescription>Nhung ket qua nhin thay duoc phai xuat hien sau phase 1.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {kpis.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>6 Module Uu Tien Phase 1</CardTitle>
                <CardDescription>Pham vi phai dat chuan truoc khi mo rong app, portal hay BI sau.</CardDescription>
              </div>
              <Badge variant="outline" className="w-fit border-[#316585]/30 bg-[#316585]/5 text-[#316585]">
                Priority Order Locked
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {phase1Modules.map((module) => (
              <Card key={module.title} className="border border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${module.color}`}>
                      <module.icon className="h-5 w-5" />
                    </div>
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      {module.progress}%
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{module.outcome}</p>
                  </div>

                  <Progress value={module.progress} className="h-2 bg-slate-100" />

                  <div className="space-y-2">
                    {module.deliverables.map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm text-slate-700">
                        <ArrowRight className="mt-1 h-4 w-4 text-[#316585]" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>4 Luong Cong Viec Phai Chay Song Song</CardTitle>
              <CardDescription>Build phase 1 khong the chi chay theo tung page rieng le.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {workstreams.map((stream) => (
                <div key={stream.title} className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <stream.icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900">{stream.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {stream.items.map((item) => (
                      <Badge key={item} variant="secondary" className="bg-slate-100 text-slate-700">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white">
            <CardHeader>
              <CardTitle>Acceptance Rules</CardTitle>
              <CardDescription>Tieu chi nghiem thu bat buoc de dat chuan 10/10.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {acceptance.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <FileCheck className="mt-0.5 h-5 w-5 text-[#316585]" />
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}

              <div className="rounded-2xl border border-dashed border-[#316585]/35 bg-[#316585]/5 p-5">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-[#316585]" />
                  <h3 className="font-semibold text-slate-900">Buoc trien khai tiep theo</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Khoa Data Foundation Spec de chuan hoa entity, status, approval, audit va mapping du lieu PostgreSQL.
                  Day la buoc quan trong nhat de chuyen tu blueprint sang build on dinh.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="bg-[#316585] hover:bg-[#274f67]">
                    <Link to="/settings/master-data">Di toi Master Data</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/settings/entity-schemas">Di toi Entity Schemas</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Thu Tu Uu Tien Tong The</CardTitle>
            <CardDescription>Chuoi uu tien trien khai da duoc khoa voi founder.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {['Sales', 'Product', 'CRM', 'Finance', 'HR', 'Legal', 'Marketing', 'SEO', 'App'].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#316585] text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-slate-800">{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Blocks className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Scope Control</h3>
              <p className="text-sm leading-6 text-slate-600">
                Khong mo them module moi neu 6 module loi phase 1 chua dat chuan van hanh that.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <Gauge className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Execution Rhythm</h3>
              <p className="text-sm leading-6 text-slate-600">
                Moi module di qua 5 buoc: data model, API/logic, workflow end-to-end, UI, reporting/auditability.
              </p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white">
            <CardContent className="space-y-3 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                <FileCheck className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Operating Rule</h3>
              <p className="text-sm leading-6 text-slate-600">
                Moi phan build moi deu phai tra loi duoc: giai quyet outcome gi, nam o workflow nao va da du kiem soat chua.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
