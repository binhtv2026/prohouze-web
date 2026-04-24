/**
 * Personal Info Tab - Thông tin cá nhân
 */

import React, { useState } from 'react';
import { Edit, Save, X, User, Phone, Mail, MapPin, CreditCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'single', label: 'Độc thân' },
  { value: 'married', label: 'Đã kết hôn' },
  { value: 'divorced', label: 'Ly hôn' },
  { value: 'widowed', label: 'Góa' },
];

export default function PersonalInfoTab({ profile, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile.full_name || '',
    date_of_birth: profile.date_of_birth || '',
    gender: profile.gender || '',
    marital_status: profile.marital_status || '',
    id_number: profile.id_number || '',
    id_issue_date: profile.id_issue_date || '',
    id_issue_place: profile.id_issue_place || '',
    passport_number: profile.passport_number || '',
    passport_expiry: profile.passport_expiry || '',
    tax_code: profile.tax_code || '',
    social_insurance_number: profile.social_insurance_number || '',
    phone: profile.phone || '',
    phone_secondary: profile.phone_secondary || '',
    email_personal: profile.email_personal || '',
    permanent_address: profile.permanent_address || '',
    current_address: profile.current_address || '',
    hometown: profile.hometown || '',
    nationality: profile.nationality || 'Việt Nam',
    ethnicity: profile.ethnicity || 'Kinh',
    religion: profile.religion || '',
    bank_account: profile.bank_account || '',
    bank_name: profile.bank_name || '',
    bank_branch: profile.bank_branch || '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile.full_name || '',
      date_of_birth: profile.date_of_birth || '',
      gender: profile.gender || '',
      marital_status: profile.marital_status || '',
      id_number: profile.id_number || '',
      id_issue_date: profile.id_issue_date || '',
      id_issue_place: profile.id_issue_place || '',
      passport_number: profile.passport_number || '',
      passport_expiry: profile.passport_expiry || '',
      tax_code: profile.tax_code || '',
      social_insurance_number: profile.social_insurance_number || '',
      phone: profile.phone || '',
      phone_secondary: profile.phone_secondary || '',
      email_personal: profile.email_personal || '',
      permanent_address: profile.permanent_address || '',
      current_address: profile.current_address || '',
      hometown: profile.hometown || '',
      nationality: profile.nationality || 'Việt Nam',
      ethnicity: profile.ethnicity || 'Kinh',
      religion: profile.religion || '',
      bank_account: profile.bank_account || '',
      bank_name: profile.bank_name || '',
      bank_branch: profile.bank_branch || '',
    });
    setIsEditing(false);
  };

  const InputField = ({ label, name, type = 'text', placeholder, icon: Icon }) => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      {isEditing ? (
        <div className="relative">
          {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />}
          <input
            type={type}
            name={name}
            value={formData[name]}
            onChange={handleChange}
            placeholder={placeholder}
            className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500`}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 text-white">
          {Icon && <Icon size={16} className="text-gray-500" />}
          {formData[name] || <span className="text-gray-500 italic">Chưa có</span>}
        </div>
      )}
    </div>
  );

  const SelectField = ({ label, name, options }) => (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>
      {isEditing ? (
        <select
          name={name}
          value={formData[name]}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
        >
          <option value="">-- Chọn --</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <div className="text-white">
          {options.find(o => o.value === formData[name])?.label || <span className="text-gray-500 italic">Chưa có</span>}
        </div>
      )}
    </div>
  );

  return (
    <div data-testid="personal-info-tab">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <User size={20} className="text-cyan-400" />
          Thông tin cá nhân
        </h3>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <X size={16} />
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-medium rounded-lg transition-colors"
            >
              <Save size={16} />
              Lưu
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            data-testid="edit-personal-info-btn"
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>
        )}
      </div>

      {/* Form Sections */}
      <div className="space-y-8">
        {/* Basic Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800">
            Thông tin cơ bản
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="Họ và tên" name="full_name" icon={User} />
            <InputField label="Ngày sinh" name="date_of_birth" type="date" icon={Calendar} />
            <SelectField label="Giới tính" name="gender" options={GENDER_OPTIONS} />
            <SelectField label="Tình trạng hôn nhân" name="marital_status" options={MARITAL_STATUS_OPTIONS} />
            <InputField label="Quê quán" name="hometown" icon={MapPin} />
            <InputField label="Quốc tịch" name="nationality" />
            <InputField label="Dân tộc" name="ethnicity" />
            <InputField label="Tôn giáo" name="religion" />
          </div>
        </div>

        {/* ID Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800">
            Giấy tờ tùy thân
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="CCCD/CMND" name="id_number" icon={CreditCard} />
            <InputField label="Ngày cấp" name="id_issue_date" type="date" />
            <InputField label="Nơi cấp" name="id_issue_place" />
            <InputField label="Số hộ chiếu" name="passport_number" />
            <InputField label="Hộ chiếu hết hạn" name="passport_expiry" type="date" />
            <InputField label="Mã số thuế" name="tax_code" />
            <InputField label="Số BHXH" name="social_insurance_number" />
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800">
            Liên hệ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="Số điện thoại" name="phone" icon={Phone} />
            <InputField label="SĐT phụ" name="phone_secondary" icon={Phone} />
            <InputField label="Email cá nhân" name="email_personal" type="email" icon={Mail} />
          </div>
        </div>

        {/* Address */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800">
            Địa chỉ
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Địa chỉ thường trú" name="permanent_address" icon={MapPin} />
            <InputField label="Địa chỉ tạm trú" name="current_address" icon={MapPin} />
          </div>
        </div>

        {/* Bank Info */}
        <div>
          <h4 className="text-sm font-medium text-gray-400 mb-4 pb-2 border-b border-gray-800">
            Thông tin ngân hàng
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <InputField label="Số tài khoản" name="bank_account" icon={CreditCard} />
            <InputField label="Ngân hàng" name="bank_name" />
            <InputField label="Chi nhánh" name="bank_branch" />
          </div>
        </div>
      </div>
    </div>
  );
}
