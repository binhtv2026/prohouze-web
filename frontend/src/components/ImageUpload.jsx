import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Chọn ảnh hoặc nhập URL",
  accept = "image/*",
  maxSize = 10, // MB
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [useUrl, setUseUrl] = useState(!value || value.startsWith('http'));
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File quá lớn. Tối đa ${maxSize}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/upload/image`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');

      const data = await res.json();
      const fullUrl = `${API_URL}${data.url}`;
      onChange(fullUrl);
      setUrlInput(fullUrl);
      toast.success('Tải ảnh lên thành công');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setUrlInput(url);
    onChange(url);
  };

  const handleRemove = () => {
    onChange('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Toggle between upload and URL */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant={!useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(false)}
          className={!useUrl ? 'bg-[#316585]' : ''}
        >
          <Upload className="w-4 h-4 mr-1" />
          Upload
        </Button>
        <Button
          type="button"
          variant={useUrl ? 'default' : 'outline'}
          size="sm"
          onClick={() => setUseUrl(true)}
          className={useUrl ? 'bg-[#316585]' : ''}
        >
          <LinkIcon className="w-4 h-4 mr-1" />
          URL
        </Button>
      </div>

      {useUrl ? (
        /* URL Input */
        <Input
          value={urlInput}
          onChange={handleUrlChange}
          placeholder="https://example.com/image.jpg"
        />
      ) : (
        /* File Upload */
        <div 
          className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-[#316585]/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <div className="py-4">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#316585]" />
              <p className="text-sm text-slate-500 mt-2">Đang tải lên...</p>
            </div>
          ) : (
            <div className="py-4">
              <Upload className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm text-slate-500 mt-2">{placeholder}</p>
              <p className="text-xs text-slate-400 mt-1">Tối đa {maxSize}MB</p>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative inline-block">
          <img 
            src={value} 
            alt="Preview" 
            className="h-32 object-cover rounded-lg border"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
