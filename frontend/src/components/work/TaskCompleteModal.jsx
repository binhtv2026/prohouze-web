/**
 * Task Complete Modal
 * Requires outcome and notes for task completion
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { toast } from 'sonner';
import { completeTask, getTaskOutcomes, getTaskTypes } from '../../lib/workApi';

export default function TaskCompleteModal({ task, onClose, onSuccess }) {
  const [outcomes, setOutcomes] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    outcome: '',
    outcome_notes: '',
    create_next_task: false,
    next_task_type: '',
    next_task_title: '',
    next_task_due_at: '',
  });
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [outcomesData, typesData] = await Promise.all([
          getTaskOutcomes(),
          getTaskTypes()
        ]);
        setOutcomes(outcomesData);
        setTaskTypes(typesData);
      } catch (err) {
        console.error(err);
      }
    };
    loadConfig();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.outcome) {
      toast.error('Vui long chon ket qua');
      return;
    }
    
    if (!formData.outcome_notes.trim()) {
      toast.error('Vui long ghi chu ket qua');
      return;
    }
    
    try {
      setLoading(true);
      await completeTask(task.id, {
        outcome: formData.outcome,
        outcome_notes: formData.outcome_notes,
        create_next_task: formData.create_next_task,
        next_task_type: formData.next_task_type || undefined,
        next_task_title: formData.next_task_title || undefined,
        next_task_due_at: formData.next_task_due_at || undefined,
      });
      toast.success('Da hoan thanh task');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Khong the hoan thanh task');
    } finally {
      setLoading(false);
    }
  };
  
  const selectedOutcome = outcomes.find(o => o.code === formData.outcome);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="complete-modal">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Hoan thanh Task</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Task Info */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="font-medium text-gray-900">{task.title}</p>
          <p className="text-sm text-gray-500 mt-1">
            {task.code} | {task.task_type_label}
          </p>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Outcome Select */}
          <div>
            <Label className="text-sm font-medium">
              Ket qua <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData(prev => ({ ...prev, outcome: value }))}
            >
              <SelectTrigger data-testid="outcome-select">
                <SelectValue placeholder="Chon ket qua" />
              </SelectTrigger>
              <SelectContent>
                {outcomes.map((outcome) => (
                  <SelectItem key={outcome.code} value={outcome.code}>
                    <div className="flex items-center gap-2">
                      <span 
                        className={`w-2 h-2 rounded-full bg-${outcome.color}-500`}
                      />
                      {outcome.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Outcome Notes */}
          <div>
            <Label className="text-sm font-medium">
              Ghi chu ket qua <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.outcome_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, outcome_notes: e.target.value }))}
              placeholder="Nhap chi tiet ket qua..."
              rows={3}
              data-testid="outcome-notes"
            />
            <p className="text-xs text-gray-400 mt-1">
              Bat buoc ghi nhan ket qua de theo doi hieu qua
            </p>
          </div>
          
          {/* Next Task Section */}
          <div className="pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.create_next_task}
                onChange={(e) => setFormData(prev => ({ ...prev, create_next_task: e.target.checked }))}
                className="rounded border-gray-300"
                data-testid="create-next-checkbox"
              />
              <span className="text-sm font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Tao task tiep theo
              </span>
            </label>
            
            {formData.create_next_task && (
              <div className="mt-3 pl-6 space-y-3">
                <div>
                  <Label className="text-sm">Loai task</Label>
                  <Select
                    value={formData.next_task_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, next_task_type: value }))}
                  >
                    <SelectTrigger data-testid="next-task-type">
                      <SelectValue placeholder="Chon loai task" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map((type) => (
                        <SelectItem key={type.code} value={type.code}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-sm">Tieu de</Label>
                  <Input
                    value={formData.next_task_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_task_title: e.target.value }))}
                    placeholder="Nhap tieu de task moi"
                    data-testid="next-task-title"
                  />
                </div>
                
                <div>
                  <Label className="text-sm">Han hoan thanh</Label>
                  <Input
                    type="datetime-local"
                    value={formData.next_task_due_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_task_due_at: e.target.value }))}
                    data-testid="next-task-due"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Warning if next action required */}
          {selectedOutcome?.next_action_required && !formData.create_next_task && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm text-yellow-800">
              Ket qua "{selectedOutcome.label}" thuong can tao task tiep theo
            </div>
          )}
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Huy
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
              data-testid="submit-complete"
            >
              {loading ? 'Dang xu ly...' : 'Hoan thanh'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
