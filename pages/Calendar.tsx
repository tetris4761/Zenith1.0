import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  Target
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface Event {
  id: string;
  title: string;
  type: 'task' | 'review' | 'focus' | 'other';
  date: string;
  time?: string;
  description?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'task' as const,
    date: '',
    time: '',
    description: '',
  });

  // Mock events data
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Review History flashcards',
      type: 'review',
      date: '2024-04-18',
      time: '15:00',
      description: 'Spaced repetition review session',
    },
    {
      id: '2',
      title: 'Write essay outline',
      type: 'task',
      date: '2024-04-20',
      description: 'Literature essay due next week',
    },
    {
      id: '3',
      title: 'Focus session - Math',
      type: 'focus',
      date: '2024-04-19',
      time: '09:00',
      description: '2-hour focused study session',
    },
  ]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const getEventIcon = (type: Event['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle className="w-3 h-3" />;
      case 'review':
        return <Target className="w-3 h-3" />;
      case 'focus':
        return <Clock className="w-3 h-3" />;
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: Event['type']) => {
    switch (type) {
      case 'task':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'review':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'focus':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleCreateEvent = () => {
    if (newEvent.title.trim() && newEvent.date) {
      // TODO: Implement event creation
      console.log('Creating event:', newEvent);
      setNewEvent({
        title: '',
        type: 'task',
        date: '',
        time: '',
        description: '',
      });
      setShowNewEvent(false);
    }
  };

  const days = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Calendar</h1>
        <button
          onClick={() => setShowNewEvent(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {/* Calendar Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-neutral-900">{monthName}</h2>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                viewMode === 'month'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                viewMode === 'week'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-neutral-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="bg-neutral-50 p-3 text-center">
              <div className="text-sm font-medium text-neutral-700">{day}</div>
            </div>
          ))}
          
          {/* Calendar Days */}
          {days.map((day, index) => {
            const isCurrentMonth = day !== null;
            const isToday = day && day.toDateString() === new Date().toDateString();
            const isSelected = selectedDate && day && day.toDateString() === selectedDate.toDateString();
            const dayEvents = day ? getEventsForDate(day) : [];
            
            return (
              <div
                key={index}
                className={cn(
                  'min-h-[120px] bg-white p-2 cursor-pointer transition-colors duration-200',
                  !isCurrentMonth && 'bg-neutral-50',
                  isToday && 'bg-primary-50 border-2 border-primary-200',
                  isSelected && 'bg-primary-100'
                )}
                onClick={() => day && setSelectedDate(day)}
              >
                {day && (
                  <>
                    <div className={cn(
                      'text-sm font-medium mb-2',
                      isToday ? 'text-primary-700' : 'text-neutral-900'
                    )}>
                      {day.getDate()}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className={cn(
                            'text-xs p-1 rounded border truncate',
                            getEventColor(event.type)
                          )}
                          title={event.title}
                        >
                          <div className="flex items-center space-x-1">
                            {getEventIcon(event.type)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                      
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-neutral-500 text-center">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Events for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          <div className="space-y-3">
            {getEventsForDate(selectedDate).map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 bg-neutral-50 rounded-lg">
                <div className={cn(
                  'p-2 rounded-full',
                  getEventColor(event.type)
                )}>
                  {getEventIcon(event.type)}
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-neutral-900">{event.title}</h4>
                  {event.time && (
                    <p className="text-sm text-neutral-600">{event.time}</p>
                  )}
                  {event.description && (
                    <p className="text-sm text-neutral-600 mt-1">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
            
            {getEventsForDate(selectedDate).length === 0 && (
              <p className="text-neutral-500 text-center py-4">No events scheduled for this date</p>
            )}
          </div>
        </div>
      )}

      {/* New Event Modal */}
      {showNewEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                  className="input"
                  placeholder="Event title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Event Type
                </label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="input"
                >
                  <option value="task">Task</option>
                  <option value="review">Review</option>
                  <option value="focus">Focus Session</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                    className="input"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Time (optional)
                  </label>
                  <input
                    type="time"
                    value={newEvent.time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                  className="input"
                  rows={3}
                  placeholder="Event description"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNewEvent(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="btn-primary flex-1"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
