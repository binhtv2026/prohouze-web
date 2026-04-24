/**
 * Channels Page V2 - Prompt 13/20
 * Omnichannel Hub using Marketing V2 API
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  getChannels,
  getChannelTypes,
  createChannel,
  toggleChannel,
  syncChannel,
  CHANNEL_COLORS,
  STATUS_COLORS,
} from "@/api/marketingV2Api";
import { 
  Facebook, 
  Youtube, 
  Linkedin, 
  Globe, 
  MessageCircle,
  Plus,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Users,
  TrendingUp,
  Eye,
  Clock,
  Zap,
  Copy,
  Mail,
  Phone,
  Search,
  Loader2,
} from "lucide-react";

// Custom TikTok icon
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// Custom Zalo icon
const ZaloIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.52 4.58-1.78 5.09-1.79.11 0 .36.03.52.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
  </svg>
);

const ICON_MAP = {
  facebook: Facebook,
  facebook_ads: Facebook,
  tiktok: TikTokIcon,
  tiktok_ads: TikTokIcon,
  youtube: Youtube,
  linkedin: Linkedin,
  zalo: ZaloIcon,
  zalo_ads: ZaloIcon,
  website: Globe,
  landing_page: Globe,
  email: Mail,
  sms: MessageCircle,
  hotline: Phone,
  google_ads: Search,
};

const DEMO_CHANNEL_TYPES = [
  { value: "facebook", label: "Facebook" },
  { value: "zalo", label: "Zalo" },
  { value: "tiktok", label: "TikTok" },
  { value: "website", label: "Website" },
  { value: "email", label: "Email" },
];

const DEMO_CHANNELS = [
  {
    id: "channel-001",
    code: "FB-SALE-01",
    name: "Facebook Sale Team 1",
    channel_type: "facebook",
    channel_type_label: "Facebook",
    status: "connected",
    is_active: true,
    webhook_url: "/api/marketing/v2/webhooks/facebook",
    stats: { leads_total: 42, cost_total: 18500000, conversions: 6 },
  },
  {
    id: "channel-002",
    code: "ZALO-PROJECT-01",
    name: "Zalo OA Dự án The Emerald",
    channel_type: "zalo",
    channel_type_label: "Zalo",
    status: "pending",
    is_active: true,
    webhook_url: "/api/marketing/v2/webhooks/zalo",
    stats: { leads_total: 18, cost_total: 6200000, conversions: 2 },
  },
  {
    id: "channel-003",
    code: "TIKTOK-TEAM-01",
    name: "TikTok Sale Cá nhân",
    channel_type: "tiktok",
    channel_type_label: "TikTok",
    status: "connected",
    is_active: true,
    webhook_url: "/api/marketing/v2/webhooks/tiktok",
    stats: { leads_total: 27, cost_total: 7300000, conversions: 4 },
  },
];

export default function ChannelsPageV2() {
  const [channels, setChannels] = useState([]);
  const [channelTypes, setChannelTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedChannelType, setSelectedChannelType] = useState("facebook");
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credentials: {},
  });
  const [stats, setStats] = useState({
    total_channels: 0,
    active_channels: 0,
    total_leads: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [channelsRes, typesRes] = await Promise.all([
        getChannels(),
        getChannelTypes(),
      ]);
      const channelItems = Array.isArray(channelsRes?.data) && channelsRes.data.length > 0
        ? channelsRes.data
        : DEMO_CHANNELS;
      const typeItems = Array.isArray(typesRes?.data?.channel_types) && typesRes.data.channel_types.length > 0
        ? typesRes.data.channel_types
        : DEMO_CHANNEL_TYPES;

      setChannels(channelItems);
      setChannelTypes(typeItems);
      
      // Calculate stats
      const activeCount = channelItems.filter((c) => c.status === "connected").length;
      setStats({
        total_channels: channelItems.length,
        active_channels: activeCount,
        total_leads: channelItems.reduce((sum, c) => sum + (c.stats?.leads_total || 0), 0),
      });
    } catch (error) {
      console.error("Error fetching channels:", error);
      setChannels(DEMO_CHANNELS);
      setChannelTypes(DEMO_CHANNEL_TYPES);
      setStats({
        total_channels: DEMO_CHANNELS.length,
        active_channels: DEMO_CHANNELS.filter((c) => c.status === "connected").length,
        total_leads: DEMO_CHANNELS.reduce((sum, c) => sum + (c.stats?.leads_total || 0), 0),
      });
      toast.error("Không thể tải dữ liệu kênh, đang hiển thị dữ liệu mẫu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddChannel = async () => {
    try {
      const selectedType = channelTypes.find(t => t.value === selectedChannelType);
      await createChannel({
        code: formData.code || `${selectedChannelType.toUpperCase()}-${Date.now()}`,
        name: formData.name || selectedType?.label || selectedChannelType,
        channel_type: selectedChannelType,
        credentials: formData.credentials,
        is_active: true,
      });
      toast.success("Đã thêm kênh mới!");
      setIsAddDialogOpen(false);
      setFormData({ code: "", name: "", credentials: {} });
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleChannel = async (channelId) => {
    try {
      await toggleChannel(channelId);
      toast.success("Đã cập nhật trạng thái kênh!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi cập nhật kênh");
    }
  };

  const handleSyncChannel = async (channelId) => {
    toast.info("Đang đồng bộ...");
    try {
      await syncChannel(channelId);
      toast.success("Đồng bộ thành công!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi đồng bộ");
    }
  };

  const copyWebhookUrl = (url) => {
    const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Đã copy Webhook URL!");
  };

  const getChannelIcon = (channelType) => {
    return ICON_MAP[channelType] || Globe;
  };

  const getChannelColor = (channelType) => {
    return CHANNEL_COLORS[channelType] || "bg-gray-600";
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      connected: "bg-green-100 text-green-700",
      disconnected: "bg-gray-100 text-gray-600",
      error: "bg-red-100 text-red-700",
    };
    const labels = {
      pending: "Chờ kết nối",
      connected: "Đã kết nối",
      disconnected: "Đã ngắt",
      error: "Lỗi",
    };
    return (
      <Badge className={colors[status] || "bg-gray-100"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6" data-testid="channels-page-v2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Omnichannel Hub</h1>
          <p className="text-gray-500">Quản lý kênh marketing - API v2</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-channel-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm kênh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng kênh</p>
                <p className="text-2xl font-bold">{stats.total_channels}</p>
              </div>
              <Globe className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang kết nối</p>
                <p className="text-2xl font-bold text-green-600">{stats.active_channels}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng Lead</p>
                <p className="text-2xl font-bold">{stats.total_leads}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Grid */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả ({channels.length})</TabsTrigger>
          <TabsTrigger value="connected">Đang kết nối ({channels.filter(c => c.status === "connected").length})</TabsTrigger>
          <TabsTrigger value="pending">Chưa kết nối ({channels.filter(c => c.status !== "connected").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : channels.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có kênh nào</p>
                <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm kênh đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {channels.map((channel) => {
                const Icon = getChannelIcon(channel.channel_type);
                const bgColor = getChannelColor(channel.channel_type);
                
                return (
                  <Card key={channel.id} className="overflow-hidden" data-testid={`channel-card-${channel.id}`}>
                    <CardHeader className={`${bgColor} text-white py-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="h-6 w-6" />
                          <div>
                            <CardTitle className="text-lg">{channel.name}</CardTitle>
                            <CardDescription className="text-white/80 text-sm">
                              {channel.channel_type_label || channel.channel_type}
                            </CardDescription>
                          </div>
                        </div>
                        <Switch
                          checked={channel.is_active}
                          onCheckedChange={() => handleToggleChannel(channel.id)}
                          className="data-[state=checked]:bg-white"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Trạng thái</span>
                        {getStatusBadge(channel.status)}
                      </div>

                      {/* Stats */}
                      {channel.stats && Object.keys(channel.stats).length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-center">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-semibold">{channel.stats.followers?.toLocaleString() || 0}</p>
                            <p className="text-xs text-gray-500">Followers</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <p className="text-lg font-semibold">{channel.stats.leads_this_month || 0}</p>
                            <p className="text-xs text-gray-500">Lead/tháng</p>
                          </div>
                        </div>
                      )}

                      {/* Last sync */}
                      {channel.last_sync_at && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>Sync: {new Date(channel.last_sync_at).toLocaleString("vi-VN")}</span>
                        </div>
                      )}

                      {/* Webhook */}
                      {channel.webhook_url && (
                        <div className="flex items-center gap-2">
                          <Input
                            value={channel.webhook_url}
                            readOnly
                            className="text-xs bg-gray-50 h-8"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyWebhookUrl(channel.webhook_url)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Settings className="h-4 w-4 mr-1" />
                          Cấu hình
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSyncChannel(channel.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="connected">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.filter(c => c.status === "connected").map((channel) => {
              const Icon = getChannelIcon(channel.channel_type);
              return (
                <Card key={channel.id}>
                  <CardHeader className={`${getChannelColor(channel.channel_type)} text-white py-3`}>
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <CardTitle className="text-base">{channel.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-semibold">{channel.stats?.leads_this_month || 0}</p>
                        <p className="text-xs text-gray-500">Lead/tháng</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="font-semibold">{channel.stats?.leads_total || 0}</p>
                        <p className="text-xs text-gray-500">Tổng Lead</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.filter(c => c.status !== "connected").map((channel) => {
              const Icon = getChannelIcon(channel.channel_type);
              return (
                <Card key={channel.id}>
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 ${getChannelColor(channel.channel_type)} rounded-lg flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{channel.name}</h3>
                        <p className="text-sm text-gray-500">{channel.status_label}</p>
                      </div>
                      <Button size="sm">Kết nối</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Channel Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm kênh mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Loại kênh</Label>
              <Select value={selectedChannelType} onValueChange={setSelectedChannelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channelTypes.map((type) => {
                    const Icon = getChannelIcon(type.value);
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {type.label_vi || type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Mã kênh</Label>
              <Input
                placeholder="VD: FB-MAIN, ZALO-OA1"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>

            <div>
              <Label>Tên hiển thị</Label>
              <Input
                placeholder="VD: ProHouze Vietnam"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                Sau khi thêm, bạn cần cấu hình credentials để kết nối kênh.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddChannel} data-testid="confirm-add-channel-btn">
              Thêm kênh
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
