/**
 * DealFormModal - Dynamic Deal Create/Edit Modal
 * Uses DynamicEntityForm for unified form handling
 * Supports Attribute Values Persistence
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { DynamicEntityForm } from '@/components/forms/DynamicEntityForm';
import { dealsAPI } from '@/lib/crmApi';
import { attributesAPI } from '@/api/dynamicFormApi';
import { toast } from 'sonner';

export const DealFormModal = ({
  open,
  onOpenChange,
  deal = null, // null for create, object for edit
  onSuccess,
  leadId = null, // optional: create deal from lead
}) => {
  const [loading, setLoading] = useState(false);
  const mode = deal ? 'edit' : 'create';

  const handleSubmit = async (entityData, attributeValues) => {
    setLoading(true);
    try {
      // Prepare deal data
      const dealData = {
        deal_name: entityData.deal_name,
        current_stage: entityData.current_stage || 'new',
        sales_channel: entityData.sales_channel,
        deal_value: entityData.deal_value || entityData.expected_value ? 
          parseFloat(entityData.deal_value || entityData.expected_value) : null,
        expected_close_date: entityData.expected_close_date,
        probability: entityData.probability ? parseInt(entityData.probability) : null,
        notes: entityData.notes,
      };

      // Add lead_id if creating from lead
      if (mode === 'create' && leadId) {
        dealData.lead_id = leadId;
      }

      // Filter out null/undefined values for create
      if (mode === 'create') {
        Object.keys(dealData).forEach(key => {
          if (dealData[key] === null || dealData[key] === undefined || dealData[key] === '') {
            delete dealData[key];
          }
        });
      }

      let savedEntity;
      if (mode === 'create') {
        const response = await dealsAPI.create(dealData);
        savedEntity = response.data;
        toast.success('Tạo Deal thành công!');
      } else {
        const response = await dealsAPI.update(deal.id, dealData);
        savedEntity = response.data || deal;
        toast.success('Cập nhật Deal thành công!');
      }

      // Save attribute values separately if any
      if (Object.keys(attributeValues).length > 0 && savedEntity?.id) {
        try {
          await attributesAPI.setValues('deal', savedEntity.id, attributeValues);
          console.log('Attribute values saved successfully');
        } catch (attrError) {
          console.error('Error saving attribute values:', attrError);
          toast.warning('Một số custom fields chưa được lưu');
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(e => e.msg || e).join(', ')
        : (typeof detail === 'string' ? detail : 'Không thể lưu deal');
      toast.error(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {mode === 'create' ? 'Tạo Deal Mới' : 'Chỉnh sửa Deal'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Nhập thông tin giao dịch' : 'Cập nhật thông tin deal'}
          </DialogDescription>
        </DialogHeader>
        
        <DynamicEntityForm
          entityType="deal"
          mode={mode}
          entity={deal}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitLabel={mode === 'create' ? 'Tạo Deal' : 'Lưu thay đổi'}
          showHeader={true}
          compact={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DealFormModal;
