/**
 * Content Calendar Page V2 - Prompt 13/20
 * Content Management using Marketing V2 API
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  getContents,
  getContentTypes,
  getChannels,
  createContent,
  submitContentForReview,
  approveContent,
  rejectContent,
  publishContent,
  STATUS_COLORS,
} from "@/api/marketingV2Api";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  MoreVertical,
  Image,
  Video,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Facebook,
  Youtube,
  Linkedin,
  Globe,
  Loader2,
} from "lucide-react";

// Custom icons
const TikTokIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
  </svg>
);

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
};

const CHANNEL_COLORS = {
  facebook: "bg-blue-600 text-white",
  tiktok: "bg-gray-900 text-white",
  youtube: "bg-red-600 text-white",
  linkedin: "bg-blue-700 text-white",
  zalo: "bg-blue-500 text-white",
  website: "bg-emerald-600 text-white",
};

const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const DEMO_CONTENTS = [
  { id: "content-1", title: "Video review căn 2PN view sông", content_type: "video", status: "scheduled", scheduled_at: "2026-03-26T09:00:00Z", created_at: "2026-03-25T09:00:00Z", target_channel_ids: ["facebook", "tiktok"] },
  { id: "content-2", title: "Bài viết chính sách mở bán The Privé", content_type: "post", status: "approved", scheduled_at: "2026-03-27T14:00:00Z", created_at: "2026-03-25T10:00:00Z", target_channel_ids: ["website", "zalo"] },
  { id: "content-3", title: "Carousel hàng ngon cuối tuần", content_type: "image", status: "draft", scheduled_at: "2026-03-28T19:00:00Z", created_at: "2026-03-25T11:00:00Z", target_channel_ids: ["facebook"] },
];

const DEMO_CONTENT_TYPES = [
  { code: "post", label: "Bài viết" },
  { code: "image", label: "Hình ảnh" },
  { code: "video", label: "Video" },
];

const DEMO_CHANNELS = [
  { id: "facebook", code: "facebook", name: "Facebook", status: "connected" },
  { id: "tiktok", code: "tiktok", name: "TikTok", status: "connected" },
  { id: "website", code: "website", name: "Website", status: "connected" },
  { id: "zalo", code: "zalo", name: "Zalo", status: "connected" },
];

export default function ContentCalendarPageV2() {
  const [contents, setContents] = useState([]);
  const [contentTypes, setContentTypes] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content_type: "post",
    target_channel_ids: [],
    body: "",
    hashtags: [],
    scheduled_at: "",
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;

      const [contentsRes, typesRes, channelsRes] = await Promise.all([
        getContents(params),
        getContentTypes(),
        getChannels({ status: "connected" }),
      ]);

      const contentItems = contentsRes.data || [];
      setContents(contentItems.length > 0 ? contentItems : DEMO_CONTENTS.filter((item) => statusFilter === "all" || item.status === statusFilter));
      setContentTypes(typesRes.data?.content_types?.length > 0 ? typesRes.data.content_types : DEMO_CONTENT_TYPES);
      setChannels(channelsRes.data?.length > 0 ? channelsRes.data : DEMO_CHANNELS);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.warning("Đang hiển thị dữ liệu mẫu cho lịch nội dung");
      setContents(DEMO_CONTENTS.filter((item) => statusFilter === "all" || item.status === statusFilter));
      setContentTypes(DEMO_CONTENT_TYPES);
      setChannels(DEMO_CHANNELS);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateContent = async () => {
    try {
      await createContent({
        ...formData,
        hashtags: formData.hashtags.filter(h => h),
      });
      toast.success("Tạo nội dung thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleSubmitForReview = async (contentId) => {
    try {
      await submitContentForReview(contentId);
      toast.success("Đã gửi nội dung để duyệt!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleApprove = async (contentId) => {
    try {
      await approveContent(contentId);
      toast.success("Đã duyệt nội dung!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleReject = async (contentId) => {
    try {
      await rejectContent(contentId, "Cần chỉnh sửa");
      toast.success("Đã từ chối nội dung!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handlePublish = async (contentId) => {
    try {
      await publishContent(contentId);
      toast.success("Đã đăng nội dung!");
      fetchData();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content_type: "post",
      target_channel_ids: [],
      body: "",
      hashtags: [],
      scheduled_at: "",
    });
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const getContentsForDate = (date) => {
    if (!date) return [];
    return contents.filter((content) => {
      const contentDate = new Date(content.scheduled_at || content.created_at);
      return (
        contentDate.getDate() === date.getDate() &&
        contentDate.getMonth() === date.getMonth() &&
        contentDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const calendarDays = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  const filteredContents = useMemo(() => {
    return contents.filter((content) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!content.title.toLowerCase().includes(query) && !content.body.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [contents, searchQuery]);

  const getStatusBadge = (status, statusLabel) => {
    const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-700";
    return <Badge className={colors}>{statusLabel || status}</Badge>;
  };

  const ChannelIcon = ({ channel, className }) => {
    const Icon = CHANNEL_ICONS[channel] || Globe;
    return <Icon className={className} />;
  };

  return (
    <div className="space-y-6" data-testid="content-calendar-page-v2">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-500">Quản lý nội dung marketing - API v2</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-content-btn">
          <Plus className="h-4 w-4 mr-2" />
          Tạo nội dung
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="pending_review">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="published">Đã đăng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm nội dung..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <Calendar className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <FileText className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle>
                {currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayContents = day ? getContentsForDate(day) : [];
                const isToday = day && new Date().toDateString() === day.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] border rounded-lg p-1 ${
                      day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                    } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayContents.slice(0, 2).map((content) => (
                            <div
                              key={content.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer ${
                                STATUS_COLORS[content.status] || "bg-gray-100"
                              }`}
                              onClick={() => {
                                setSelectedContent(content);
                                setIsPreviewOpen(true);
                              }}
                              title={content.title}
                            >
                              {content.title}
                            </div>
                          ))}
                          {dayContents.length > 2 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayContents.length - 2}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredContents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Chưa có nội dung nào</p>
                <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo nội dung đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredContents.map((content) => (
              <Card key={content.id} data-testid={`content-card-${content.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusBadge(content.status, content.status_label)}
                        {content.ai_generated && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI
                          </Badge>
                        )}
                        <Badge variant="outline">{content.content_type_label || content.content_type}</Badge>
                        <span className="text-xs text-gray-400">{content.code}</span>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{content.body}</p>
                      
                      {/* Channels */}
                      {content.target_channel_ids?.length > 0 && (
                        <div className="flex items-center gap-1 mb-3">
                          {content.target_channel_ids.map((channelId) => {
                            const channel = channels.find(c => c.id === channelId);
                            if (!channel) return null;
                            return (
                              <div
                                key={channelId}
                                className={`h-6 w-6 rounded-full flex items-center justify-center ${CHANNEL_COLORS[channel.channel_type] || "bg-gray-600 text-white"}`}
                                title={channel.name}
                              >
                                <ChannelIcon channel={channel.channel_type} className="h-3 w-3" />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Hashtags */}
                      {content.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {content.hashtags.map((tag) => (
                            <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {content.created_by_name && <span>Tạo bởi: {content.created_by_name}</span>}
                        <span>{new Date(content.created_at).toLocaleDateString("vi-VN")}</span>
                        {content.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(content.scheduled_at).toLocaleString("vi-VN")}
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      {content.total_leads > 0 && (
                        <div className="flex gap-4 mt-2 pt-2 border-t text-sm">
                          <span><strong>{content.total_impressions}</strong> Views</span>
                          <span><strong>{content.total_engagement}</strong> Engagement</span>
                          <span><strong>{content.total_leads}</strong> Leads</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelectedContent(content); setIsPreviewOpen(true); }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        {content.status === "draft" && (
                          <DropdownMenuItem onClick={() => handleSubmitForReview(content.id)}>
                            <Send className="h-4 w-4 mr-2" />
                            Gửi duyệt
                          </DropdownMenuItem>
                        )}
                        {content.status === "pending_review" && (
                          <>
                            <DropdownMenuItem onClick={() => handleApprove(content.id)}>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Duyệt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReject(content.id)}>
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Từ chối
                            </DropdownMenuItem>
                          </>
                        )}
                        {content.status === "approved" && (
                          <DropdownMenuItem onClick={() => handlePublish(content.id)}>
                            <Send className="h-4 w-4 mr-2 text-blue-500" />
                            Đăng ngay
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Content Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo nội dung mới</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại nội dung</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData({ ...formData, content_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {contentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label_vi || type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Lên lịch</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Kênh đăng</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {channels.map((channel) => {
                  const isSelected = formData.target_channel_ids.includes(channel.id);
                  return (
                    <Button
                      key={channel.id}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            target_channel_ids: formData.target_channel_ids.filter(id => id !== channel.id),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            target_channel_ids: [...formData.target_channel_ids, channel.id],
                          });
                        }
                      }}
                    >
                      <ChannelIcon channel={channel.channel_type} className="h-4 w-4 mr-1" />
                      {channel.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label>Tiêu đề</Label>
              <Input
                placeholder="Nhập tiêu đề bài đăng"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label>Nội dung</Label>
              <Textarea
                placeholder="Nhập nội dung bài đăng..."
                rows={5}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
              <span className="text-xs text-gray-500">{formData.body.length} ký tự</span>
            </div>

            <div>
              <Label>Hashtags</Label>
              <Input
                placeholder="#ProHouze #BatDongSan (cách nhau bởi dấu cách)"
                value={formData.hashtags.join(" ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hashtags: e.target.value.split(" ").filter((t) => t.startsWith("#")),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateContent} disabled={!formData.title} data-testid="submit-content-btn">
              Tạo nội dung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết nội dung</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedContent.status, selectedContent.status_label)}
                <span className="text-sm text-gray-500">{selectedContent.code}</span>
              </div>
              <h2 className="text-xl font-semibold">{selectedContent.title}</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedContent.body}</p>
              </div>
              {selectedContent.hashtags?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedContent.hashtags.map((tag) => (
                    <span key={tag} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-500 space-y-1">
                <p>Tạo: {new Date(selectedContent.created_at).toLocaleString("vi-VN")}</p>
                {selectedContent.scheduled_at && (
                  <p>Lên lịch: {new Date(selectedContent.scheduled_at).toLocaleString("vi-VN")}</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
