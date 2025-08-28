import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Target, 
  CheckCircle, 
  Calendar,
  BarChart3,
  Activity,
  Award
} from 'lucide-react';
import { cn } from '../lib/utils';

interface StudySession {
  date: string;
  focusTime: number;
  cardsReviewed: number;
  tasksCompleted: number;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'focus' | 'cards' | 'tasks'>('focus');

  // Mock data - in real app this would come from API
  const [stats] = useState({
    totalFocusTime: 1240, // minutes
    totalCardsReviewed: 156,
    totalTasksCompleted: 23,
    currentStreak: 7,
    longestStreak: 12,
    averageDailyFocus: 35,
    bestStudyTime: '09:00',
    mostProductiveDay: 'Wednesday',
    focusAccuracy: 87,
    cardsRetention: 92,
  });

  const [recentSessions] = useState<StudySession[]>([
    { date: '2024-04-18', focusTime: 45, cardsReviewed: 12, tasksCompleted: 2 },
    { date: '2024-04-17', focusTime: 60, cardsReviewed: 18, tasksCompleted: 3 },
    { date: '2024-04-16', focusTime: 30, cardsReviewed: 8, tasksCompleted: 1 },
    { date: '2024-04-15', focusTime: 75, cardsReviewed: 22, tasksCompleted: 4 },
    { date: '2024-04-14', focusTime: 40, cardsReviewed: 15, tasksCompleted: 2 },
    { date: '2024-04-13', focusTime: 55, cardsReviewed: 20, tasksCompleted: 3 },
    { date: '2024-04-12', focusTime: 35, cardsReviewed: 10, tasksCompleted: 1 },
  ]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getChartData = () => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const session = recentSessions.find(s => s.date === dateStr);
      
      if (session) {
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: selectedMetric === 'focus' ? session.focusTime : 
                 selectedMetric === 'cards' ? session.cardsReviewed : 
                 session.tasksCompleted,
        });
      } else {
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: 0,
        });
      }
    }
    
    return data;
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-neutral-900">Analytics</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setTimeRange('7d')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
              timeRange === '7d'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            7D
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
              timeRange === '30d'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            30D
          </button>
          <button
            onClick={() => setTimeRange('90d')}
            className={cn(
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
              timeRange === '90d'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            90D
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mx-auto mb-3">
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {formatTime(stats.totalFocusTime)}
          </div>
          <div className="text-sm text-neutral-600">Total Focus Time</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {stats.totalCardsReviewed}
          </div>
          <div className="text-sm text-neutral-600">Cards Reviewed</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {stats.totalTasksCompleted}
          </div>
          <div className="text-sm text-neutral-600">Tasks Completed</div>
        </div>
        
        <div className="card text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900 mb-1">
            {stats.currentStreak}
          </div>
          <div className="text-sm text-neutral-600">Day Streak</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-neutral-900">Progress Over Time</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setSelectedMetric('focus')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
                selectedMetric === 'focus'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Focus Time
            </button>
            <button
              onClick={() => setSelectedMetric('cards')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
                selectedMetric === 'cards'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Cards Reviewed
            </button>
            <button
              onClick={() => setSelectedMetric('tasks')}
              className={cn(
                'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200',
                selectedMetric === 'tasks'
                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              Tasks Completed
            </button>
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="h-64 flex items-end space-x-2">
          {chartData.map((data, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div className="w-full bg-neutral-100 rounded-t-sm relative group">
                <div
                  className="bg-primary-500 rounded-t-sm transition-all duration-300 group-hover:bg-primary-600"
                  style={{
                    height: `${maxValue > 0 ? (data.value / maxValue) * 100 : 0}%`,
                    minHeight: '4px',
                  }}
                />
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-neutral-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {selectedMetric === 'focus' ? formatTime(data.value) : data.value}
                </div>
              </div>
              <div className="text-xs text-neutral-500 mt-2 text-center">
                {data.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Patterns */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <span>Study Patterns</span>
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Best study time</span>
              <span className="font-medium text-neutral-900">{stats.bestStudyTime}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Most productive day</span>
              <span className="font-medium text-neutral-900">{stats.mostProductiveDay}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Average daily focus</span>
              <span className="font-medium text-neutral-900">{formatTime(stats.averageDailyFocus)}</span>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <span>Performance</span>
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Focus accuracy</span>
                <span className="font-medium text-neutral-900">{stats.focusAccuracy}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.focusAccuracy}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-neutral-600">Cards retention</span>
                <span className="font-medium text-neutral-900">{stats.cardsRetention}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.cardsRetention}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Longest streak</span>
              <span className="font-medium text-neutral-900">{stats.longestStreak} days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center space-x-2">
          <Award className="w-5 h-5 text-primary-600" />
          <span>Achievements</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
            <div className="text-2xl mb-2">🥇</div>
            <div className="font-medium text-neutral-900">Consistent Learner</div>
            <div className="text-sm text-neutral-600">7-day streak achieved</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <div className="text-2xl mb-2">📚</div>
            <div className="font-medium text-neutral-900">Knowledge Seeker</div>
            <div className="text-sm text-neutral-600">100+ cards reviewed</div>
          </div>
          
          <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-medium text-neutral-900">Time Master</div>
            <div className="text-sm text-neutral-600">20+ hours focused</div>
          </div>
        </div>
      </div>
    </div>
  );
}
