/**
 * Dynamic Lead Form Page
 * Demonstrates the Dynamic Form Renderer with Lead entity
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { leadsAPI } from '../../lib/crmApi';
import { toast } from 'sonner';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';

const DynamicLeadFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [createdLead, setCreatedLead] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Transform form data to API format
      const apiData = {
        contact_name: formData.full_name,
        contact_phone: formData.phone,
        contact_email: formData.email,
        source_channel: formData.source_channel,
        intent_level: formData.intent_level,
        lead_status: formData.lead_status || 'new',
        qualification_notes: formData.notes,
      };

      const response = await leadsAPI.create(apiData);
      
      toast.success('Tạo Lead thành công!', {
        description: `Lead ${formData.full_name} đã được tạo.`,
      });
      
      setCreatedLead(response.data);
      
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Lỗi khi tạo Lead', {
        description: error.response?.data?.detail || error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handle quick form submission
  const handleQuickSubmit = async (formData) => {
    setLoading(true);
    try {
      const apiData = {
        contact_name: formData.full_name,
        contact_phone: formData.phone,
        source_channel: formData.source_channel,
        lead_status: 'new',
      };

      const response = await leadsAPI.create(apiData);
      
      toast.success('Tạo nhanh Lead thành công!', {
        description: `Lead ${formData.full_name} đã được tạo.`,
      });
      
      setCreatedLead(response.data);
      
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Lỗi khi tạo Lead', {
        description: error.response?.data?.detail || error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/crm/leads');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/crm/leads')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-500" />
                Dynamic Lead Form
              </h1>
              <p className="text-gray-500">
                Form được render động từ API /api/v2/forms
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-800">Dynamic Form Renderer</CardTitle>
            <CardDescription className="text-blue-600">
              Form này được tạo động từ database, không hardcode. Mọi thay đổi trong Admin sẽ tự động cập nhật UI.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-medium text-blue-800">Entity Type</div>
                <div className="text-blue-600">lead</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-medium text-blue-800">API Endpoint</div>
                <div className="text-blue-600 font-mono text-xs">/api/v2/forms/render/lead</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-medium text-blue-800">Supported Types</div>
                <div className="text-blue-600">string, phone, email, select...</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Form Đầy đủ</TabsTrigger>
            <TabsTrigger value="quick">Form Nhanh</TabsTrigger>
          </TabsList>
          
          <TabsContent value="create" className="mt-4">
            <DynamicFormRenderer
              entityType="lead"
              formType="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              loading={loading}
              submitLabel="Tạo Lead"
            />
          </TabsContent>
          
          <TabsContent value="quick" className="mt-4">
            <DynamicFormRenderer
              entityType="lead"
              formType="quick"
              onSubmit={handleQuickSubmit}
              onCancel={handleCancel}
              loading={loading}
              submitLabel="Tạo nhanh"
              compact
            />
          </TabsContent>
        </Tabs>

        {/* Created Lead Result */}
        {createdLead && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-800">Lead đã tạo thành công!</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-white p-4 rounded-lg text-sm overflow-auto border border-green-100">
                {JSON.stringify(createdLead, null, 2)}
              </pre>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCreatedLead(null)}
                >
                  Tạo Lead mới
                </Button>
                <Button 
                  onClick={() => navigate('/crm/leads')}
                >
                  Xem danh sách Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DynamicLeadFormPage;
