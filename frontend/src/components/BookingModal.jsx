/**
 * BOOKING MODAL - PROHOUZING
 * ==========================
 * Modal để đặt lịch xem nhà / tư vấn điện thoại
 * 
 * Features:
 * - Chọn loại: site_visit / phone_call
 * - Chọn time slot: 09:00 / 14:00 / 19:00
 * - Confirm UI
 * - Success screen
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  X, MapPin, Phone, Calendar, Clock, CheckCircle2, 
  Building2, Loader2, ArrowRight, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Booking types
const BOOKING_TYPES = [
  { 
    value: 'site_visit', 
    label: 'Xem nhà trực tiếp',
    icon: MapPin,
    description: 'Đi xem dự án thực tế',
    color: 'from-blue-500 to-cyan-500',
  },
  { 
    value: 'phone_call', 
    label: 'Tư vấn qua điện thoại',
    icon: Phone,
    description: 'Gọi tư vấn chi tiết',
    color: 'from-green-500 to-emerald-500',
  },
];

// Time slots
const TIME_SLOTS = [
  { value: '09:00', label: 'Sáng', time: '09:00', icon: '🌅' },
  { value: '14:00', label: 'Chiều', time: '14:00', icon: '☀️' },
  { value: '19:00', label: 'Tối', time: '19:00', icon: '🌙' },
];

export default function BookingModal({ 
  isOpen, 
  onClose, 
  leadId, 
  dealId, 
  projectName,
  customerName,
  customerPhone,
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Type, 2: Time, 3: Confirm, 4: Success
  const [bookingType, setBookingType] = useState(null);
  const [timeSlot, setTimeSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Fetch available slots
  useEffect(() => {
    if (isOpen && step === 2) {
      fetchTimeSlots();
    }
  }, [isOpen, step]);

  const fetchTimeSlots = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`${API_URL}/api/bookings/time-slots?date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
    }
  };

  const handleSelectType = (type) => {
    setBookingType(type);
    setStep(2);
  };

  const handleSelectTime = (slot) => {
    setTimeSlot(slot);
    setStep(3);
  };

  const handleConfirm = async () => {
    if (!leadId || !bookingType || !timeSlot) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/bookings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          deal_id: dealId,
          project_name: projectName,
          booking_type: bookingType,
          time_slot: timeSlot,
          customer_name: customerName,
          customer_phone: customerPhone,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setBookingResult(data);
        setStep(4);
        toast.success('Đặt lịch thành công!');
        onSuccess?.(data);
      } else {
        throw new Error('Booking failed');
      }
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBookingType(null);
    setTimeSlot(null);
    setBookingResult(null);
    onClose();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-md bg-[#0d1f35] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#316585] to-[#1e4a64] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Đặt lịch hẹn</h4>
              <p className="text-white/70 text-xs">
                {step === 1 && 'Chọn hình thức'}
                {step === 2 && 'Chọn thời gian'}
                {step === 3 && 'Xác nhận'}
                {step === 4 && 'Thành công!'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-[#316585] to-cyan-400 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-white/70 text-sm mb-4">
                Anh/chị muốn tư vấn theo hình thức nào?
              </p>
              
              {BOOKING_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleSelectType(type.value)}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl hover:border-[#316585]/50 hover:bg-white/10 transition-all group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                      <type.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium">{type.label}</h5>
                      <p className="text-white/50 text-sm">{type.description}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/70 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Select Time */}
          {step === 2 && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="text-white/50 text-sm hover:text-white/70 flex items-center gap-1 mb-2"
              >
                ← Quay lại
              </button>
              
              <p className="text-white/70 text-sm mb-4">
                Chọn thời gian phù hợp:
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {TIME_SLOTS.map((slot) => {
                  const slotData = availableSlots.find(s => s.time === slot.value);
                  const available = slotData?.available ?? 10;
                  const isAvailable = available > 0;
                  
                  return (
                    <button
                      key={slot.value}
                      onClick={() => isAvailable && handleSelectTime(slot.value)}
                      disabled={!isAvailable}
                      className={`p-4 rounded-xl border transition-all ${
                        timeSlot === slot.value
                          ? 'bg-[#316585] border-[#316585] text-white'
                          : isAvailable
                          ? 'bg-white/5 border-white/10 hover:border-[#316585]/50 text-white'
                          : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-2xl mb-1">{slot.icon}</div>
                      <div className="font-bold">{slot.time}</div>
                      <div className="text-xs opacity-70">{slot.label}</div>
                      {isAvailable ? (
                        <div className="text-[10px] text-green-400 mt-1">
                          Còn {available} slot
                        </div>
                      ) : (
                        <div className="text-[10px] text-red-400 mt-1">
                          Hết chỗ
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-white/40 text-xs text-center mt-4">
                * Lịch hẹn trong ngày hôm nay
              </p>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="text-white/50 text-sm hover:text-white/70 flex items-center gap-1 mb-2"
              >
                ← Quay lại
              </button>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                <h5 className="text-white font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  Xác nhận thông tin
                </h5>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Hình thức:</span>
                    <span className="text-white font-medium">
                      {bookingType === 'site_visit' ? '📍 Xem nhà trực tiếp' : '📞 Tư vấn điện thoại'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-white/50">Thời gian:</span>
                    <span className="text-white font-medium">
                      🕐 {timeSlot} hôm nay
                    </span>
                  </div>
                  
                  {projectName && (
                    <div className="flex justify-between">
                      <span className="text-white/50">Dự án:</span>
                      <span className="text-white font-medium">
                        🏢 {projectName}
                      </span>
                    </div>
                  )}
                  
                  {customerPhone && (
                    <div className="flex justify-between">
                      <span className="text-white/50">SĐT:</span>
                      <span className="text-white font-medium">
                        {customerPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-yellow-400 text-xs flex items-start gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  Chuyên viên tư vấn sẽ liên hệ trong vòng 15 phút để xác nhận lịch hẹn.
                </p>
              </div>
              
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#316585] to-cyan-600 hover:from-[#3d7a9e] hover:to-cyan-500 py-6 rounded-xl text-base font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Xác nhận đặt lịch
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && bookingResult && (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">
                Đặt lịch thành công! 🎉
              </h3>
              
              <p className="text-white/60 mb-6">
                Chuyên viên <span className="text-[#316585] font-medium">{bookingResult.assigned_name || 'tư vấn'}</span> sẽ liên hệ bạn trong <span className="text-yellow-400 font-bold">5 phút</span>.
              </p>
              
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4 text-[#316585]" />
                    <span>{bookingResult.time_slot} hôm nay</span>
                  </div>
                  {bookingResult.project_name && (
                    <div className="flex items-center gap-2 text-white">
                      <Building2 className="w-4 h-4 text-[#316585]" />
                      <span>{bookingResult.project_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/70">
                    <span className="text-xs">Mã booking: {bookingResult.id.slice(0, 8)}...</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={handleClose}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Đóng
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
