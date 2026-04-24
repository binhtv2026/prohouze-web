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
import api from "@/lib/api";
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
  AlertCircle,
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

const STATUS_CONFIG = {
  draft: { label: "Bản nháp", color: "bg-gray-100 text-gray-700", icon: FileText },
  pending_review: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  approved: { label: "Đã duyệt", color: "bg-green-100 text-green-700", icon: CheckCircle },
  rejected: { label: "Từ chối", color: "bg-red-100 text-red-700", icon: XCircle },
  scheduled: { label: "Đã lên lịch", color: "bg-blue-100 text-blue-700", icon: Calendar },
  published: { label: "Đã đăng", color: "bg-purple-100 text-purple-700", icon: Send },
};

const CONTENT_TYPES = [
  { value: "post", label: "Bài đăng", icon: FileText },
  { value: "story", label: "Story", icon: Image },
  { value: "reel", label: "Reel/Short", icon: Video },
  { value: "video", label: "Video", icon: Video },
  { value: "carousel", label: "Carousel", icon: Image },
  { value: "article", label: "Bài viết dài", icon: FileText },
];

const DAYS_OF_WEEK = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default function ContentCalendarPage() {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("calendar"); // calendar, list
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content_type: "post",
    channels: ["facebook"],
    body: "",
    media_urls: [],
    hashtags: [],
    scheduled_at: "",
    project_id: "",
    ai_generated: false,
  });

  const [aiPrompt, setAIPrompt] = useState({
    topic: "",
    tone: "professional",
    length: "medium",
    include_cta: true,
    target_audience: "",
    keywords: [],
  });

  const fetchContents = useCallback(async () => {
    try {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (channelFilter !== "all") params.channel = channelFilter;
      
      const response = await api.get("/content", { params });
      setContents(response.data);
    } catch (error) {
      console.error("Error fetching contents:", error);
      // Mock data
      setContents([
        {
          id: "1",
          title: "Ra mắt dự án Sky Garden",
          content_type: "post",
          channels: ["facebook", "zalo"],
          body: "Chào mừng bạn đến với Sky Garden - Nơi an cư lý tưởng với view sông tuyệt đẹp...",
          status: "published",
          approval_status: "approved",
          scheduled_at: "2024-02-10T09:00:00Z",
          published_at: "2024-02-10T09:00:00Z",
          created_by_name: "Lê Hoàng Nam",
          created_at: "2024-02-08T10:00:00Z",
          ai_generated: true,
          hashtags: ["#SkyGarden", "#ProHouze", "#BatDongSan"],
          engagement_stats: { likes: 245, comments: 32, shares: 18 },
        },
        {
          id: "2",
          title: "Tips đầu tư BĐS 2024",
          content_type: "reel",
          channels: ["tiktok", "facebook"],
          body: "5 tips đầu tư bất động sản cho người mới bắt đầu...",
          status: "scheduled",
          approval_status: "approved",
          scheduled_at: "2024-02-15T14:00:00Z",
          created_by_name: "Trần Văn Minh",
          created_at: "2024-02-09T15:00:00Z",
          ai_generated: false,
          hashtags: ["#DauTuBDS", "#Tips2024"],
        },
        {
          id: "3",
          title: "Sự kiện mở bán The Sun",
          content_type: "post",
          channels: ["facebook", "linkedin"],
          body: "Sự kiện mở bán độc quyền dự án The Sun Apartment...",
          status: "pending_review",
          approval_status: "pending",
          scheduled_at: null,
          created_by_name: "Marketing Team",
          created_at: "2024-02-10T08:00:00Z",
          ai_generated: true,
          hashtags: ["#TheSun", "#MoBan"],
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter]);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await api.get("/projects");
      setProjects(response.data);
    } catch {
      setProjects([
        { id: "1", name: "Sky Garden Residence" },
        { id: "2", name: "The Sun Apartment" },
        { id: "3", name: "Green Valley Villa" },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchContents();
    fetchProjects();
  }, [fetchContents, fetchProjects]);

  const handleCreateContent = async () => {
    try {
      await api.post("/content", formData);
      toast.success("Tạo nội dung thành công!");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchContents();
    } catch (error) {
      toast.error("Lỗi: " + (error.response?.data?.detail || error.message));
    }
  };

  const handleAIGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await api.post("/content/generate", {
        content_type: formData.content_type,
        channels: formData.channels,
        project_id: formData.project_id,
        topic: aiPrompt.topic,
        tone: aiPrompt.tone,
        length: aiPrompt.length,
        include_cta: aiPrompt.include_cta,
        target_audience: aiPrompt.target_audience,
        keywords: aiPrompt.keywords,
      });
      
      setFormData({
        ...formData,
        title: response.data.title,
        body: response.data.body,
        hashtags: response.data.hashtags,
        ai_generated: true,
      });
      
      toast.success("ProH AI đã tạo nội dung thành công!");
      setIsAIGenerateOpen(false);
    } catch (error) {
      toast.error("Lỗi AI: " + (error.response?.data?.detail || error.message));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitForReview = async (contentId) => {
    try {
      await api.post(`/content/${contentId}/submit-for-review`);
      toast.success("Đã gửi nội dung để duyệt!");
      fetchContents();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handleApprove = async (contentId, status, comment = "") => {
    try {
      await api.post(`/content/${contentId}/approve`, { status, comment });
      toast.success(status === "approved" ? "Đã duyệt nội dung!" : "Đã từ chối nội dung!");
      fetchContents();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const handlePublish = async (contentId) => {
    try {
      await api.post(`/content/${contentId}/publish`);
      toast.success("Đã đăng nội dung lên các kênh!");
      fetchContents();
    } catch (error) {
      toast.error("Lỗi: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content_type: "post",
      channels: ["facebook"],
      body: "",
      media_urls: [],
      hashtags: [],
      scheduled_at: "",
      project_id: "",
      ai_generated: false,
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
    // Add empty cells for days before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
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
        if (
          !content.title.toLowerCase().includes(query) &&
          !content.body.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [contents, searchQuery]);

  const ChannelIcon = ({ channel, className }) => {
    const Icon = CHANNEL_ICONS[channel] || Globe;
    return <Icon className={className} />;
  };

  return (
    <div className="space-y-6" data-testid="content-calendar-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
          <p className="text-gray-500">Lịch nội dung & quản lý bài đăng đa kênh</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsAIGenerateOpen(true)} data-testid="ai-generate-btn">
            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
            ProH AI Tạo nội dung
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="create-content-btn">
            <Plus className="h-4 w-4 mr-2" />
            Tạo mới
          </Button>
        </div>
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
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="draft">Bản nháp</SelectItem>
                  <SelectItem value="pending_review">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="scheduled">Đã lên lịch</SelectItem>
                  <SelectItem value="published">Đã đăng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Kênh" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kênh</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="zalo">Zalo</SelectItem>
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
            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayContents = day ? getContentsForDate(day) : [];
                const isToday = day && new Date().toDateString() === day.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-[100px] border rounded-lg p-1 ${
                      day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                    } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                  >
                    {day && (
                      <>
                        <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : "text-gray-700"}`}>
                          {day.getDate()}
                        </div>
                        <div className="space-y-1">
                          {dayContents.slice(0, 3).map((content) => (
                            <div
                              key={content.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer ${
                                STATUS_CONFIG[content.status]?.color || "bg-gray-100"
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
                          {dayContents.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{dayContents.length - 3} more
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
            <div className="text-center py-8">Đang tải...</div>
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
              <Card key={content.id} className="overflow-hidden" data-testid={`content-card-${content.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={STATUS_CONFIG[content.status]?.color}>
                          {STATUS_CONFIG[content.status]?.label}
                        </Badge>
                        {content.ai_generated && (
                          <Badge variant="outline" className="text-purple-600 border-purple-200">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Generated
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {CONTENT_TYPES.find((t) => t.value === content.content_type)?.label || content.content_type}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{content.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-3">{content.body}</p>
                      
                      {/* Channels */}
                      <div className="flex items-center gap-2 mb-3">
                        {content.channels.map((channel) => (
                          <div
                            key={channel}
                            className={`h-6 w-6 rounded-full flex items-center justify-center ${CHANNEL_COLORS[channel]}`}
                            title={channel}
                          >
                            <ChannelIcon channel={channel} className="h-3 w-3" />
                          </div>
                        ))}
                      </div>

                      {/* Hashtags */}
                      {content.hashtags && content.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {content.hashtags.map((tag) => (
                            <span key={tag} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Tạo bởi: {content.created_by_name}</span>
                        <span>{new Date(content.created_at).toLocaleDateString("vi-VN")}</span>
                        {content.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(content.scheduled_at).toLocaleString("vi-VN")}
                          </span>
                        )}
                      </div>

                      {/* Engagement stats */}
                      {content.engagement_stats && content.status === "published" && (
                        <div className="flex gap-4 mt-3 pt-3 border-t">
                          <span className="text-sm">
                            <strong>{content.engagement_stats.likes}</strong> Likes
                          </span>
                          <span className="text-sm">
                            <strong>{content.engagement_stats.comments}</strong> Comments
                          </span>
                          <span className="text-sm">
                            <strong>{content.engagement_stats.shares}</strong> Shares
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContent(content);
                              setIsPreviewOpen(true);
                            }}
                          >
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
                              <DropdownMenuItem onClick={() => handleApprove(content.id, "approved")}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                Duyệt
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleApprove(content.id, "rejected", "Cần chỉnh sửa")}>
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
                    {CONTENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dự án liên quan</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(v) => setFormData({ ...formData, project_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn dự án (tùy chọn)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Không chọn</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Kênh đăng</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.keys(CHANNEL_ICONS).map((channel) => {
                  const isSelected = formData.channels.includes(channel);
                  return (
                    <Button
                      key={channel}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (isSelected) {
                          setFormData({
                            ...formData,
                            channels: formData.channels.filter((c) => c !== channel),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            channels: [...formData.channels, channel],
                          });
                        }
                      }}
                    >
                      <ChannelIcon channel={channel} className="h-4 w-4 mr-1" />
                      {channel.charAt(0).toUpperCase() + channel.slice(1)}
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
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-500">{formData.body.length} ký tự</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-purple-600"
                  onClick={() => setIsAIGenerateOpen(true)}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Dùng AI viết
                </Button>
              </div>
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

            <div>
              <Label>Lên lịch đăng</Label>
              <Input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Để trống nếu muốn lưu nháp hoặc đăng ngay sau khi duyệt
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateContent} data-testid="submit-content-btn">
              Tạo nội dung
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              ProH AI - Tạo nội dung
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Chủ đề / Ý tưởng chính *</Label>
              <Textarea
                placeholder="Ví dụ: Ra mắt dự án Sky Garden với ưu đãi đặc biệt cho 50 khách hàng đầu tiên..."
                rows={3}
                value={aiPrompt.topic}
                onChange={(e) => setAIPrompt({ ...aiPrompt, topic: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tone</Label>
                <Select value={aiPrompt.tone} onValueChange={(v) => setAIPrompt({ ...aiPrompt, tone: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Chuyên nghiệp</SelectItem>
                    <SelectItem value="casual">Thân thiện</SelectItem>
                    <SelectItem value="exciting">Hấp dẫn/FOMO</SelectItem>
                    <SelectItem value="informative">Cung cấp thông tin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Độ dài</Label>
                <Select value={aiPrompt.length} onValueChange={(v) => setAIPrompt({ ...aiPrompt, length: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Ngắn (TikTok, Story)</SelectItem>
                    <SelectItem value="medium">Trung bình (Post)</SelectItem>
                    <SelectItem value="long">Dài (Article, Blog)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Đối tượng mục tiêu</Label>
              <Input
                placeholder="Ví dụ: Người có nhu cầu đầu tư BĐS, 30-45 tuổi"
                value={aiPrompt.target_audience}
                onChange={(e) => setAIPrompt({ ...aiPrompt, target_audience: e.target.value })}
              />
            </div>

            <div>
              <Label>Keywords cần có</Label>
              <Input
                placeholder="Ưu đãi, chiết khấu, vị trí đắc địa (cách nhau bởi dấu phẩy)"
                onChange={(e) =>
                  setAIPrompt({
                    ...aiPrompt,
                    keywords: e.target.value.split(",").map((k) => k.trim()),
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Thêm Call-to-Action</Label>
              <input
                type="checkbox"
                checked={aiPrompt.include_cta}
                onChange={(e) => setAIPrompt({ ...aiPrompt, include_cta: e.target.checked })}
                className="rounded"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAIGenerateOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleAIGenerate} disabled={!aiPrompt.topic || isGenerating} data-testid="generate-ai-content-btn">
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Tạo nội dung
                </>
              )}
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
                <Badge className={STATUS_CONFIG[selectedContent.status]?.color}>
                  {STATUS_CONFIG[selectedContent.status]?.label}
                </Badge>
                {selectedContent.ai_generated && (
                  <Badge variant="outline" className="text-purple-600">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-semibold">{selectedContent.title}</h2>
              <div className="flex gap-2">
                {selectedContent.channels.map((channel) => (
                  <div
                    key={channel}
                    className={`h-8 w-8 rounded-full flex items-center justify-center ${CHANNEL_COLORS[channel]}`}
                  >
                    <ChannelIcon channel={channel} className="h-4 w-4" />
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{selectedContent.body}</p>
              </div>
              {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedContent.hashtags.map((tag) => (
                    <span key={tag} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-500">
                <p>Tạo bởi: {selectedContent.created_by_name}</p>
                <p>Ngày tạo: {new Date(selectedContent.created_at).toLocaleString("vi-VN")}</p>
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
