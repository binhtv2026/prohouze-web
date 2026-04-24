import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DEMO_EMAIL_TEMPLATES = [
  { id: 'template-1', name: 'Gửi bảng giá dự án', type: 'operation', subject_template: 'Bảng giá mới nhất cho {{project_name}}', body_template: '<p>Xin chào {{name}}, đây là bảng giá mới nhất của dự án {{project_name}}.</p>', variables: ['name', 'project_name'], enable_ai_personalization: true, requires_approval: false },
  { id: 'template-2', name: 'Chăm sóc lead nóng', type: 'marketing', subject_template: 'Thông tin ưu đãi dành riêng cho {{name}}', body_template: '<p>Chào {{name}}, ProHouze gửi anh/chị chính sách đặc biệt của dự án.</p>', variables: ['name'], enable_ai_personalization: true, requires_approval: true },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'operation',
    subject_template: '',
    body_template: '',
    variables: [],
    enable_ai_personalization: true,
    requires_approval: false
  });

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/email/templates`);
      const data = await res.json();
      setTemplates(Array.isArray(data) && data.length > 0 ? data : DEMO_EMAIL_TEMPLATES);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setTemplates(DEMO_EMAIL_TEMPLATES);
      toast.error('Không thể tải danh sách templates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createTemplate = async () => {
    try {
      const res = await fetch(`${API_URL}/api/email/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: formData.variables.split(',').map(v => v.trim()).filter(v => v)
        })
      });
      
      if (res.ok) {
        toast.success('Tạo template thành công');
        setShowCreateDialog(false);
        resetForm();
        fetchTemplates();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Lỗi tạo template');
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('Lỗi hệ thống');
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa template này?')) return;
    
    try {
      const res = await fetch(`${API_URL}/api/email/templates/${id}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success('Đã xóa template');
        fetchTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Lỗi xóa template');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'operation',
      subject_template: '',
      body_template: '',
      variables: [],
      enable_ai_personalization: true,
      requires_approval: false
    });
  };

  const getTypeBadge = (type) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      operation: 'bg-green-100 text-green-800',
      marketing: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="email-templates-page">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="text-gray-500">Quản lý mẫu email với AI personalization</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="create-template-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tạo Template
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow" data-testid={`template-card-${template.id}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge className={getTypeBadge(template.type)}>
                  {template.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Subject:</p>
                  <p className="text-sm font-medium truncate">{template.subject_template}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {template.enable_ai_personalization && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </Badge>
                  )}
                  {template.requires_approval && (
                    <Badge variant="outline">Cần duyệt</Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowPreviewDialog(true);
                    }}
                    data-testid={`preview-btn-${template.id}`}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Xem
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700"
                    data-testid={`delete-btn-${template.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {templates.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có template nào</p>
            <Button variant="link" onClick={() => setShowCreateDialog(true)}>
              Tạo template đầu tiên
            </Button>
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo Email Template</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tên template</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Welcome Email"
                  data-testid="template-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({...formData, type: v})}
                >
                  <SelectTrigger data-testid="template-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="operation">Operation</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Template</Label>
              <Input
                value={formData.subject_template}
                onChange={(e) => setFormData({...formData, subject_template: e.target.value})}
                placeholder="Chào mừng {{name}} đến với ProHouze!"
                data-testid="template-subject-input"
              />
              <p className="text-xs text-gray-500">Sử dụng {'{{variable}}'} cho biến động</p>
            </div>

            <div className="space-y-2">
              <Label>Body Template (HTML)</Label>
              <Textarea
                value={formData.body_template}
                onChange={(e) => setFormData({...formData, body_template: e.target.value})}
                placeholder="<h1>Xin chào {{name}}!</h1><p>Cảm ơn bạn...</p>"
                rows={8}
                data-testid="template-body-input"
              />
            </div>

            <div className="space-y-2">
              <Label>Variables (phân cách bởi dấu phẩy)</Label>
              <Input
                value={formData.variables}
                onChange={(e) => setFormData({...formData, variables: e.target.value})}
                placeholder="name, email, content"
                data-testid="template-variables-input"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_ai_personalization}
                  onChange={(e) => setFormData({...formData, enable_ai_personalization: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">AI Personalization</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_approval}
                  onChange={(e) => setFormData({...formData, requires_approval: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm">Yêu cầu duyệt</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={createTemplate} data-testid="save-template-btn">
              Tạo Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Subject:</p>
                <p className="font-medium">{selectedTemplate.subject_template}</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-gray-500 mb-2">Body Preview:</p>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.body_template }}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{selectedTemplate.type}</Badge>
                {selectedTemplate.enable_ai_personalization && (
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI Enabled
                  </Badge>
                )}
                {selectedTemplate.variables?.map(v => (
                  <Badge key={v} variant="secondary">{`{{${v}}}`}</Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
