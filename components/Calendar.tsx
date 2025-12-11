import React from 'react';
import { DailyRecord } from '../types';

interface CalendarProps {
  history: DailyRecord[];
}

const Calendar: React.FC<CalendarProps> = ({ history }) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const getRecordForDay = (day: number) => {
    // Format date as YYYY-MM-DD to match storage
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return history.find(h => h.date === dateStr);
  };

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
  }

  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const record = getRecordForDay(d);
    
    // Default styles
    let bgColor = "bg-stone-50 hover:bg-stone-100";
    let textColor = "text-stone-400";
    let ringClass = "";

    if (record) {
      textColor = "text-stone-800";
      // Background based on Bed Score (higher is greener)
      if (record.bedScore >= 80) bgColor = "bg-green-100 border border-green-200";
      else if (record.bedScore >= 50) bgColor = "bg-orange-100 border border-orange-200";
      else bgColor = "bg-stone-200";
      
      // Ring for 100% routine completion
      const isRoutinePerfect = record.totalRoutines > 0 && record.completedRoutines.length === record.totalRoutines;
      if (isRoutinePerfect) {
         ringClass = "ring-2 ring-blue-400 ring-offset-1";
      }
    }

    days.push(
      <div key={d} className={`aspect-square rounded-xl flex flex-col items-center justify-center relative ${bgColor} ${ringClass} transition-all duration-200`}>
        <span className={`text-xs sm:text-sm font-semibold ${textColor}`}>{d}</span>
        {record && (
          <div className="flex gap-1 mt-1">
             {/* Tiny dots for visual data */}
             <div className={`w-1.5 h-1.5 rounded-full ${record.bedScore >= 60 ? 'bg-green-500' : 'bg-orange-400'}`}></div>
             {record.completedRoutines.length === record.totalRoutines && (
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
             )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-xl text-stone-800 tracking-tight">{currentMonth + 1}월의 기록</h3>
        <span className="text-xs font-medium text-stone-400 bg-stone-100 px-2 py-1 rounded-full">{currentYear}</span>
      </div>
      
      <div className="grid grid-cols-7 gap-3 text-center mb-2">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="text-xs text-stone-400 font-bold">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-3">
        {days}
      </div>

      <div className="mt-6 flex gap-4 text-xs text-stone-500 justify-center font-medium bg-stone-50 p-3 rounded-xl">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>침대 점수 양호</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span>루틴 100%</span>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
