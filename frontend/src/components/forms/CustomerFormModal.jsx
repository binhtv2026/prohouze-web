/**
 * CustomerFormModal - Dynamic Customer Create/Edit Modal
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
import { contactsAPI } from '@/lib/crmApi';
import { attributesAPI } from '@/api/dynamicFormApi';
import { toast } from 'sonner';

export const CustomerFormModal = ({
  open,
  onOpenChange,
  customer = null, // null for create, object for edit
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const mode = customer ? 'edit' : 'create';

  const handleSubmit = async (entityData, attributeValues) => {
    setLoading(true);
    try {
      // Prepare customer data
      const customerData = {
        full_name: entityData.full_name,
        phone: entityData.phone,
        email: entityData.email,
        customer_type: entityData.customer_type || 'individual',
        company_name: entityData.company_name,
        address: entityData.address,
        notes: entityData.notes,
        source: entityData.source,
        date_of_birth: entityData.date_of_birth,
        gender: entityData.gender,
        segment: entityData.segment,
        stage: entityData.stage,
      };

      // Filter out null/undefined values for create
      if (mode === 'create') {
        Object.keys(customerData).forEach(key => {
          if (customerData[key] === null || customerData[key] === undefined || customerData[key] === '') {
            delete customerData[key];
          }
        });
      }

      let savedEntity;
      if (mode === 'create') {
        const response = await contactsAPI.create(customerData);
        savedEntity = response.data;
        toast.success('Tạo Customer thành công!');
      } else {
        const response = await contactsAPI.update(customer.id, customerData);
        savedEntity = response.data || customer;
        toast.success('Cập nhật Customer thành công!');
      }

      // Save attribute values separately if any
      if (Object.keys(attributeValues).length > 0 && savedEntity?.id) {
        try {
          await attributesAPI.setValues('customer', savedEntity.id, attributeValues);
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
        : (typeof detail === 'string' ? detail : 'Không thể lưu customer');
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
            {mode === 'create' ? 'Tạo Khách hàng Mới' : 'Chỉnh sửa Khách hàng'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' ? 'Nhập thông tin khách hàng' : 'Cập nhật thông tin khách hàng'}
          </DialogDescription>
        </DialogHeader>
        
        <DynamicEntityForm
          entityType="customer"
          mode={mode}
          entity={customer}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          submitLabel={mode === 'create' ? 'Tạo Khách hàng' : 'Lưu thay đổi'}
          showHeader={true}
          compact={false}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CustomerFormModal;
