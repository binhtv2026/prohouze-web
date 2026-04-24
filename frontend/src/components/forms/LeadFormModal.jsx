/**
 * LeadFormModal - Dynamic Lead Create/Edit Modal
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
import { crmLeadsAPI } from '@/lib/crmApi';
import { attributesAPI } from '@/api/dynamicFormApi';
import { toast } from 'sonner';

export const LeadFormModal = ({
  open,
  onOpenChange,
  lead = null, // null for create, object for edit
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const mode = lead ? 'edit' : 'create';

  const handleSubmit = async (entityData, attributeValues) => {
    setLoading(true);
    try {
      // Prepare lead data - map form fields to API v2 fields
      const leadData = {
        contact_name: entityData.full_name || entityData.contact_name,
        contact_phone: entityData.phone || entityData.contact_phone,
        contact_email: entityData.email || entityData.contact_email,
        source_channel: entityData.source_channel || entityData.source || 'website',
        lead_status: entityData.lead_status || entityData.stage || 'new',
        intent_level: entityData.intent_level,
        qualification_notes: entityData.notes || entityData.qualification_notes,
        project_interest: entityData.project_interest,
        budget_min: entityData.budget_min ? parseFloat(entityData.budget_min) : null,
        budget_max: entityData.budget_max ? parseFloat(entityData.budget_max) : null,
      };

      // Filter out null/undefined values for create
      if (mode === 'create') {
        Object.keys(leadData).forEach(key => {
          if (leadData[key] === null || leadData[key] === undefined || leadData[key] === '') {
            delete leadData[key];
          }
        });
      }

      let savedEntity;
      if (mode === 'create') {
        const response = await crmLeadsAPI.create(leadData);
        savedEntity = response.data;
        toast.success('Tạo Lead thành công!');
      } else {
        const response = await crmLeadsAPI.update(lead.id, leadData);
        savedEntity = response.data || lead;
        toast.success('Cập nhật Lead thành công!');
      }

      // Save attribute values separately if any
      if (Object.keys(attributeValues).length > 0 && savedEntity?.id) {
        try {
          await attributesAPI.setValues('lead', savedEntity.id, attributeValues);
          console.log('Attribute values saved successfully');
        } catch (attrError) {
          console.error('Error saving attribute values:', attrError);
          // Don't fail the whole operation, just warn
          toast.warning('Một số custom fields chưa được lưu');
        }
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail) 
        ? detail.map(e => e.msg || e).join(', ')
        : (typeof detail === 'string' ? detail : 'Không thể lưu lead');
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
            {mode === 'create' ? 'Tạo Lead Mới' : 'Chỉnh sửa Lead'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Nhập thông tin khách hàng tiềm năng' : 'Cập nhật thông tin lead'}
          </DialogDescription>
        </DialogHeader>
        
        <DynamicEntityForm
          entityType="lead"
          mode={mode}
          entity={lead}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitLabel={mode === 'create' ? 'Tạo Lead' : 'Lưu thay đổi'}
          showHeader={true}
          compact={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default LeadFormModal;
