/**
 * Attribution Page - Prompt 13/20
 * Lead đến từ đâu? Campaign nào? Content nào?
 * Marketing V2 API
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { toast } from "sonner";
import {
  getAttributions,
  getAttributionReport,
} from "@/api/marketingV2Api";
import {
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Loader2,
  MapPin,
  Megaphone,
  FileText,
  ArrowRight,
  Lock,
  ExternalLink,
  Filter,
  Eye,
} from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"];

const DEMO_ATTRIBUTION_REPORT = {
  total_leads: 186,
  total_conversions: 14,
  total_revenue: 965000000,
  by_source: [
    { source_name: "Facebook Ads", leads: 48, conversions: 4, revenue: 286000000 },
    { source_name: "TikTok", leads: 39, conversions: 3, revenue: 214000000 },
    { source_name: "Landing page", leads: 26, conversions: 2, revenue: 162000000 },
  ],
  by_campaign: [
    { campaign_name: "Push opening The Privé", leads: 42, conversions: 4, revenue: 286000000 },
    { campaign_name: "TikTok hàng ngon", leads: 27, conversions: 3, revenue: 214000000 },
  ],
  by_channel: [
    { channel_name: "Facebook", leads: 48, conversions: 4, revenue: 286000000 },
    { channel_name: "TikTok", leads: 39, conversions: 3, revenue: 214000000 },
    { channel_name: "Website", leads: 31, conversions: 3, revenue: 211000000 },
  ],
};

const DEMO_ATTRIBUTIONS = [
  { id: "attr-1", lead_name: "Nguyễn Minh Tâm", source_name: "Facebook Ads", campaign_name: "Push opening The Privé", channel_name: "Facebook", revenue: 286000000, created_at: "2026-03-25T09:10:00Z" },
  { id: "attr-2", lead_name: "Lê Mỹ An", source_name: "TikTok", campaign_name: "TikTok hàng ngon", channel_name: "TikTok", revenue: 214000000, created_at: "2026-03-25T10:40:00Z" },
];

export default function AttributionPage() {
  const [report, setReport] = useState(null);
  const [attributions, setAttributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [selectedTab, setSelectedTab] = useState("overview");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, attributionsRes] = await Promise.all([
        getAttributionReport({ period }),
        getAttributions({ limit: 50 }),
      ]);

      setReport(reportRes.data && Object.keys(reportRes.data).length > 0 ? reportRes.data : DEMO_ATTRIBUTION_REPORT);
      setAttributions(attributionsRes.data?.length > 0 ? attributionsRes.data : DEMO_ATTRIBUTIONS);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.warning("Đang hiển thị dữ liệu mẫu cho attribution");
      setReport(DEMO_ATTRIBUTION_REPORT);
      setAttributions(DEMO_ATTRIBUTIONS);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Prepare chart data
  const sourceChartData = report?.by_source?.map((s, i) => ({
    name: s.source_name || "Unknown",
    leads: s.leads,
    conversions: s.conversions,
    revenue: s.revenue,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const campaignChartData = report?.by_campaign?.map((c, i) => ({
    name: c.campaign_name || "Unknown",
    leads: c.leads,
    conversions: c.conversions,
    revenue: c.revenue,
    fill: COLORS[i % COLORS.length],
  })) || [];

  const channelChartData = report?.by_channel?.map((ch, i) => ({
    name: ch.channel_name || "Unknown",
    leads: ch.leads,
    conversions: ch.conversions,
    revenue: ch.revenue,
    fill: COLORS[i % COLORS.length],
  })) || [];

  // Lead flow summary
  const totalConversionRate = report?.total_leads > 0
    ? ((report?.total_conversions / report?.total_leads) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6" data-testid="attribution-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attribution & Lead Source</h1>
          <p className="text-gray-500">Lead đến từ đâu? Campaign nào hiệu quả?</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 ngày qua</SelectItem>
              <SelectItem value="30d">30 ngày qua</SelectItem>
              <SelectItem value="90d">90 ngày qua</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tổng Lead</p>
                    <p className="text-3xl font-bold text-blue-600">{report?.total_leads || 0}</p>
                  </div>
                  <Users className="h-10 w-10 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Converted</p>
                    <p className="text-3xl font-bold text-green-600">{report?.total_conversions || 0}</p>
                  </div>
                  <Target className="h-10 w-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-3xl font-bold text-purple-600">{totalConversionRate}%</p>
                  </div>
                  <TrendingUp className="h-10 w-10 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Doanh thu</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(report?.total_revenue || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-10 w-10 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="source">Theo Nguồn</TabsTrigger>
              <TabsTrigger value="campaign">Theo Campaign</TabsTrigger>
              <TabsTrigger value="channel">Theo Kênh</TabsTrigger>
              <TabsTrigger value="detail">Chi tiết Lead</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Lead by Source Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-500" />
                      Lead theo Nguồn
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sourceChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={sourceChartData}
                            dataKey="leads"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          >
                            {sourceChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-400">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lead by Campaign Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Megaphone className="h-5 w-5 text-green-500" />
                      Lead theo Campaign
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {campaignChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={campaignChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="leads" fill="#3B82F6" name="Leads" />
                          <Bar dataKey="conversions" fill="#10B981" name="Converted" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-400">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lead Flow Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead Flow</CardTitle>
                  <CardDescription>Content → Form → Lead → CRM</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between py-8">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <p className="font-medium">Content</p>
                      <p className="text-sm text-gray-500">Tạo nội dung</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
                        <FileText className="h-8 w-8 text-purple-600" />
                      </div>
                      <p className="font-medium">Form</p>
                      <p className="text-sm text-gray-500">Thu thập data</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                        <Users className="h-8 w-8 text-green-600" />
                      </div>
                      <p className="font-medium">Lead</p>
                      <p className="text-2xl font-bold text-green-600">{report?.total_leads || 0}</p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-gray-300" />
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-2">
                        <Target className="h-8 w-8 text-orange-600" />
                      </div>
                      <p className="font-medium">Conversion</p>
                      <p className="text-2xl font-bold text-orange-600">{report?.total_conversions || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Source Tab */}
            <TabsContent value="source">
              <Card>
                <CardHeader>
                  <CardTitle>Lead theo Nguồn</CardTitle>
                </CardHeader>
                <CardContent>
                  {report?.by_source?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nguồn</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">Conversions</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.by_source.map((source, index) => (
                          <TableRow key={source.source_id || index}>
                            <TableCell className="font-medium">
                              {source.source_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">{source.leads}</TableCell>
                            <TableCell className="text-right">{source.conversions}</TableCell>
                            <TableCell className="text-right">
                              {source.leads > 0
                                ? ((source.conversions / source.leads) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(source.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Chưa có dữ liệu</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Campaign Tab */}
            <TabsContent value="campaign">
              <Card>
                <CardHeader>
                  <CardTitle>Lead theo Campaign</CardTitle>
                </CardHeader>
                <CardContent>
                  {report?.by_campaign?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Campaign</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">Conversions</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.by_campaign.map((campaign, index) => (
                          <TableRow key={campaign.campaign_id || index}>
                            <TableCell className="font-medium">
                              {campaign.campaign_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">{campaign.leads}</TableCell>
                            <TableCell className="text-right">{campaign.conversions}</TableCell>
                            <TableCell className="text-right">
                              {campaign.leads > 0
                                ? ((campaign.conversions / campaign.leads) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(campaign.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Chưa có dữ liệu</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Channel Tab */}
            <TabsContent value="channel">
              <Card>
                <CardHeader>
                  <CardTitle>Lead theo Kênh</CardTitle>
                </CardHeader>
                <CardContent>
                  {report?.by_channel?.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kênh</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                          <TableHead className="text-right">Conversions</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Doanh thu</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.by_channel.map((channel, index) => (
                          <TableRow key={channel.channel_id || index}>
                            <TableCell className="font-medium">
                              {channel.channel_name || "Unknown"}
                            </TableCell>
                            <TableCell className="text-right">{channel.leads}</TableCell>
                            <TableCell className="text-right">{channel.conversions}</TableCell>
                            <TableCell className="text-right">
                              {channel.leads > 0
                                ? ((channel.conversions / channel.leads) * 100).toFixed(1)
                                : 0}%
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(channel.revenue)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-400">Chưa có dữ liệu</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Detail Tab */}
            <TabsContent value="detail">
              <Card>
                <CardHeader>
                  <CardTitle>Chi tiết Attribution</CardTitle>
                  <CardDescription>Dữ liệu attribution của từng lead (locked = không thay đổi)</CardDescription>
                </CardHeader>
                <CardContent>
                  {attributions.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contact</TableHead>
                          <TableHead>First Touch</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Conversion</TableHead>
                          <TableHead>Value</TableHead>
                          <TableHead>Lock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {attributions.map((attr) => (
                          <TableRow key={attr.id}>
                            <TableCell className="font-medium">
                              {attr.contact_name || attr.contact_id?.slice(0, 8) || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{attr.first_touch?.source_name || "-"}</p>
                                <p className="text-gray-400 text-xs">{attr.first_touch?.channel_name || ""}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {attr.first_touch?.campaign_name || "-"}
                            </TableCell>
                            <TableCell>
                              {attr.conversion_event ? (
                                <Badge className="bg-green-100 text-green-700">
                                  {attr.conversion_event}
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {attr.conversion_value > 0 ? formatCurrency(attr.conversion_value) : "-"}
                            </TableCell>
                            <TableCell>
                              {attr.is_locked ? (
                                <Lock className="h-4 w-4 text-green-500" />
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      Chưa có dữ liệu attribution
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
