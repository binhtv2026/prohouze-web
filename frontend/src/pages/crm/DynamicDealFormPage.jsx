/**
 * Dynamic Deal Form Page
 * Demonstrates the Dynamic Form Renderer with Deal entity
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DynamicFormRenderer } from '../../components/forms/DynamicFormRenderer';
import { dealsAPI } from '../../lib/crmApi';
import { toast } from 'sonner';
import { ArrowLeft, Zap, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const DynamicDealFormPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [createdDeal, setCreatedDeal] = useState(null);

  // Handle form submission
  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      // Transform form data to API format
      const apiData = {
        deal_name: formData.deal_name,
        current_stage: formData.current_stage || 'new',
        sales_channel: formData.sales_channel,
        deal_value: formData.expected_value,
        expected_close_date: formData.expected_close_date,
      };

      const response = await dealsAPI.create(apiData);
      
      toast.success('Tạo Deal thành công!', {
        description: `Deal "${formData.deal_name}" đã được tạo.`,
      });
      
      setCreatedDeal(response.data);
      
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Lỗi khi tạo Deal', {
        description: error.response?.data?.detail || error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/sales/pipeline');
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
              onClick={() => navigate('/sales/pipeline')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-green-500" />
                Dynamic Deal Form
              </h1>
              <p className="text-gray-500">
                Form được render động từ API /api/v2/forms
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-800">
              <Zap className="h-5 w-5 inline mr-2" />
              Dynamic Form Renderer - Deal
            </CardTitle>
            <CardDescription className="text-green-600">
              Form tạo Deal được xây dựng hoàn toàn từ metadata trong database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="font-medium text-green-800">Entity Type</div>
                <div className="text-green-600">deal</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="font-medium text-green-800">API Endpoint</div>
                <div className="text-green-600 font-mono text-xs">/api/v2/forms/render/deal</div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-100">
                <div className="font-medium text-green-800">Field Types</div>
                <div className="text-green-600">string, select, currency, date</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Form */}
        <DynamicFormRenderer
          entityType="deal"
          formType="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitLabel="Tạo Deal"
        />

        {/* Created Deal Result */}
        {createdDeal && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-green-800">Deal đã tạo thành công!</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-white p-4 rounded-lg text-sm overflow-auto border border-green-100">
                {JSON.stringify(createdDeal, null, 2)}
              </pre>
              <div className="mt-4 flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setCreatedDeal(null)}
                >
                  Tạo Deal mới
                </Button>
                <Button 
                  onClick={() => navigate('/sales/pipeline')}
                >
                  Xem Pipeline
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DynamicDealFormPage;
