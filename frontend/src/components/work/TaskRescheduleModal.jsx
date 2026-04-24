/**
 * Task Reschedule Modal
 */

import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { rescheduleTask } from '../../lib/workApi';

export default function TaskRescheduleModal({ task, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_due_at: '',
    reason: '',
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.new_due_at) {
      toast.error('Vui long chon ngay moi');
      return;
    }
    
    if (!formData.reason.trim()) {
      toast.error('Vui long nhap ly do doi lich');
      return;
    }
    
    try {
      setLoading(true);
      await rescheduleTask(task.id, {
        new_due_at: new Date(formData.new_due_at).toISOString(),
        reason: formData.reason,
      });
      toast.success('Da doi lich task');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Khong the doi lich task');
    } finally {
      setLoading(false);
    }
  };
  
  // Quick date options
  const setQuickDate = (hours) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    const isoString = date.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, new_due_at: isoString }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="reschedule-modal">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Doi lich Task</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Task Info */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="font-medium text-gray-900">{task.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            Han hien tai: {new Date(task.due_at).toLocaleString('vi-VN')}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Quick Options */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Chon nhanh</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(1)}>
                +1 gio
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(4)}>
                +4 gio
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(24)}>
                Ngay mai
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(48)}>
                +2 ngay
              </Button>
            </div>
          </div>
          
          {/* New Date */}
          <div>
            <Label className="text-sm font-medium">
              Han moi <span className="text-red-500">*</span>
            </Label>
            <Input
              type="datetime-local"
              value={formData.new_due_at}
              onChange={(e) => setFormData(prev => ({ ...prev, new_due_at: e.target.value }))}
              data-testid="new-due-at"
            />
          </div>
          
          {/* Reason */}
          <div>
            <Label className="text-sm font-medium">
              Ly do doi lich <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Nhap ly do doi lich..."
              rows={2}
              data-testid="reschedule-reason"
            />
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Huy
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="submit-reschedule"
            >
              {loading ? 'Dang xu ly...' : 'Doi lich'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
