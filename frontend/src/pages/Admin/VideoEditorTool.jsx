import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Plus, Trash2,
  Image as ImageIcon, Type, Music, Download, Eye, Settings, Layers,
  MoveUp, MoveDown, Copy, Edit, Clock, Film, Sparkles, Upload, X,
  ChevronLeft, ChevronRight, Square, Circle, Triangle, Star, Heart,
  ArrowRight, Check, Zap, Target, Home, Building2, Phone, Mail, Loader2,
  AlertCircle, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// ==================== TEMPLATES ====================
const videoTemplates = [
  {
    id: 'real-estate-modern',
    name: 'Bất động sản Hiện đại',
    thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
    slides: [
      { type: 'intro', duration: 3, bgColor: '#316585', textColor: '#ffffff' },
      { type: 'features', duration: 4, bgColor: '#ffffff', textColor: '#1e293b' },
      { type: 'gallery', duration: 5, bgColor: '#f8fafc', textColor: '#1e293b' },
      { type: 'pricing', duration: 4, bgColor: '#316585', textColor: '#ffffff' },
      { type: 'contact', duration: 3, bgColor: '#1e293b', textColor: '#ffffff' },
    ]
  },
  {
    id: 'luxury-villa',
    name: 'Biệt thự Cao cấp',
    thumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400',
    slides: [
      { type: 'intro', duration: 4, bgColor: '#1a1a2e', textColor: '#ffffff' },
      { type: 'features', duration: 5, bgColor: '#16213e', textColor: '#ffffff' },
      { type: 'gallery', duration: 6, bgColor: '#0f3460', textColor: '#ffffff' },
      { type: 'contact', duration: 3, bgColor: '#e94560', textColor: '#ffffff' },
    ]
  },
  {
    id: 'apartment-simple',
    name: 'Căn hộ Đơn giản',
    thumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
    slides: [
      { type: 'intro', duration: 3, bgColor: '#ffffff', textColor: '#316585' },
      { type: 'gallery', duration: 4, bgColor: '#f1f5f9', textColor: '#1e293b' },
      { type: 'pricing', duration: 3, bgColor: '#316585', textColor: '#ffffff' },
      { type: 'contact', duration: 2, bgColor: '#1e293b', textColor: '#ffffff' },
    ]
  }
];

// ==================== SLIDE EDITOR COMPONENT ====================
const SlideEditor = ({ slide, index, onUpdate, onDelete, onMoveUp, onMoveDown }) => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Slide {index + 1}</Badge>
            <Badge className="bg-[#316585]">{slide.duration}s</Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onMoveUp} disabled={index === 0}>
              <MoveUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onMoveDown}>
              <MoveDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(!isEditing)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-500 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div 
          className="relative aspect-video rounded-lg overflow-hidden mb-4"
          style={{ backgroundColor: slide.bgColor }}
        >
          {slide.image && (
            <img src={slide.image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {slide.title && (
              <h3 
                className="text-2xl font-bold mb-2" 
                style={{ color: slide.textColor, fontSize: `${slide.titleSize || 24}px` }}
              >
                {slide.title}
              </h3>
            )}
            {slide.subtitle && (
              <p 
                className="text-lg" 
                style={{ color: slide.textColor, opacity: 0.8 }}
              >
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing && (
          <div className="space-y-4 border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tiêu đề</label>
                <Input 
                  value={slide.title || ''} 
                  onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
                  placeholder="Nhập tiêu đề..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phụ đề</label>
                <Input 
                  value={slide.subtitle || ''} 
                  onChange={(e) => onUpdate({ ...slide, subtitle: e.target.value })}
                  placeholder="Nhập phụ đề..."
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Thời lượng (giây)</label>
                <Input 
                  type="number" 
                  value={slide.duration} 
                  onChange={(e) => onUpdate({ ...slide, duration: parseInt(e.target.value) || 3 })}
                  min={1}
                  max={30}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Màu nền</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={slide.bgColor} 
                    onChange={(e) => onUpdate({ ...slide, bgColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input 
                    value={slide.bgColor} 
                    onChange={(e) => onUpdate({ ...slide, bgColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Màu chữ</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={slide.textColor} 
                    onChange={(e) => onUpdate({ ...slide, textColor: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer"
                  />
                  <Input 
                    value={slide.textColor} 
                    onChange={(e) => onUpdate({ ...slide, textColor: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">URL Hình ảnh nền</label>
              <Input 
                value={slide.image || ''} 
                onChange={(e) => onUpdate({ ...slide, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ==================== VIDEO PREVIEW COMPONENT ====================
const VideoPreview = ({ slides, currentSlide, isPlaying, onSlideChange }) => {
  const slide = slides[currentSlide] || slides[0];

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      {slide && (
        <div 
          className="absolute inset-0 transition-all duration-500"
          style={{ backgroundColor: slide.bgColor }}
        >
          {slide.image && (
            <img 
              src={slide.image} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-50"
            />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            {slide.title && (
              <h2 
                className="text-4xl lg:text-5xl font-bold mb-4 animate-fade-in"
                style={{ color: slide.textColor }}
              >
                {slide.title}
              </h2>
            )}
            {slide.subtitle && (
              <p 
                className="text-xl lg:text-2xl animate-fade-in"
                style={{ color: slide.textColor, opacity: 0.8 }}
              >
                {slide.subtitle}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Slide indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => onSlideChange(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === currentSlide ? 'bg-white w-6' : 'bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Play indicator */}
      {isPlaying && (
        <div className="absolute top-4 right-4">
          <Badge className="bg-red-500 text-white border-0">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
            REC
          </Badge>
        </div>
      )}
    </div>
  );
};

// ==================== MAIN VIDEO EDITOR COMPONENT ====================
export default function VideoEditorTool() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    name: '',
    slogan: '',
    price: '',
    location: '',
    phone: '1800 1234',
    website: 'prohouzing.com'
  });
  const [musicUrl, setMusicUrl] = useState('');
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const playIntervalRef = useRef(null);

  // Auto-play slides
  useEffect(() => {
    if (isPlaying && slides.length > 0) {
      const currentDuration = slides[currentSlide]?.duration || 3;
      playIntervalRef.current = setTimeout(() => {
        if (currentSlide < slides.length - 1) {
          setCurrentSlide(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setCurrentSlide(0);
        }
      }, currentDuration * 1000);
    }

    return () => {
      if (playIntervalRef.current) {
        clearTimeout(playIntervalRef.current);
      }
    };
  }, [isPlaying, currentSlide, slides]);

  // Load template
  const loadTemplate = (template) => {
    setSelectedTemplate(template);
    const newSlides = template.slides.map((slideTemplate, index) => ({
      ...slideTemplate,
      id: `slide-${Date.now()}-${index}`,
      title: getDefaultTitle(slideTemplate.type, index),
      subtitle: getDefaultSubtitle(slideTemplate.type),
      image: ''
    }));
    setSlides(newSlides);
  };

  const getDefaultTitle = (type, index) => {
    switch (type) {
      case 'intro': return projectInfo.name || 'Tên dự án';
      case 'features': return 'Điểm nổi bật';
      case 'gallery': return 'Hình ảnh dự án';
      case 'pricing': return 'Bảng giá';
      case 'contact': return 'Liên hệ ngay';
      default: return `Slide ${index + 1}`;
    }
  };

  const getDefaultSubtitle = (type) => {
    switch (type) {
      case 'intro': return projectInfo.slogan || 'Slogan dự án';
      case 'features': return 'Tiện ích đẳng cấp';
      case 'gallery': return 'Thiết kế hiện đại';
      case 'pricing': return projectInfo.price || 'Giá từ 2.5 tỷ';
      case 'contact': return projectInfo.phone;
      default: return '';
    }
  };

  // Slide operations
  const addSlide = () => {
    const newSlide = {
      id: `slide-${Date.now()}`,
      type: 'custom',
      duration: 3,
      bgColor: '#316585',
      textColor: '#ffffff',
      title: 'Tiêu đề mới',
      subtitle: 'Phụ đề',
      image: ''
    };
    setSlides([...slides, newSlide]);
  };

  const updateSlide = (index, updatedSlide) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);
  };

  const deleteSlide = (index) => {
    if (slides.length <= 1) {
      toast.error('Cần ít nhất 1 slide');
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
    if (currentSlide >= newSlides.length) {
      setCurrentSlide(newSlides.length - 1);
    }
  };

  const moveSlide = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= slides.length) return;
    
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides);
  };

  // Playback controls
  const togglePlay = () => {
    if (!isPlaying) {
      setCurrentSlide(0);
    }
    setIsPlaying(!isPlaying);
  };

  const prevSlide = () => {
    setIsPlaying(false);
    setCurrentSlide(prev => Math.max(0, prev - 1));
  };

  const nextSlide = () => {
    setIsPlaying(false);
    setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));
  };

  // Video generation state
  const [exportQuality, setExportQuality] = useState('1080p');
  const [exportFormat, setExportFormat] = useState('mp4');
  const [isExporting, setIsExporting] = useState(false);
  const [exportJob, setExportJob] = useState(null);
  const pollIntervalRef = useRef(null);

  // Poll job status
  const pollJobStatus = async (jobId) => {
    try {
      const response = await api.get(`/admin/video-editor/status/${jobId}`);
      const job = response.data;
      setExportJob(job);
      
      if (job.status === 'completed') {
        clearInterval(pollIntervalRef.current);
        setIsExporting(false);
        toast.success('Video đã sẵn sàng để tải!');
      } else if (job.status === 'failed') {
        clearInterval(pollIntervalRef.current);
        setIsExporting(false);
        toast.error(`Lỗi: ${job.error || 'Không thể tạo video'}`);
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  };

  // Export video - connected to backend
  const handleExport = async () => {
    if (slides.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 slide');
      return;
    }

    setIsExporting(true);
    setShowExportDialog(false);

    try {
      const payload = {
        project_info: {
          name: projectInfo.name || 'Dự án',
          slogan: projectInfo.slogan,
          price: projectInfo.price,
          location: projectInfo.location,
          phone: projectInfo.phone,
          website: projectInfo.website
        },
        slides: slides.map(slide => ({
          id: slide.id,
          type: slide.type || 'custom',
          duration: slide.duration,
          bg_color: slide.bgColor,
          text_color: slide.textColor,
          title: slide.title,
          subtitle: slide.subtitle,
          image: slide.image || null
        })),
        music_url: musicUrl || null,
        quality: exportQuality,
        format: exportFormat,
        template_id: selectedTemplate?.id || null
      };

      const response = await api.post('/admin/video-editor/generate', payload);
      const job = response.data;
      
      setExportJob({
        job_id: job.job_id,
        status: 'pending',
        progress: 0,
        message: job.message
      });

      toast.info('Đang xử lý video...');
      
      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(job.job_id);
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      toast.error('Không thể bắt đầu tạo video. Vui lòng thử lại.');
    }
  };

  // Download completed video
  const handleDownload = async () => {
    if (!exportJob?.job_id) return;
    
    try {
      const link = document.createElement('a');
      link.href = `${API_URL}/api/admin/video-editor/download/${exportJob.job_id}`;
      link.setAttribute('download', `prohouzing_video.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error('Không thể tải video');
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // Calculate total duration
  const totalDuration = slides.reduce((acc, slide) => acc + (slide.duration || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 py-8" data-testid="video-editor">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Video Editor</h1>
          <p className="text-slate-600 dark:text-slate-400">Tạo video quảng cáo dự án chuyên nghiệp</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Panel - Template & Project Info */}
          <div className="space-y-6">
            {/* Template Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#316585]" />
                  Chọn Template
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {videoTemplates.map(template => (
                    <button
                      key={template.id}
                      onClick={() => loadTemplate(template)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        selectedTemplate?.id === template.id 
                          ? 'border-[#316585] bg-[#316585]/10' 
                          : 'border-slate-200 hover:border-[#316585]/50'
                      }`}
                    >
                      <img src={template.thumbnail} alt={template.name} className="w-16 h-10 rounded object-cover" />
                      <div className="text-left">
                        <p className="font-medium text-sm">{template.name}</p>
                        <p className="text-xs text-slate-500">{template.slides.length} slides</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#316585]" />
                  Thông tin dự án
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Tên dự án</label>
                  <Input 
                    value={projectInfo.name} 
                    onChange={(e) => setProjectInfo({...projectInfo, name: e.target.value})}
                    placeholder="Vinhomes Grand Park"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Slogan</label>
                  <Input 
                    value={projectInfo.slogan} 
                    onChange={(e) => setProjectInfo({...projectInfo, slogan: e.target.value})}
                    placeholder="Đại đô thị đẳng cấp"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Giá từ</label>
                  <Input 
                    value={projectInfo.price} 
                    onChange={(e) => setProjectInfo({...projectInfo, price: e.target.value})}
                    placeholder="2.5 tỷ"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Vị trí</label>
                  <Input 
                    value={projectInfo.location} 
                    onChange={(e) => setProjectInfo({...projectInfo, location: e.target.value})}
                    placeholder="Quận 9, TP.HCM"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Hotline</label>
                  <Input 
                    value={projectInfo.phone} 
                    onChange={(e) => setProjectInfo({...projectInfo, phone: e.target.value})}
                    placeholder="1800 1234"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Music */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-[#316585]" />
                  Nhạc nền
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input 
                  value={musicUrl} 
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="URL file nhạc (.mp3)"
                />
                <p className="text-xs text-slate-500 mt-2">Hỗ trợ định dạng MP3, WAV</p>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Preview & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Preview */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Xem trước</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Clock className="h-3 w-3 mr-1" />
                      {totalDuration}s
                    </Badge>
                    <Badge variant="outline">
                      {slides.length} slides
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {slides.length > 0 ? (
                  <VideoPreview 
                    slides={slides}
                    currentSlide={currentSlide}
                    isPlaying={isPlaying}
                    onSlideChange={setCurrentSlide}
                  />
                ) : (
                  <div className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <Film className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-slate-500">Chọn template để bắt đầu</p>
                    </div>
                  </div>
                )}

                {/* Playback Controls */}
                {slides.length > 0 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <Button variant="outline" size="icon" onClick={prevSlide} disabled={currentSlide === 0}>
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="lg" 
                      onClick={togglePlay}
                      className="bg-[#316585] hover:bg-[#264a5e] w-16 h-16 rounded-full"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextSlide} disabled={currentSlide === slides.length - 1}>
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Slides Editor */}
            {slides.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-[#316585]" />
                      Danh sách Slides
                    </CardTitle>
                    <Button onClick={addSlide} size="sm" className="bg-[#316585] hover:bg-[#264a5e]">
                      <Plus className="h-4 w-4 mr-1" /> Thêm slide
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="max-h-[500px] overflow-y-auto">
                  {slides.map((slide, index) => (
                    <SlideEditor
                      key={slide.id}
                      slide={slide}
                      index={index}
                      onUpdate={(updated) => updateSlide(index, updated)}
                      onDelete={() => deleteSlide(index)}
                      onMoveUp={() => moveSlide(index, -1)}
                      onMoveDown={() => moveSlide(index, 1)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Export Button */}
            {slides.length > 0 && (
              <div className="flex justify-end gap-4">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" /> Xem toàn màn hình
                </Button>
                <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#316585] hover:bg-[#264a5e]" disabled={isExporting}>
                      <Download className="h-4 w-4 mr-2" /> Xuất Video
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Xuất Video</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-sm font-medium">Chất lượng</label>
                        <Select value={exportQuality} onValueChange={setExportQuality}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="720p">720p (HD)</SelectItem>
                            <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                            <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Định dạng</label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mp4">MP4</SelectItem>
                            <SelectItem value="webm">WebM</SelectItem>
                            <SelectItem value="mov">MOV</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="pt-4">
                        <p className="text-sm text-slate-500 mb-4">
                          Video sẽ có độ dài: <strong>{totalDuration} giây</strong>
                        </p>
                        <Button onClick={handleExport} className="w-full bg-[#316585] hover:bg-[#264a5e]">
                          <Download className="h-4 w-4 mr-2" /> Bắt đầu xuất
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Export Progress */}
            {(isExporting || exportJob) && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {exportJob?.status === 'completed' ? (
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    ) : exportJob?.status === 'failed' ? (
                      <AlertCircle className="w-8 h-8 text-red-500" />
                    ) : (
                      <Loader2 className="w-8 h-8 text-[#316585] animate-spin" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {exportJob?.status === 'completed' ? 'Video đã sẵn sàng!' : 
                         exportJob?.status === 'failed' ? 'Lỗi tạo video' :
                         'Đang tạo video...'}
                      </h3>
                      <p className="text-sm text-slate-500">{exportJob?.message}</p>
                    </div>
                  </div>
                  
                  {exportJob?.status !== 'completed' && exportJob?.status !== 'failed' && (
                    <Progress value={exportJob?.progress || 0} className="h-2 mb-2" />
                  )}
                  
                  {exportJob?.status === 'completed' && (
                    <Button onClick={handleDownload} className="w-full bg-green-500 hover:bg-green-600">
                      <Download className="h-4 w-4 mr-2" /> Tải video
                    </Button>
                  )}
                  
                  {exportJob?.status === 'failed' && (
                    <Button onClick={() => setExportJob(null)} variant="outline" className="w-full">
                      Thử lại
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
