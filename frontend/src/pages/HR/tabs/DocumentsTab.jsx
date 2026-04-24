/**
 * Documents Tab - Tài liệu hồ sơ (với version control)
 */

import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, CheckCircle, Clock, Trash2, Eye, History, Plus, X, AlertCircle } from 'lucide-react';
import { hrApi } from '../../../api/hrApi';
import { toast } from 'sonner';

const DOCUMENT_CATEGORIES = [
  { value: 'id_card', label: 'CCCD/CMND', required: true },
  { value: 'passport', label: 'Hộ chiếu', required: false },
  { value: 'household', label: 'Hộ khẩu', required: false },
  { value: 'cv', label: 'Sơ yếu lý lịch', required: true },
  { value: 'contract', label: 'Hợp đồng', required: true },
  { value: 'certificate', label: 'Bằng cấp/Chứng chỉ', required: false },
  { value: 'health_check', label: 'Giấy khám sức khỏe', required: false },
  { value: 'photo', label: 'Ảnh', required: true },
  { value: 'nda', label: 'Cam kết bảo mật', required: false },
  { value: 'other', label: 'Khác', required: false },
];

export default function DocumentsTab({ profileId, documents, onRefresh }) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const fileInputRef = useRef(null);
  
  const [uploadData, setUploadData] = useState({
    name: '',
    category: '',
    description: '',
    issue_date: '',
    expiry_date: '',
    notes: '',
    file: null,
  });

  const resetUpload = () => {
    setUploadData({
      name: '', category: '', description: '',
      issue_date: '', expiry_date: '', notes: '', file: null,
    });
    setShowUpload(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File quá lớn (tối đa 10MB)');
        return;
      }
      setUploadData({ ...uploadData, file, name: uploadData.name || file.name });
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.category || !uploadData.name) {
      toast.error('Vui lòng chọn file, danh mục và đặt tên');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('name', uploadData.name);
      formData.append('category', uploadData.category);
      if (uploadData.description) formData.append('description', uploadData.description);
      if (uploadData.issue_date) formData.append('issue_date', uploadData.issue_date);
      if (uploadData.expiry_date) formData.append('expiry_date', uploadData.expiry_date);
      if (uploadData.notes) formData.append('notes', uploadData.notes);

      await hrApi.uploadDocument(profileId, formData);
      toast.success('Upload thành công');
      resetUpload();
      onRefresh();
    } catch (error) {
      toast.error('Upload thất bại: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async (docId) => {
    try {
      await hrApi.verifyDocument(docId);
      toast.success('Đã xác minh');
      onRefresh();
    } catch (error) {
      toast.error('Xác minh thất bại');
    }
  };

  const loadVersions = async (category) => {
    try {
      const data = await hrApi.getDocumentVersions(profileId, category);
      setVersions(data);
      setSelectedCategory(category);
      setShowVersions(true);
    } catch (error) {
      toast.error('Không thể tải lịch sử phiên bản');
    }
  };

  // Group documents by category
  const docsByCategory = DOCUMENT_CATEGORIES.map(cat => ({
    ...cat,
    docs: documents?.filter(d => d.category === cat.value) || [],
    latestDoc: documents?.find(d => d.category === cat.value && d.is_latest),
  }));

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div data-testid="documents-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText size={20} className="text-cyan-400" />
          Tài liệu hồ sơ
        </h3>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
          data-testid="upload-document-btn"
        >
          <Upload size={16} />
          Upload tài liệu
        </button>
      </div>

      {/* Upload Form */}
      {showUpload && (
        <div className="bg-gray-800/50 rounded-xl p-6 mb-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">Upload tài liệu mới</h4>
            <button onClick={resetUpload} className="text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Danh mục *</label>
              <select
                value={uploadData.category}
                onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              >
                <option value="">-- Chọn danh mục --</option>
                {DOCUMENT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tên tài liệu *</label>
              <input
                type="text"
                value={uploadData.name}
                onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                placeholder="CCCD mặt trước"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Chọn file *</label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-cyan-500 file:text-black file:font-medium file:cursor-pointer"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày cấp</label>
              <input
                type="date"
                value={uploadData.issue_date}
                onChange={(e) => setUploadData({ ...uploadData, issue_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Ngày hết hạn</label>
              <input
                type="date"
                value={uploadData.expiry_date}
                onChange={(e) => setUploadData({ ...uploadData, expiry_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Mô tả</label>
              <input
                type="text"
                value={uploadData.description}
                onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
          
          {uploadData.file && (
            <div className="mt-4 p-3 bg-gray-800 rounded-lg flex items-center gap-3">
              <FileText className="text-cyan-400" size={20} />
              <span className="text-white">{uploadData.file.name}</span>
              <span className="text-gray-400 text-sm">({formatFileSize(uploadData.file.size)})</span>
            </div>
          )}
          
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={resetUpload} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg">
              Hủy
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  Đang upload...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#12121a] border border-gray-800 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium flex items-center gap-2">
                <History size={20} className="text-cyan-400" />
                Lịch sử phiên bản - {DOCUMENT_CATEGORIES.find(c => c.value === selectedCategory)?.label}
              </h4>
              <button onClick={() => setShowVersions(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-3">
              {versions.map((ver, idx) => (
                <div
                  key={ver.id}
                  className={`p-4 rounded-lg border ${ver.is_latest ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-gray-800/50 border-gray-800'}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">v{ver.version}</span>
                        {ver.is_latest && (
                          <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs rounded-lg">Hiện tại</span>
                        )}
                        {ver.is_verified && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-lg">
                            <CheckCircle size={12} />
                            Đã xác minh
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        {ver.file_name} ({formatFileSize(ver.file_size)})
                      </div>
                      <div className="text-gray-500 text-xs mt-1">
                        Upload: {new Date(ver.uploaded_at).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <a
                      href={`${process.env.REACT_APP_BACKEND_URL}/api/hr/documents/download/${ver.file_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-gray-700 rounded-lg"
                      title="Tải xuống"
                    >
                      <Download size={16} className="text-gray-400" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {docsByCategory.map((cat) => {
          const hasDoc = cat.latestDoc;
          const isExpired = hasDoc?.expiry_date && new Date(hasDoc.expiry_date) < new Date();
          
          return (
            <div
              key={cat.value}
              className={`bg-gray-800/30 border rounded-xl p-4 transition-colors ${
                !hasDoc && cat.required
                  ? 'border-red-500/30 hover:border-red-500/50'
                  : isExpired
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : hasDoc
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className={
                    !hasDoc && cat.required ? 'text-red-400' :
                    isExpired ? 'text-amber-400' :
                    hasDoc ? 'text-emerald-400' : 'text-gray-500'
                  } size={20} />
                  <span className="text-white font-medium">{cat.label}</span>
                  {cat.required && (
                    <span className="text-red-400 text-xs">*</span>
                  )}
                </div>
                {hasDoc && (
                  <button
                    onClick={() => loadVersions(cat.value)}
                    className="text-gray-400 hover:text-cyan-400 text-xs flex items-center gap-1"
                  >
                    <History size={14} />
                    v{hasDoc.version}
                  </button>
                )}
              </div>
              
              {hasDoc ? (
                <div>
                  <div className="text-gray-400 text-sm truncate">{hasDoc.name}</div>
                  <div className="text-gray-500 text-xs mt-1">{formatFileSize(hasDoc.file_size)}</div>
                  
                  {isExpired && (
                    <div className="flex items-center gap-1 mt-2 text-amber-400 text-xs">
                      <AlertCircle size={12} />
                      Hết hạn: {new Date(hasDoc.expiry_date).toLocaleDateString('vi-VN')}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <a
                      href={`${process.env.REACT_APP_BACKEND_URL}/api/hr/documents/download/${hasDoc.file_name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg"
                    >
                      <Download size={14} />
                      Tải xuống
                    </a>
                    {!hasDoc.is_verified && (
                      <button
                        onClick={() => handleVerify(hasDoc.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs rounded-lg"
                      >
                        <CheckCircle size={14} />
                        Xác minh
                      </button>
                    )}
                    {hasDoc.is_verified && (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <CheckCircle size={14} />
                        Đã xác minh
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-2">Chưa có tài liệu</p>
                  <button
                    onClick={() => {
                      setUploadData({ ...uploadData, category: cat.value });
                      setShowUpload(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1 mx-auto"
                  >
                    <Plus size={14} />
                    Upload
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
