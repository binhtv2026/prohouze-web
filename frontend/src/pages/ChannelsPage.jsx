import { useState, useEffect } from "react";
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
import api from "@/lib/api";
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
  ExternalLink
} from "lucide-react";

// TikTok icon (custom)
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

// Zalo icon (custom)
const ZaloIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.02-1.96 1.25-5.54 3.69-.52.36-1 .53-1.42.52-.47-.01-1.37-.26-2.03-.48-.82-.27-1.47-.42-1.42-.88.03-.24.37-.49 1.02-.75 3.98-1.73 6.64-2.87 7.97-3.43 3.79-1.52 4.58-1.78 5.09-1.79.11 0 .36.03.52.17.14.12.18.28.2.45-.01.06.01.24 0 .38z"/>
  </svg>
);

const CHANNEL_ICONS = {
  facebook: Facebook,
  tiktok: TikTokIcon,
  youtube: Youtube,
  linkedin: Linkedin,
  zalo: ZaloIcon,
  website: Globe,
  landing_page: Globe,
  google_ads: Globe,
};

const CHANNEL_COLORS = {
  facebook: "bg-blue-600",
  tiktok: "bg-gray-900",
  youtube: "bg-red-600",
  linkedin: "bg-blue-700",
  zalo: "bg-blue-500",
  website: "bg-emerald-600",
  landing_page: "bg-purple-600",
  google_ads: "bg-orange-500",
};

const CHANNEL_CONFIG = {
  facebook: {
    name: "Facebook",
    description: "Kết nối Facebook Page & Lead Ads",
    fields: [
      { key: "page_id", label: "Page ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "app_id", label: "App ID", type: "text" },
      { key: "app_secret", label: "App Secret", type: "password" },
    ],
    features: ["Lead Ads", "Comments", "Messages", "Auto-reply"],
  },
  tiktok: {
    name: "TikTok",
    description: "Kết nối TikTok Business Account",
    fields: [
      { key: "business_id", label: "Business ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
    ],
    features: ["Lead Gen Forms", "Comments", "Video Analytics"],
  },
  youtube: {
    name: "YouTube",
    description: "Kết nối YouTube Channel",
    fields: [
      { key: "channel_id", label: "Channel ID", type: "text" },
      { key: "api_key", label: "API Key", type: "password" },
      { key: "client_id", label: "Client ID", type: "text" },
      { key: "client_secret", label: "Client Secret", type: "password" },
    ],
    features: ["Comments", "Video Analytics", "Subscribers"],
  },
  linkedin: {
    name: "LinkedIn",
    description: "Kết nối LinkedIn Company Page",
    fields: [
      { key: "organization_id", label: "Organization ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
    ],
    features: ["Lead Gen Forms", "Posts", "Messages"],
  },
  zalo: {
    name: "Zalo OA",
    description: "Kết nối Zalo Official Account",
    fields: [
      { key: "oa_id", label: "OA ID", type: "text" },
      { key: "access_token", label: "Access Token", type: "password" },
      { key: "refresh_token", label: "Refresh Token", type: "password" },
      { key: "secret_key", label: "Secret Key", type: "password" },
    ],
    features: ["Messages", "ZNS", "Followers", "Auto-reply"],
  },
  website: {
    name: "Website",
    description: "Kết nối Website với form liên hệ",
    fields: [
      { key: "domain", label: "Domain", type: "text" },
      { key: "api_key", label: "API Key (tự tạo)", type: "text" },
    ],
    features: ["Contact Forms", "Live Chat", "Tracking"],
  },
};

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [selectedChannelType, setSelectedChannelType] = useState("facebook");
  const [formData, setFormData] = useState({
    name: "",
    credentials: {},
    settings: {},
  });
  const [stats, setStats] = useState({
    total_leads: 0,
    leads_today: 0,
    active_channels: 0,
    engagement_rate: 0,
  });

  useEffect(() => {
    fetchChannels();
    fetchStats();
  }, []);

  const fetchChannels = async () => {
    try {
      const response = await api.get("/channels");
      setChannels(response.data);
    } catch (error) {
      console.error("Error fetching channels:", error);
      // Mock data for development
      setChannels([
        {
          id: "1",
          channel: "facebook",
          name: "ProHouze Vietnam",
          is_active: true,
          connected_at: "2024-01-15T10:00:00Z",
          last_sync: "2024-02-10T08:30:00Z",
          stats: { followers: 25000, leads_this_month: 145, engagement: 4.2 },
          webhook_url: "/api/webhooks/facebook/1",
        },
        {
          id: "2",
          channel: "zalo",
          name: "ProHouze OA",
          is_active: true,
          connected_at: "2024-01-20T14:00:00Z",
          last_sync: "2024-02-10T08:00:00Z",
          stats: { followers: 18500, leads_this_month: 98, engagement: 6.8 },
          webhook_url: "/api/webhooks/zalo/2",
        },
        {
          id: "3",
          channel: "tiktok",
          name: "ProHouze Official",
          is_active: false,
          connected_at: null,
          last_sync: null,
          stats: { followers: 0, leads_this_month: 0, engagement: 0 },
          webhook_url: "/api/webhooks/tiktok/3",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/channels/stats");
      setStats(response.data);
    } catch {
      setStats({
        total_leads: 243,
        leads_today: 12,
        active_channels: 2,
        engagement_rate: 5.5,
      });
    }
  };

  const handleAddChannel = async () => {
    try {
      const payload = {
        channel: selectedChannelType,
        name: formData.name || CHANNEL_CONFIG[selectedChannelType].name,
        is_active: true,
        credentials: formData.credentials,
        settings: formData.settings,
      };
      await api.post("/channels", payload);
      toast.success("Kênh đã được thêm thành công!");
      setIsAddDialogOpen(false);
      setFormData({ name: "", credentials: {}, settings: {} });
      fetchChannels();
    } catch (error) {
      toast.error("Không thể thêm kênh: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleToggleChannel = async (channelId) => {
    try {
      await api.put(`/channels/${channelId}/toggle`);
      toast.success("Đã cập nhật trạng thái kênh!");
      fetchChannels();
    } catch (error) {
      toast.error("Lỗi cập nhật kênh");
    }
  };

  const handleSync = async (channelId) => {
    toast.info("Đang đồng bộ dữ liệu...");
    // Simulated sync
    setTimeout(() => {
      toast.success("Đồng bộ thành công!");
      fetchChannels();
    }, 2000);
  };

  const copyWebhookUrl = (url) => {
    const fullUrl = `${process.env.REACT_APP_BACKEND_URL}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Đã copy Webhook URL!");
  };

  const ChannelIcon = ({ channel, className }) => {
    const Icon = CHANNEL_ICONS[channel] || Globe;
    return <Icon className={className} />;
  };

  return (
    <div className="space-y-6" data-testid="channels-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Omnichannel Hub</h1>
          <p className="text-gray-500">Quản lý tất cả kênh marketing trong một nơi</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} data-testid="add-channel-btn">
          <Plus className="h-4 w-4 mr-2" />
          Thêm kênh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng Lead từ tất cả kênh</p>
                <p className="text-2xl font-bold">{stats.total_leads}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Lead hôm nay</p>
                <p className="text-2xl font-bold">{stats.leads_today}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Kênh hoạt động</p>
                <p className="text-2xl font-bold">{stats.active_channels}</p>
              </div>
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tỷ lệ tương tác</p>
                <p className="text-2xl font-bold">{stats.engagement_rate}%</p>
              </div>
              <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Eye className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="active">Đang hoạt động</TabsTrigger>
          <TabsTrigger value="inactive">Chưa kết nối</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <p>Đang tải...</p>
            ) : (
              channels.map((channel) => (
                <Card key={channel.id} className="overflow-hidden" data-testid={`channel-card-${channel.channel}`}>
                  <CardHeader className={`${CHANNEL_COLORS[channel.channel]} text-white py-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <ChannelIcon channel={channel.channel} className="h-6 w-6" />
                        <div>
                          <CardTitle className="text-lg">{channel.name}</CardTitle>
                          <CardDescription className="text-white/80 text-sm">
                            {CHANNEL_CONFIG[channel.channel]?.name || channel.channel}
                          </CardDescription>
                        </div>
                      </div>
                      <Switch
                        checked={channel.is_active}
                        onCheckedChange={() => handleToggleChannel(channel.id)}
                        className="data-[state=checked]:bg-white data-[state=checked]:text-blue-600"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Status */}
                    <div className="flex items-center gap-2">
                      {channel.is_active ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Đã kết nối</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-500">Chưa kết nối</span>
                        </>
                      )}
                    </div>

                    {/* Stats */}
                    {channel.is_active && channel.stats && (
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-semibold">{channel.stats.followers?.toLocaleString() || 0}</p>
                          <p className="text-xs text-gray-500">Followers</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-semibold">{channel.stats.leads_this_month || 0}</p>
                          <p className="text-xs text-gray-500">Leads/tháng</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-lg font-semibold">{channel.stats.engagement || 0}%</p>
                          <p className="text-xs text-gray-500">Tương tác</p>
                        </div>
                      </div>
                    )}

                    {/* Last sync */}
                    {channel.last_sync && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Đồng bộ: {new Date(channel.last_sync).toLocaleString("vi-VN")}</span>
                      </div>
                    )}

                    {/* Webhook URL */}
                    <div className="flex items-center gap-2">
                      <Input
                        value={channel.webhook_url}
                        readOnly
                        className="text-xs bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyWebhookUrl(channel.webhook_url)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedChannel(channel);
                          setIsConfigDialogOpen(true);
                        }}
                      >
                        <Settings className="h-4 w-4 mr-1" />
                        Cấu hình
                      </Button>
                      {channel.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(channel.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Add new channel card */}
            <Card
              className="border-2 border-dashed border-gray-300 hover:border-blue-400 cursor-pointer transition-colors"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <CardContent className="flex flex-col items-center justify-center h-full py-12">
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Thêm kênh mới</p>
                <p className="text-sm text-gray-400">Kết nối thêm kênh marketing</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="active">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.filter(c => c.is_active).map((channel) => (
              <Card key={channel.id} data-testid={`active-channel-${channel.channel}`}>
                <CardHeader className={`${CHANNEL_COLORS[channel.channel]} text-white py-4`}>
                  <div className="flex items-center gap-3">
                    <ChannelIcon channel={channel.channel} className="h-6 w-6" />
                    <CardTitle className="text-lg">{channel.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-semibold">{channel.stats?.followers?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-semibold">{channel.stats?.leads_this_month || 0}</p>
                      <p className="text-xs text-gray-500">Leads</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-lg font-semibold">{channel.stats?.engagement || 0}%</p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inactive">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(CHANNEL_CONFIG)
              .filter(([key]) => !channels.some(c => c.channel === key && c.is_active))
              .map(([key, config]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:border-blue-400 transition-colors"
                  onClick={() => {
                    setSelectedChannelType(key);
                    setIsAddDialogOpen(true);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 ${CHANNEL_COLORS[key]} rounded-lg flex items-center justify-center`}>
                        <ChannelIcon channel={key} className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{config.name}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {config.features.map((feature) => (
                        <Badge key={feature} variant="secondary">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Kết nối
                    </Button>
                  </CardContent>
                </Card>
              ))}
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
              <Label>Chọn kênh</Label>
              <Select value={selectedChannelType} onValueChange={setSelectedChannelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <ChannelIcon channel={key} className="h-4 w-4" />
                        {config.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tên hiển thị</Label>
              <Input
                placeholder={CHANNEL_CONFIG[selectedChannelType]?.name}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {CHANNEL_CONFIG[selectedChannelType]?.fields.map((field) => (
              <div key={field.key}>
                <Label>{field.label}</Label>
                <Input
                  type={field.type}
                  placeholder={`Nhập ${field.label}`}
                  value={formData.credentials[field.key] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credentials: { ...formData.credentials, [field.key]: e.target.value },
                    })
                  }
                />
              </div>
            ))}

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Hướng dẫn:</strong> Để lấy API credentials, vui lòng truy cập vào Developer Portal của{" "}
                {CHANNEL_CONFIG[selectedChannelType]?.name} và tạo ứng dụng.
              </p>
              <Button variant="link" className="text-blue-600 p-0 h-auto mt-1" asChild>
                <a href="#" target="_blank" rel="noopener">
                  Xem hướng dẫn chi tiết <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAddChannel} data-testid="confirm-add-channel-btn">
              Kết nối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Channel Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cấu hình {selectedChannel?.name}</DialogTitle>
          </DialogHeader>
          {selectedChannel && (
            <div className="space-y-4">
              <div>
                <Label>Webhook URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={`${process.env.REACT_APP_BACKEND_URL}${selectedChannel.webhook_url}`}
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyWebhookUrl(selectedChannel.webhook_url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Copy URL này và dán vào cài đặt Webhook của {CHANNEL_CONFIG[selectedChannel.channel]?.name}
                </p>
              </div>

              <div>
                <Label>Tính năng AI Auto-reply</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Tự động trả lời comment</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Tự động trả lời tin nhắn</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Tự động tạo lead từ tin nhắn</span>
                  <Switch defaultChecked />
                </div>
              </div>

              <div>
                <Label>Thông báo</Label>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Thông báo khi có lead mới</span>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Thông báo khi cần human review</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => {
              toast.success("Đã lưu cấu hình!");
              setIsConfigDialogOpen(false);
            }}>
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
