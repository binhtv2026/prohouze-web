/**
 * MobileCalendarPage.jsx — Lịch hẹn & Công việc hôm nay (Mobile)
 * API: getTasks, getDailyWorkboard from workApi
 * Route: /work/calendar
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Calendar, Clock, CheckCircle2, AlertCircle,
  Phone, Users, FileText, Plus, ChevronRight, Circle,
} from 'lucide-react';
import { getTasks, getDailyWorkboard, completeTask } from '@/lib/workApi';
import { toast } from 'sonner';

const PRIORITY_COLOR = {
  urgent:   'border-l-red-500    bg-red-50',
  high:     'border-l-amber-500  bg-amber-50',
  normal:   'border-l-blue-400   bg-blue-50',
  medium:   'border-l-blue-400   bg-blue-50',
  low:      'border-l-slate-300  bg-slate-50',
};

const TYPE_ICON = {
  call:     Phone,
  meeting:  Users,
  follow:   ChevronRight,
  document: FileText,
  default:  Circle,
};

const DAYS_VN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS_VN = ['Th1','Th2','Th3','Th4','Th5','Th6','Th7','Th8','Th9','Th10','Th11','Th12'];

function TaskCard({ task, onComplete }) {
  const Icon = TYPE_ICON[task.task_type] || TYPE_ICON.default;
  const priorityClass = PRIORITY_COLOR[task.priority] || PRIORITY_COLOR.normal;
  const done = task.status === 'completed' || task.status === 'done';
  const time = task.scheduled_time || task.due_time
    ? new Date(task.scheduled_time || task.due_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={`bg-white rounded-2xl border-l-4 shadow-sm px-4 py-3 flex items-start gap-3 ${priorityClass} ${done ? 'opacity-50' : ''}`}>
      <div className="w-8 h-8 rounded-xl bg-white/80 flex items-center justify-center mt-0.5 flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold text-slate-800 leading-tight ${done ? 'line-through' : ''}`}>
          {task.title || task.name || 'Công việc'}
        </p>
        {task.description && (
          <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {time && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <Clock className="w-3 h-3" />{time}
            </span>
          )}
          {task.contact_name && (
            <span className="text-[10px] text-slate-400">{task.contact_name}</span>
          )}
        </div>
      </div>
      {!done && (
        <button
          onClick={() => onComplete(task.id)}
          className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center active:scale-90 flex-shrink-0"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        </button>
      )}
    </div>
  );
}

export default function MobileCalendarPage() {
  const navigate = useNavigate();
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [today]               = useState(new Date());
  const [summary, setSummary] = useState({ total: 0, done: 0, overdue: 0 });

  useEffect(() => {
    (async () => {
      try {
        const todayStr = today.toISOString().split('T')[0];
        const [tasksRes, boardRes] = await Promise.allSettled([
          getTasks({ due_date: todayStr, limit: 50 }),
          getDailyWorkboard(null, todayStr),
        ]);
        const list = tasksRes.status === 'fulfilled'
          ? (tasksRes.value?.data?.data || tasksRes.value?.data || tasksRes.value || [])
          : [];
        const arr = Array.isArray(list) ? list : [];
        setTasks(arr);
        setSummary({
          total:  arr.length,
          done:   arr.filter(t => t.status === 'completed' || t.status === 'done').length,
          overdue: arr.filter(t => t.priority === 'urgent').length,
        });
      } catch {
        toast.error('Không tải được lịch làm việc');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = async (id) => {
    try {
      await completeTask(id, { outcome: 'done' });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'completed' } : t));
      setSummary(s => ({ ...s, done: s.done + 1 }));
      toast.success('Đã hoàn thành!');
    } catch { toast.error('Không thể cập nhật'); }
  };

  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
  const done    = tasks.filter(t => t.status === 'completed' || t.status === 'done');

  return (
    <div className="h-screen bg-[#f1f5f9] flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#2d5282] to-[#3b6cb7] px-4 pt-12 pb-5 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center active:scale-95">
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-white font-bold text-base">Lịch công việc</h1>
              <p className="text-white/60 text-xs">
                {DAYS_VN[today.getDay()]}, {today.getDate()} {MONTHS_VN[today.getMonth()]} {today.getFullYear()}
              </p>
            </div>
          </div>
          <button onClick={() => navigate('/work/tasks/new')} className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Plus className="w-5 h-5 text-white" />
          </button>
        </div>
        {/* Summary chips */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Tổng việc',  value: summary.total,   color: 'text-white' },
            { label: 'Hoàn thành', value: summary.done,    color: 'text-emerald-300' },
            { label: 'Ưu tiên',    value: summary.overdue, color: 'text-red-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-2xl px-2 py-2 text-center">
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-white/60 text-[10px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* LIST */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-24 space-y-3">
        {loading ? (
          Array.from({length: 4}).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border-l-4 border-l-slate-200 flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-3" />
            <p className="text-sm font-semibold text-slate-600">Không có công việc hôm nay</p>
            <p className="text-xs text-slate-400 mt-1">Thêm lịch hẹn hoặc công việc mới</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cần làm hôm nay ({pending.length})
                </p>
                {pending.map(t => <TaskCard key={t.id} task={t} onComplete={handleComplete} />)}
              </>
            )}
            {done.length > 0 && (
              <>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                  Đã hoàn thành ({done.length})
                </p>
                {done.map(t => <TaskCard key={t.id} task={t} onComplete={handleComplete} />)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
