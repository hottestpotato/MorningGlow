import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Camera, Upload, ChevronRight, Share2, CheckCircle2, RotateCcw, AlertCircle, Calendar as CalendarIcon, Home } from 'lucide-react';
import { analyzeBedImage } from './services/geminiService';
import { AppState, BedAnalysisResult, DailyRecord, RoutineItem, CommunityShareData } from './types';
import RoutineCheckbox from './components/RoutineCheckbox';
import Header from './components/Header';
import Calendar from './components/Calendar';

// Constants
const ROUTINE_ITEMS: RoutineItem[] = [
  { id: 'water', label: '물 한 잔 마시기', icon: 'water' },
  { id: 'ventilation', label: '창문 열고 환기하기', icon: 'wind' },
  { id: 'stretch', label: '가벼운 스트레칭', icon: 'stretch' },
  { id: 'read', label: '책 10분 읽기', icon: 'read' },
  { id: 'coffee', label: '여유롭게 커피/차 마시기', icon: 'coffee' },
];

const DEFAULT_NICKNAME = "부지런한햇살";

const App: React.FC = () => {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [nickname] = useState<string>(DEFAULT_NICKNAME);
  const [streak, setStreak] = useState<number>(0);
  const [history, setHistory] = useState<DailyRecord[]>([]);
  
  // Daily Progress State
  const [bedImage, setBedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [bedResult, setBedResult] = useState<BedAnalysisResult | null>(null);
  const [completedRoutines, setCompletedRoutines] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('morning_glow_history');
    const savedStreak = localStorage.getItem('morning_glow_streak');
    const savedBedResult = localStorage.getItem('morning_glow_bedResult');
    
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedStreak) setStreak(parseInt(savedStreak, 10));
    if (savedBedResult) {
      try {
        setBedResult(JSON.parse(savedBedResult));
      } catch (e) {
        console.error('Failed to parse saved bedResult:', e);
      }
    }

    // Check if done today (to potentially restore state or just know)
    // Note: We don't auto-navigate to summary on reload to allow user to see calendar on home
  }, []);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBedImage(reader.result as string);
        // Reset analysis result and routines when new image is uploaded
        setBedResult(null);
        setCompletedRoutines([]);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearAllData = () => {
    if (confirm('모든 데이터를 삭제하시겠습니까?')) {
      localStorage.removeItem('morning_glow_history');
      localStorage.removeItem('morning_glow_streak');
      localStorage.removeItem('morning_glow_bedResult');
      setHistory([]);
      setStreak(0);
      setBedResult(null);
      setCompletedRoutines([]);
      alert('데이터가 초기화되었습니다.');
    }
  };

  const clearTodayData = () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedHistory = history.filter(record => record.date !== today);
    localStorage.setItem('morning_glow_history', JSON.stringify(updatedHistory));
    localStorage.removeItem('morning_glow_bedResult');
    setHistory(updatedHistory);
    setBedResult(null);
    setCompletedRoutines([]);
    setAppState(AppState.HOME);
    alert('오늘의 데이터가 삭제되었습니다.');
  };

  const processBedImage = async () => {
    if (!bedImage) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeBedImage(bedImage);
      setBedResult(result);
      localStorage.setItem('morning_glow_bedResult', JSON.stringify(result));
      setAppState(AppState.ROUTINE_CHECK);
    } catch (error) {
      console.error("Analysis error", error);
      alert("이미지 분석에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleRoutine = (id: string) => {
    setCompletedRoutines(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const finishDailyRoutine = () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate new streak
    const lastRecord = history[history.length - 1];
    let newStreak = 1;
    
    if (lastRecord) {
      const lastDate = new Date(lastRecord.date);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = streak + 1;
      } else if (diffDays === 0) {
        newStreak = streak; // Same day update
      } else {
        newStreak = 1;
      }
    }

    const newRecord: DailyRecord = {
      date: today,
      bedScore: bedResult?.score || 0,
      bedFeedback: bedResult?.feedback || "",
      completedRoutines,
      totalRoutines: ROUTINE_ITEMS.length,
      neatness: bedResult?.neatness,
      corners: bedResult?.corners,
      pillows: bedResult?.pillows,
      confidence: bedResult?.confidence,
    };

    // Update State & Storage
    // Remove existing record for today if exists to allow update
    const updatedHistory = [...history.filter(h => h.date !== today), newRecord];
    // Sort history by date
    updatedHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    setHistory(updatedHistory);
    setStreak(newStreak);
    
    localStorage.setItem('morning_glow_history', JSON.stringify(updatedHistory));
    localStorage.setItem('morning_glow_streak', newStreak.toString());

    setAppState(AppState.SUMMARY);
  };

  const generateCommunityData = (): CommunityShareData => {
    return {
      nickname,
      score: bedResult?.score || 0,
      feedback: bedResult?.feedback || "오늘도 상쾌한 아침!",
      routine_progress: `오늘 루틴 ${completedRoutines.length}/${ROUTINE_ITEMS.length} 완료`,
      date: new Date().toISOString().split('T')[0]
    };
  };

  const copyToClipboard = () => {
    const data = generateCommunityData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert("커뮤니티 공유용 데이터가 클립보드에 복사되었습니다!\n게시글에 붙여넣기(Ctrl+V) 하세요.");
  };

  // Render Views
  const renderHome = () => {
    const today = new Date().toISOString().split('T')[0];
    const isTodayDone = history.some(h => h.date === today);

    return (
      <div className="flex flex-col h-full p-6 space-y-6">
        {/* Top Greeting */}
        <div className="text-left animate-fade-in">
          <h2 className="text-2xl font-bold text-stone-800">좋은 아침입니다, {nickname}님!</h2>
          <p className="text-stone-500 mt-1">
            {isTodayDone 
              ? "오늘의 루틴을 모두 완료하셨네요. 훌륭합니다!" 
              : "오늘 하루를 상쾌하게 시작해볼까요?"}
          </p>
        </div>

        {/* Calendar Section */}
        <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
           <Calendar history={history} />
           
           {!isTodayDone ? (
             <div className="mt-6 bg-orange-50 rounded-2xl p-6 border border-orange-100 flex items-center justify-between">
               <div>
                 <p className="font-bold text-orange-900">오늘의 시작</p>
                 <p className="text-sm text-orange-700">침대 정리부터 시작해봐요</p>
               </div>
               <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                 <RotateCcw className="w-6 h-6 text-orange-600" />
               </div>
             </div>
           ) : (
             <div className="mt-6 bg-green-50 rounded-2xl p-6 border border-green-100 flex items-center justify-between">
                <div>
                 <p className="font-bold text-green-900">오늘 완료!</p>
                 <p className="text-sm text-green-700">내일도 함께해요</p>
               </div>
               <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                 <CheckCircle2 className="w-6 h-6 text-green-600" />
               </div>
             </div>
           )}
        </div>

        {/* Start Button */}
        {!isTodayDone ? (
          <button 
            onClick={() => setAppState(AppState.BED_ANALYSIS)}
            className="w-full bg-stone-900 text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2 transform active:scale-95"
          >
            <Camera className="w-5 h-5" />
            오늘 루틴 시작하기
          </button>
        ) : (
          <button 
            onClick={() => setAppState(AppState.SUMMARY)}
            className="w-full bg-white border-2 border-stone-200 text-stone-600 py-4 rounded-2xl font-semibold hover:border-stone-400 transition-all"
          >
            오늘 결과 다시보기
          </button>
        )}
        
        {/* Data Reset Button */}
        <button 
          onClick={clearTodayData}
          className="w-full bg-amber-50 text-amber-700 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-100 transition-all mt-3"
        >
          오늘 다시 시작하기
        </button>
      </div>
    );
  };

  const renderBedAnalysis = () => (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { setAppState(AppState.HOME); setBedImage(null); setBedResult(null); setCompletedRoutines([]); localStorage.removeItem('morning_glow_bedResult'); }} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <RotateCcw className="w-5 h-5 text-stone-500" />
        </button>
        <h2 className="text-xl font-bold text-stone-800">침대 정리 인증</h2>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        {bedImage ? (
          <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-md mb-6 bg-stone-100 group">
            <img src={bedImage} alt="Bed" className="w-full h-full object-cover" />
            <button 
              onClick={() => setBedImage(null)}
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors backdrop-blur-sm"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-md aspect-square rounded-3xl border-3 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-all mb-6 group"
          >
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
               <Camera className="w-8 h-8 text-stone-400 group-hover:text-orange-500" />
            </div>
            <span className="font-medium">사진 업로드하기</span>
            <span className="text-xs mt-1 text-stone-300">또는 촬영하기</span>
          </div>
        )}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleImageUpload} 
          className="hidden" 
        />

        <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 text-sm text-blue-700 w-full max-w-md mb-6 border border-blue-100">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>안심하세요! 사진은 AI 분석에만 사용되며, 서버에 저장되거나 외부에 공유되지 않습니다.</p>
        </div>
      </div>

      <button 
        onClick={processBedImage}
        disabled={!bedImage || isAnalyzing}
        className={`
          w-full py-4 rounded-2xl font-semibold shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95
          ${!bedImage || isAnalyzing ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' : 'bg-orange-500 text-white hover:bg-orange-600'}
        `}
      >
        {isAnalyzing ? (
          <>
             <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
             분석 중입니다...
          </>
        ) : (
          <>
            분석하고 점수 받기 <ChevronRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  );

  const renderRoutineCheck = () => (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6 animate-fade-in-up">
        <h2 className="text-2xl font-bold text-stone-800">분석 완료! 🎉</h2>
        <div className="mt-4 p-6 bg-gradient-to-br from-orange-500 to-red-500 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-orange-100 font-medium">AI 정리 점수</span>
              <span className="text-5xl font-bold tracking-tighter">{bedResult?.score ?? 0}<span className="text-2xl font-normal opacity-80">점</span></span>
            </div>
            <div className="h-px bg-white/20 my-4"></div>
            <p className="text-base text-white/90 font-medium leading-relaxed">"{bedResult?.feedback}"</p>

            {/* Breakdown with visual bars */}
            <div className="mt-4 bg-white/10 p-4 rounded-lg space-y-3 text-sm">
              {/* Neatness */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="opacity-90">깔끔함</span>
                  <span className="font-bold">{bedResult?.neatness ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-green-300 rounded-full" style={{ width: `${bedResult?.neatness ?? 0}%` }}></div>
                </div>
              </div>
              {/* Corners */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="opacity-90">모서리</span>
                  <span className="font-bold">{bedResult?.corners ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-300 rounded-full" style={{ width: `${bedResult?.corners ?? 0}%` }}></div>
                </div>
              </div>
              {/* Pillows */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="opacity-90">베개</span>
                  <span className="font-bold">{bedResult?.pillows ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-300 rounded-full" style={{ width: `${bedResult?.pillows ?? 0}%` }}></div>
                </div>
              </div>
              {/* Confidence */}
              <div className="pt-2 border-t border-white/20">
                <div className="flex justify-between items-center">
                  <span className="opacity-90">신뢰도</span>
                  <span className="font-bold">{bedResult?.confidence ? Math.round((bedResult.confidence as number) * 100) + '%' : '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 className="text-lg font-bold text-stone-800 mb-4 px-1">모닝 루틴 체크</h3>
      <div className="flex-1 overflow-y-auto space-y-3 pb-6 px-1">
        {ROUTINE_ITEMS.map(item => (
          <RoutineCheckbox 
            key={item.id}
            item={item}
            checked={completedRoutines.includes(item.id)}
            onToggle={toggleRoutine}
          />
        ))}
      </div>

      <div className="pt-4 border-t border-stone-100">
        <button 
          onClick={finishDailyRoutine}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-semibold shadow-lg hover:bg-stone-800 transition-all transform active:scale-95"
        >
          루틴 완료 및 저장
        </button>
      </div>
    </div>
  );

  const renderSummary = () => {
    const progress = Math.round((completedRoutines.length / ROUTINE_ITEMS.length) * 100);

    return (
      <div className="p-6 h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center pt-8 overflow-y-auto">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow shadow-sm">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-3xl font-bold text-stone-800 mb-2">오늘 완료!</h2>
          <p className="text-stone-500 mb-8 font-medium">{streak}일 연속 달성 중이에요 🔥</p>

          <div className="w-full bg-white border border-stone-100 rounded-[2rem] p-8 shadow-xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-green-400"></div>
            
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <span className="text-stone-500 font-medium">침대 정리</span>
              <span className="text-2xl font-bold text-stone-800">{bedResult?.score ?? 0}점</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-stone-100">
              <span className="text-stone-500 font-medium">루틴 달성</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-stone-800">{progress}%</span>
                <p className="text-xs text-stone-400">{completedRoutines.length} / {ROUTINE_ITEMS.length}</p>
              </div>
            </div>
            {/* Breakdown */}
            <div className="grid grid-cols-1 gap-3">
              {/* Neatness */}
              <div className="bg-stone-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-stone-700">깔끔함</span>
                  <span className="text-lg font-bold text-stone-800">{bedResult?.neatness ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${bedResult?.neatness ?? 0}%` }}></div>
                </div>
              </div>
              {/* Corners */}
              <div className="bg-stone-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-stone-700">모서리</span>
                  <span className="text-lg font-bold text-stone-800">{bedResult?.corners ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${bedResult?.corners ?? 0}%` }}></div>
                </div>
              </div>
              {/* Pillows */}
              <div className="bg-stone-50 p-4 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-stone-700">베개</span>
                  <span className="text-lg font-bold text-stone-800">{bedResult?.pillows ?? '-'}%</span>
                </div>
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${bedResult?.pillows ?? 0}%` }}></div>
                </div>
              </div>
              {/* Confidence */}
              <div className="bg-stone-50 p-4 rounded-lg flex justify-between items-center">
                <span className="font-semibold text-stone-700">신뢰도</span>
                <span className="text-lg font-bold text-stone-800">{bedResult?.confidence ? Math.round((bedResult.confidence as number) * 100) + '%' : '-'}</span>
              </div>
            </div>

            <div className="bg-stone-50 p-5 rounded-2xl text-stone-600 text-center italic text-sm leading-relaxed">
               "{bedResult?.feedback}"
            </div>
            
            <div className="flex justify-between items-center text-xs text-stone-400 pt-2">
              <span>{new Date().toLocaleDateString()}</span>
              <span>Morning Glow</span>
            </div>
          </div>
          
          <div className="mt-8 w-full">
            <button 
              onClick={copyToClipboard}
              className="w-full bg-stone-100 text-stone-600 py-4 rounded-2xl font-semibold hover:bg-stone-200 transition-all flex items-center justify-center gap-2 group"
            >
              <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>커뮤니티 공유 (JSON 복사)</span>
            </button>
            <p className="text-center text-xs text-stone-400 mt-3 px-4 leading-relaxed">
              * 버튼을 누르면 커뮤니티 공유용 데이터가 클립보드에 복사됩니다. 사진은 포함되지 않습니다.
            </p>
          </div>
        </div>

        <button 
          onClick={() => setAppState(AppState.HOME)}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-semibold mt-6 shadow-lg hover:bg-stone-800 transition-all flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          홈으로 돌아가기
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-0 md:p-6 font-sans">
      <div className="w-full max-w-md bg-white h-[100dvh] md:h-[850px] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative border border-stone-100 ring-4 ring-stone-50">
        <Header streak={streak} nickname={nickname} />
        
        <main className="flex-1 overflow-hidden relative">
          {appState === AppState.HOME && renderHome()}
          {appState === AppState.BED_ANALYSIS && renderBedAnalysis()}
          {appState === AppState.ROUTINE_CHECK && renderRoutineCheck()}
          {appState === AppState.SUMMARY && renderSummary()}
        </main>
      </div>
    </div>
  );
};

export default App;
