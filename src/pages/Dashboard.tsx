import { 
  Clock, 
  BookOpen, 
  CheckCircle,
  BarChart3,
  Zap,
  Play,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Welcome back</h1>
        <p className="text-neutral-600 mt-1">Here's your study overview for today</p>
      </div>

      {/* Top Row Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cards Due Widget */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Cards Due</h3>
            <BookOpen className="w-6 h-6 text-accent-600" />
          </div>
          <div className="text-center mb-4">
            <div className="text-4xl font-bold text-neutral-900 mb-2">27</div>
            <p className="text-neutral-600">flashcards due today</p>
          </div>
          <button className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Start Review</span>
          </button>
        </div>

        {/* Focus Timer Widget */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Focus Timer</h3>
            <Clock className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-center mb-4">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.75)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-neutral-900">25:00</span>
              </div>
            </div>
            <p className="text-neutral-600">Pomodoro session</p>
          </div>
          <button className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2">
            <Play className="w-4 h-4" />
            <span>Start Timer</span>
          </button>
        </div>
      </div>

      {/* Middle Row Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Tasks Widget */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Active Tasks</h3>
            <CheckCircle className="w-6 h-6 text-primary-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">Write outline for essay</p>
                <p className="text-xs text-neutral-500">Today</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">Read Chapter 5</p>
                <p className="text-xs text-neutral-500">Tomorrow</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 border-2 border-neutral-300 rounded-full"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">Review notes for Biology</p>
                <p className="text-xs text-neutral-500">Due</p>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Widget */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Calendar</h3>
            <CalendarIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="text-center mb-4">
            <div className="flex items-center justify-between mb-3">
              <button className="p-1 hover:bg-neutral-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium">April 2024</span>
              <button className="p-1 hover:bg-neutral-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                <div key={day} className="p-1 text-neutral-500">{day}</div>
              ))}
              {Array.from({ length: 31 }, (_, i) => (
                <div
                  key={i + 1}
                  className={`p-1 rounded cursor-pointer ${
                    i + 1 === 18 ? 'bg-blue-500 text-white' : 'hover:bg-neutral-100'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="mt-3 text-left">
              <p className="text-sm font-medium text-neutral-900">3:00pm</p>
              <p className="text-sm text-neutral-600">Review History</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Streak Widget */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Streak</h3>
            <Zap className="w-6 h-6 text-accent-600" />
          </div>
          <div className="text-center mb-4">
            <div className="text-3xl font-bold text-neutral-900 mb-2">5 days</div>
            <p className="text-neutral-600">current study streak</p>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: '70%' }}
            ></div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow-card border border-neutral-100">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-center">
              <BookOpen className="w-8 h-8 text-primary-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-neutral-700">Start Review</span>
            </button>
            <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-neutral-700">Focus Session</span>
            </button>
            <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-center">
              <CheckCircle className="w-8 h-8 text-accent-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-neutral-700">New Task</span>
            </button>
            <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="text-sm font-medium text-neutral-700">View Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
