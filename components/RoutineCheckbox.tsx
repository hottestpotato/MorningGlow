import React from 'react';
import { RoutineItem } from '../types';
import { Check, GlassWater, Wind, Activity, BookOpen, Coffee, Sun } from 'lucide-react';

interface RoutineCheckboxProps {
  item: RoutineItem;
  checked: boolean;
  onToggle: (id: string) => void;
}

const RoutineCheckbox: React.FC<RoutineCheckboxProps> = ({ item, checked, onToggle }) => {
  
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'water': return <GlassWater className="w-5 h-5" />;
      case 'wind': return <Wind className="w-5 h-5" />;
      case 'stretch': return <Activity className="w-5 h-5" />;
      case 'read': return <BookOpen className="w-5 h-5" />;
      case 'coffee': return <Coffee className="w-5 h-5" />;
      default: return <Sun className="w-5 h-5" />;
    }
  };

  return (
    <div 
      onClick={() => onToggle(item.id)}
      className={`
        flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
        ${checked 
          ? 'bg-orange-50 border-orange-500 text-orange-900 shadow-sm' 
          : 'bg-white border-stone-200 text-stone-600 hover:border-orange-200'
        }
      `}
    >
      <div className={`
        flex items-center justify-center w-8 h-8 rounded-full border-2 mr-4 transition-colors
        ${checked ? 'bg-orange-500 border-orange-500 text-white' : 'bg-transparent border-stone-300'}
      `}>
        {checked && <Check className="w-5 h-5" />}
      </div>
      
      <div className="flex-1 flex items-center gap-3">
        <span className={checked ? 'text-orange-500' : 'text-stone-400'}>
          {getIcon(item.icon)}
        </span>
        <span className={`font-medium text-lg ${checked ? 'line-through opacity-70' : ''}`}>
          {item.label}
        </span>
      </div>
    </div>
  );
};

export default RoutineCheckbox;
