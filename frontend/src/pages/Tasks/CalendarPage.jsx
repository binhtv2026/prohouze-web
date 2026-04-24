import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
];

const DEMO_CALENDAR_TASKS = [
  { id: 'calendar-task-1', title: 'Gọi khách nóng dự án Rivera', due_date: new Date().toISOString() },
  { id: 'calendar-task-2', title: 'Chốt lịch xem nhà mẫu', due_date: new Date(Date.now() + 86400000).toISOString() },
  { id: 'calendar-task-3', title: 'Gửi bảng giá và chính sách', due_date: new Date(Date.now() + 2 * 86400000).toISOString() },
];

const DEMO_CALENDAR_EVENTS = [
  { id: 'calendar-event-1', title: 'Họp team sales đầu ngày', date: new Date().toISOString() },
  { id: 'calendar-event-2', title: 'Đào tạo sản phẩm mới', date: new Date(Date.now() + 86400000).toISOString() },
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const [tasksRes, eventsRes] = await Promise.allSettled([
        api.get(`/tasks?my_tasks=true`),
        api.get(`/calendar/events?year=${year}&month=${month}`),
      ]);

      const taskPayload = tasksRes.status === 'fulfilled' && Array.isArray(tasksRes.value?.data) && tasksRes.value.data.length > 0
        ? tasksRes.value.data
        : DEMO_CALENDAR_TASKS;
      const eventPayload = eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value?.data) && eventsRes.value.data.length > 0
        ? eventsRes.value.data
        : DEMO_CALENDAR_EVENTS;
      setTasks(taskPayload);
      setEvents(eventPayload);
    } catch (error) {
      console.error('Error:', error);
      setTasks(DEMO_CALENDAR_TASKS);
      setEvents(DEMO_CALENDAR_EVENTS);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter(t => t.due_date?.startsWith(dateStr));
    const dayEvents = events.filter(e => e.date?.startsWith(dateStr));
    return [...dayTasks.map(t => ({ ...t, type: 'task' })), ...dayEvents.map(e => ({ ...e, type: 'event' }))];
  };

  const navigateMonth = (direction) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lịch</h1>
          <p className="text-slate-500 text-sm mt-1">Tasks và sự kiện theo ngày</p>
        </div>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Hôm nay
              </Button>
              <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
              {/* Day headers */}
              {DAYS.map((day) => (
                <div key={day} className="bg-slate-100 p-2 text-center text-sm font-medium text-slate-600">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                return (
                  <div
                    key={index}
                    className={`bg-white min-h-[100px] p-2 ${
                      !day.isCurrentMonth ? 'bg-slate-50' : ''
                    } ${isToday(day.date) ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                  >
                    <span className={`text-sm font-medium ${
                      !day.isCurrentMonth ? 'text-slate-400' : 
                      isToday(day.date) ? 'text-blue-600' : 'text-slate-900'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded truncate ${
                            event.type === 'task' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-400">
                          +{dayEvents.length - 3} khác
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <CardTitle>Hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          {getEventsForDate(new Date()).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(new Date()).map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className={`w-1 h-12 rounded-full ${
                    item.type === 'task' ? 'bg-blue-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium">{item.title}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {item.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(item.due_date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'task' ? 'Task' : 'Sự kiện'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Không có sự kiện nào hôm nay
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
