import React from 'react';
import { Flame } from 'lucide-react';

interface HeaderProps {
  streak: number;
  nickname: string;
}

const Header: React.FC<HeaderProps> = ({ streak, nickname }) => {
  return (
    <header className="flex justify-between items-center p-6 bg-white shadow-sm sticky top-0 z-10">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Morning Glow</h1>
        <p className="text-xs text-stone-500">안녕하세요, {nickname}님!</p>
      </div>
      <div className="flex items-center gap-1 bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full font-bold text-sm">
        <Flame className="w-4 h-4 fill-orange-500" />
        <span>{streak}일째</span>
      </div>
    </header>
  );
};

export default Header;
