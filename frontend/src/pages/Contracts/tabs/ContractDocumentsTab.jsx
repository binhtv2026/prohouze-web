/**
 * Contract Documents Tab
 * Shows documents by category, version history, checksum status
 */

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { documentApi, formatFileSize } from '@/lib/contractApi';
import { formatDate } from '@/lib/utils';
import {
  FileText,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Shield,
  Folder,
  History,
  Plus,
} from 'lucide-react';

const CATEGORY_ICONS = {
  contract_primary: FileText,
  customer_cccd: Shield,
  payment_receipt: FileText,
  legal_notarization: Shield,
  handover_minutes: FileText,
  other: Folder,
};

export default function ContractDocumentsTab({ contract, documents, isLocked, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await documentApi.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Group documents by category
  const documentsByCategory = React.useMemo(() => {
    const grouped = {};
    documents.forEach(doc => {
      const cat = doc.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(doc);
    });
    return grouped;
  }, [documents]);

  const handleUpload = async () => {
    if (!uploadFile || !selectedCategory) {
      toast.error('Vui lòng chọn file và danh mục');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('entity_type', 'contract');
      formData.append('entity_id', contract.id);
      formData.append('category', selectedCategory);
      formData.append('document_name', documentName || uploadFile.name);

      const result = await documentApi.upload(formData);
      if (result.success) {
        toast.success('Upload thành công');
        setShowUploadDialog(false);
        setUploadFile(null);
        setDocumentName('');
        setSelectedCategory('');
        onRefresh();
      } else {
        toast.error(result.message || 'Upload thất bại');
      }
    } catch (error) {
      toast.error('Lỗi upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (docId) => {
    try {
      const result = await documentApi.verify(docId);
      if (result.is_valid) {
        toast.success('File hợp lệ - Checksum khớp');
      } else {
        toast.error('File không hợp lệ - Checksum không khớp!');
      }
    } catch (error) {
      toast.error('Lỗi kiểm tra file');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-700', icon: Clock },
      verified: { label: 'Đã xác minh', className: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-700', icon: XCircle },
      expired: { label: 'Hết hạn', className: 'bg-gray-100 text-gray-600', icon: AlertTriangle },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.className} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </Badge>
    );
  };

  const getCategoryLabel = (categoryValue) => {
    const cat = categories.find(c => c.value === categoryValue);
    return cat?.label || categoryValue;
  };

  return (
    <div className="space-y-6" data-testid="documents-tab">
      {/* Header with Upload Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#316585]" />
          Tài liệu đính kèm
          <Badge variant="secondary">{documents.length}</Badge>
        </h3>

        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#316585] hover:bg-[#265270]" data-testid="upload-btn">
              <Upload className="w-4 h-4 mr-2" />
              Upload tài liệu
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload tài liệu mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Danh mục *</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="mt-1" data-testid="category-select">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Tên tài liệu</label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Nhập tên tài liệu..."
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Chọn file *</label>
                <div 
                  className="mt-1 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center hover:border-[#316585] cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-6 h-6 text-[#316585]" />
                      <span className="font-medium">{uploadFile.name}</span>
                      <span className="text-sm text-slate-500">({formatFileSize(uploadFile.size)})</span>
                    </div>
                  ) : (
                    <div className="text-slate-500">
                      <Upload className="w-8 h-8 mx-auto mb-2" />
                      <p>Click để chọn file</p>
                      <p className="text-xs">PDF, DOC, DOCX, PNG, JPG</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                  Hủy
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploading || !uploadFile || !selectedCategory}
                  className="bg-[#316585] hover:bg-[#265270]"
                  data-testid="confirm-upload-btn"
                >
                  {uploading ? 'Đang upload...' : 'Upload'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Document Checklist */}
      {contract.required_checklist && contract.required_checklist.length > 0 && (
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#316585]" />
              Danh sách tài liệu bắt buộc
              <Badge variant={contract.checklist_complete ? 'default' : 'destructive'}>
                {contract.checklist_complete ? 'Đã đủ' : 'Chưa đủ'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {contract.required_checklist.map((item, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border ${
                    item.status === 'verified' 
                      ? 'bg-green-50 border-green-200' 
                      : item.status === 'uploaded'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.status === 'verified' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : item.status === 'uploaded' ? (
                      <Clock className="w-4 h-4 text-amber-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                    )}
                    <span className="text-sm font-medium">{item.item_name}</span>
                    {item.is_required && <span className="text-red-500">*</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents by Category */}
      {documents.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="p-12 text-center text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <p>Chưa có tài liệu nào</p>
            <p className="text-sm">Click "Upload tài liệu" để thêm mới</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(documentsByCategory).map(([category, docs]) => {
          const CategoryIcon = CATEGORY_ICONS[category] || Folder;
          return (
            <Card key={category} className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4 text-[#316585]" />
                  {getCategoryLabel(category)}
                  <Badge variant="secondary">{docs.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {docs.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-[#316585]" />
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>{doc.original_filename}</span>
                            <span>{doc.file_size_display || formatFileSize(doc.file_size)}</span>
                            <span className="flex items-center gap-1">
                              <History className="w-3 h-3" />
                              v{doc.version}
                            </span>
                            <span>{formatDate(doc.uploaded_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(doc.document_status)}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVerify(doc.id)}
                          title="Kiểm tra tính toàn vẹn"
                        >
                          <Shield className="w-4 h-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(documentApi.getDownloadUrl(doc.id), '_blank')}
                          title="Tải xuống"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
