/**
 * Create Task Modal
 */

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
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
import { createTask, getTaskTypes, getTaskPriorities, getEntityTypes } from '../../lib/workApi';

export default function CreateTaskModal({ onClose, onSuccess, defaultEntity = null }) {
  const [taskTypes, setTaskTypes] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [entityTypes, setEntityTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    task_type: '',
    title: '',
    description: '',
    priority: 'medium',
    due_at: '',
    related_entity_type: defaultEntity?.type || '',
    related_entity_id: defaultEntity?.id || '',
    owner_id: 'user-001', // TODO: Get from auth
  });
  
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [types, pris, entities] = await Promise.all([
          getTaskTypes(),
          getTaskPriorities(),
          getEntityTypes()
        ]);
        setTaskTypes(types);
        setPriorities(pris);
        setEntityTypes(entities);
      } catch (err) {
        console.error(err);
      }
    };
    loadConfig();
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Vui long nhap tieu de');
      return;
    }
    
    if (!formData.due_at) {
      toast.error('Vui long chon han hoan thanh');
      return;
    }
    
    if (!formData.related_entity_type || !formData.related_entity_id) {
      toast.error('Vui long chon entity lien quan');
      return;
    }
    
    try {
      setLoading(true);
      await createTask({
        ...formData,
        due_at: new Date(formData.due_at).toISOString(),
      });
      toast.success('Da tao task moi');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Khong the tao task');
    } finally {
      setLoading(false);
    }
  };
  
  // Quick date options
  const setQuickDate = (hours) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    const isoString = date.toISOString().slice(0, 16);
    setFormData(prev => ({ ...prev, due_at: isoString }));
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" data-testid="create-task-modal">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Tao Task Moi</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Task Type */}
          <div>
            <Label className="text-sm font-medium">Loai task</Label>
            <Select
              value={formData.task_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, task_type: value }))}
            >
              <SelectTrigger data-testid="task-type-select">
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
          
          {/* Title */}
          <div>
            <Label className="text-sm font-medium">
              Tieu de <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nhap tieu de task"
              data-testid="task-title"
            />
          </div>
          
          {/* Description */}
          <div>
            <Label className="text-sm font-medium">Mo ta</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mo ta chi tiet (tuy chon)"
              rows={2}
              data-testid="task-description"
            />
          </div>
          
          {/* Priority */}
          <div>
            <Label className="text-sm font-medium">Do uu tien</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
            >
              <SelectTrigger data-testid="priority-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((pri) => (
                  <SelectItem key={pri.code} value={pri.code}>
                    {pri.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Due Date */}
          <div>
            <Label className="text-sm font-medium">
              Han hoan thanh <span className="text-red-500">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(1)}>
                +1 gio
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(4)}>
                +4 gio
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setQuickDate(24)}>
                Ngay mai
              </Button>
            </div>
            <Input
              type="datetime-local"
              value={formData.due_at}
              onChange={(e) => setFormData(prev => ({ ...prev, due_at: e.target.value }))}
              data-testid="task-due-at"
            />
          </div>
          
          {/* Entity Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-medium">
                Loai entity <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.related_entity_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, related_entity_type: value }))}
              >
                <SelectTrigger data-testid="entity-type-select">
                  <SelectValue placeholder="Chon loai" />
                </SelectTrigger>
                <SelectContent>
                  {entityTypes.map((ent) => (
                    <SelectItem key={ent.code} value={ent.code}>
                      {ent.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">
                Entity ID <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.related_entity_id}
                onChange={(e) => setFormData(prev => ({ ...prev, related_entity_id: e.target.value }))}
                placeholder="ID entity"
                data-testid="entity-id"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Huy
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="submit-create-task"
            >
              {loading ? 'Dang tao...' : 'Tao task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
