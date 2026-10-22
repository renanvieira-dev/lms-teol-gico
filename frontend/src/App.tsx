import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Play, 
  CheckCircle2, 
  Search, 
  Clock, 
  Tv, 
  PenLine, 
  X, 
  Sparkles, 
  BookOpenCheck,
  Compass,
  ArrowRight,
  Layers,
  Home,
  GraduationCap,
  ChevronDown,
  FolderTree
} from 'lucide-react';
import type { Lesson, CourseLevel, WatchProgress } from './types';

const API_BASE_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'aulas' | 'player'>('home');
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>('basico');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Persistência: Ponto exato de paragem (segundos)
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, WatchProgress>>(() => {
    const saved = localStorage.getItem('teologia_playback_progress');
    return saved ? JSON.parse(saved) : {};
  });

  // Persistência: Última lição assistida
  const [lastWatchedKey, setLastWatchedKey] = useState<string | null>(() => {
    const saved = localStorage.getItem('teologia_last_watched_key');
    return saved ? JSON.parse(saved) : null;
  });

  // Persistência: Lições concluídas
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('teologia_completed');
    return saved ? JSON.parse(saved) : [];
  });

  // Persistência: Caderno de apontamentos
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('teologia_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentNote, setCurrentNote] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Estados do Resumo por IA
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getLessonKey = (lesson: Lesson) => `${lesson.level || 'basico'}_${lesson.telegram_msg_id}`;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/lessons`)
      .then((res) => res.json())
      .then((data: Lesson[]) => {
        const normalized: Lesson[] = data.map((l) => ({
          ...l,
          level: (l.level as CourseLevel) || 'basico',
          module: l.module || 'Módulo Geral',
          title: l.title || `Aula ${l.id}`
        }));

        setLessons(normalized);
        setIsLoading(false);

        if (normalized.length > 0) {
          if (lastWatchedKey) {
            const found = normalized.find((l) => getLessonKey(l) === lastWatchedKey);
            setActiveLesson(found || normalized[0]);
          } else {
            setActiveLesson(normalized[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Erro ao carregar catálogo:', err);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!activeLesson) return;
    const key = getLessonKey(activeLesson);
    setCurrentNote(notes[key] || '');
    setAiSummary(null);
    setSummaryError(null);

    fetch(`${API_BASE_URL}/api/lessons/${activeLesson.telegram_msg_id}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.summary) {
          setAiSummary(data.summary);
        }
      })
      .catch(() => {});
  }, [activeLesson, notes]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current || !activeLesson) return;
    const key = getLessonKey(activeLesson);
    const progress = playbackProgress[key];
    if (progress && progress.currentTime > 2) {
      videoRef.current.currentTime = progress.currentTime;
    }
    videoRef.current.playbackRate = playbackSpeed;
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !activeLesson) return;
    const key = getLessonKey(activeLesson);
    const current = videoRef.current.currentTime;
    const dur = videoRef.current.duration || activeLesson.duration_seconds;

    if (dur > 0 && Math.abs(current - (playbackProgress[key]?.currentTime || 0)) > 2) {
      const updated: WatchProgress = {
        currentTime: Math.floor(current),
        duration: Math.floor(dur),
        lastWatchedAt: Date.now(),
        percentage: Math.min(100, Math.round((current / dur) * 100))
      };

      const newHistory = { ...playbackProgress, [key]: updated };
      setPlaybackProgress(newHistory);
      localStorage.setItem('teologia_playback_progress', JSON.stringify(newHistory));
      localStorage.setItem('teologia_last_watched_key', JSON.stringify(key));
      setLastWatchedKey(key);

      if (updated.percentage > 90 && !completedLessons.includes(key)) {
        toggleComplete(activeLesson);
      }
    }
  };

  const startLesson = (lesson: Lesson) => {
    setActiveLesson(lesson);
    setSelectedLevel(lesson.level || 'basico');
    setCurrentView('player');
  };

  const toggleComplete = (lesson: Lesson) => {
    const key = getLessonKey(lesson);
    const updated = completedLessons.includes(key)
      ? completedLessons.filter((k) => k !== key)
      : [...completedLessons, key];
    setCompletedLessons(updated);
    localStorage.setItem('teologia_completed', JSON.stringify(updated));
  };

  const handleNoteChange = (text: string) => {
    setCurrentNote(text);
    if (!activeLesson) return;
    const key = getLessonKey(activeLesson);
    const updated = { ...notes, [key]: text };
    setNotes(updated);
    localStorage.setItem('teologia_notes', JSON.stringify(updated));
  };

  const handleGenerateAiSummary = async () => {
    if (!activeLesson) return;
    setIsGeneratingSummary(true);
    setSummaryError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/lessons/${activeLesson.telegram_msg_id}/generate-summary`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Falha ao gerar resumo');
      setAiSummary(data.summary);
    } catch (err: any) {
      setSummaryError(err.message || 'Erro ao comunicar com a IA');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const toggleModuleOpen = (moduleName: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  const currentLevelLessons = lessons.filter((l) => (l.level || 'basico') === selectedLevel);
  
  const groupedModules = currentLevelLessons.reduce((acc, lesson) => {
    const mod = lesson.module || 'Módulo Geral';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  const resumeLesson = activeLesson || lessons[0];
  const resumeProgress = resumeLesson ? playbackProgress[getLessonKey(resumeLesson)] : null;

  return (
    <div className="h-screen w-screen bg-[#07090e] text-zinc-100 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. Barra Superior Minimalista */}
      <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl z-30 shrink-0">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-200 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Tv className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-white group-hover:text-amber-400 transition-colors">
                Teologia
              </span>
              <span className="text-[10px] text-zinc-400 -mt-0.5 tracking-wider uppercase font-medium">
                Studio Edition
              </span>
            </div>
          </div>

          <nav className="flex items-center bg-white/[0.04] p-1 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setCurrentView('home')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'home' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </button>
            <button
              onClick={() => setCurrentView('aulas')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'aulas' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Aulas & Módulos</span>
            </button>
            {activeLesson && (
              <button
                onClick={() => setCurrentView('player')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentView === 'player' ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Player</span>
              </button>
            )}
          </nav>
        </div>

        {/* Seletor de Níveis de Formação */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
            {(['basico', 'intermediario', 'avancado'] as CourseLevel[]).map((lvl) => {
              const count = lessons.filter(l => (l.level || 'basico') === lvl).length;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedLevel === lvl
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>{lvl}</span>
                  {count > 0 && (
                    <span className="text-[10px] opacity-60 font-mono">({count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {currentView === 'player' && (
            <button
              onClick={() => setShowNotesDrawer(!showNotesDrawer)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                showNotesDrawer ? 'bg-amber-500/20 text-amber-300' : 'text-zinc-400 hover:text-white bg-white/[0.04]'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Anotações</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Área Central com Barra de Deslocamento Lateral */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ==================== VISTA 1: INÍCIO ==================== */}
        {currentView === 'home' && (
          <main className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
            <div className="max-w-6xl mx-auto w-full space-y-10">
              {resumeLesson ? (
                <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
                  <div className="max-w-xl z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Continuar Assistindo • {(resumeLesson.level || 'basico').toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Aula {resumeLesson.id} • {resumeLesson.duration_formatted}
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
                      {resumeLesson.title}
                    </h1>

                    {resumeLesson.description && (
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-2 leading-relaxed font-light">
                        {resumeLesson.description}
                      </p>
                    )}

                    {resumeProgress && (
                      <div className="mt-5 max-w-md">
                        <div className="flex justify-between text-[11px] text-zinc-400 mb-1.5 font-mono">
                          <span>Parou em {Math.floor(resumeProgress.currentTime / 60)}:{(resumeProgress.currentTime % 60).toString().padStart(2, '0')}</span>
                          <span>{resumeProgress.percentage}% assistido</span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${resumeProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      <button
                        onClick={() => startLesson(resumeLesson)}
                        className="px-6 py-2.5 rounded-xl bg-white text-black font-semibold text-xs tracking-wide hover:bg-amber-400 transition-all flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                        <span>{resumeProgress ? 'Retomar Aula' : 'Iniciar Aula'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedLevel(resumeLesson.level || 'basico');
                          setCurrentView('aulas');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Explorar Módulos</span>
                      </button>
                    </div>
                  </div>

                  <div 
                    onClick={() => startLesson(resumeLesson)}
                    className="w-full md:w-80 aspect-video rounded-2xl bg-zinc-900 border border-white/[0.08] relative overflow-hidden flex items-center justify-center shadow-xl cursor-pointer group-hover:border-amber-400/40 transition-all"
                  >
                    <Play className="w-10 h-10 text-white/40 group-hover:text-amber-400 group-hover:scale-110 transition-all" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-mono text-zinc-300">
                      {resumeLesson.duration_formatted}
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Níveis do Curso */}
              <div>
                <h2 className="text-base font-semibold text-white tracking-wide flex items-center gap-2 mb-4">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Níveis do Curso
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {[
                    { id: 'basico', title: 'Básico', desc: 'Introdução bíblica, panorama geral e princípios essenciais da fé cristã.' },
                    { id: 'intermediario', title: 'Intermediário', desc: 'Teologia histórica, métodos exegéticos e desenvolvimento doutrinário.' },
                    { id: 'avancado', title: 'Avançado', desc: 'Epistemologia religiosa, teologia sistemática e controvérsias contemporâneas.' },
                  ].map((item) => {
                    const count = lessons.filter(l => (l.level || 'basico') === item.id).length;
                    const isCurrent = selectedLevel === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedLevel(item.id as CourseLevel);
                          setCurrentView('aulas');
                        }}
                        className={`p-6 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border transition-all flex flex-col justify-between cursor-pointer group ${
                          isCurrent ? 'border-amber-400/40' : 'border-white/[0.06]'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                            {count > 0 ? `${count} Aulas Indexadas` : 'Aguardando Indexação'}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1 group-hover:text-amber-300 transition-colors">
                            Curso {item.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-light">
                            {item.desc}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <span className="text-xs text-zinc-500 font-medium">Acessar módulos</span>
                          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* ==================== VISTA 2: AULAS E MÓDULOS ==================== */}
        {currentView === 'aulas' && (
          <main className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
            <div className="max-w-5xl mx-auto w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-amber-400" />
                    Grade de Aulas • Nível {(selectedLevel || 'basico').toUpperCase()}
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1">
                    {currentLevelLessons.length} aulas divididas por blocos temáticos
                  </p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar lição ou termo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                  />
                </div>
              </div>

              {/* Módulos com acordeão */}
              <div className="space-y-4">
                {Object.keys(groupedModules).length > 0 ? (
                  Object.entries(groupedModules).map(([moduleName, moduleLessons]) => {
                    const isOpen = expandedModules[moduleName] !== false;
                    const completedInMod = moduleLessons.filter(l => completedLessons.includes(getLessonKey(l))).length;

                    return (
                      <div 
                        key={moduleName} 
                        className="rounded-2xl border border-white/[0.06] bg-white/[0.01] overflow-hidden"
                      >
                        <div 
                          onClick={() => toggleModuleOpen(moduleName)}
                          className="p-4 bg-white/[0.02] hover:bg-white/[0.04] flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
                            <div>
                              <h3 className="text-sm font-semibold text-white tracking-wide">
                                {moduleName}
                              </h3>
                              <span className="text-[11px] text-zinc-400">
                                {moduleLessons.length} lições • {completedInMod} concluídas
                              </span>
                            </div>
                          </div>

                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-400 h-full rounded-full transition-all"
                              style={{ width: `${moduleLessons.length ? (completedInMod / moduleLessons.length) * 100 : 0}%` }}
                            />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="divide-y divide-white/[0.04] px-2 py-1">
                            {moduleLessons
                              .filter(l => l.title.toLowerCase().includes(searchTerm.toLowerCase()))
                              .map((lesson) => {
                                const key = getLessonKey(lesson);
                                const isDone = completedLessons.includes(key);
                                const progress = playbackProgress[key];

                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={() => startLesson(lesson)}
                                    className="p-3 rounded-xl flex items-center justify-between gap-4 hover:bg-white/[0.04] cursor-pointer group transition-all"
                                  >
                                    <div className="flex items-center gap-3.5 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleComplete(lesson);
                                        }}
                                        className="text-zinc-500 hover:text-amber-400 cursor-pointer"
                                      >
                                        {isDone ? (
                                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full border border-zinc-600 hover:border-zinc-400" />
                                        )}
                                      </button>

                                      <div className="min-w-0">
                                        <span className="text-[10px] font-mono text-zinc-500">
                                          Aula {lesson.id.toString().padStart(3, '0')}
                                        </span>
                                        <h4 className="text-xs md:text-sm font-medium text-zinc-200 group-hover:text-amber-300 transition-colors truncate">
                                          {lesson.title}
                                        </h4>
                                        {progress && progress.percentage > 0 && progress.percentage < 90 && (
                                          <span className="text-[10px] text-amber-400/90 font-mono">
                                            Parou em {Math.floor(progress.currentTime / 60)}:{(progress.currentTime % 60).toString().padStart(2, '0')} ({progress.percentage}%)
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-500 font-mono">
                                      <span>{lesson.duration_formatted}</span>
                                      <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 text-center text-xs text-zinc-500 bg-white/[0.01] rounded-2xl border border-white/[0.05]">
                    Nenhuma lição encontrada para o nível <strong>{selectedLevel}</strong>.<br />
                    Execute o comando <code>python index_catalog.py {selectedLevel}</code> no backend para indexar as lições deste nível.
                  </div>
                )}
              </div>
            </div>
          </main>
        )}

        {/* ==================== VISTA 3: REPRODUTOR ==================== */}
        {currentView === 'player' && activeLesson && (
          <main className="flex-1 overflow-y-auto p-6 lg:p-8 w-full">
            <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
              
              <div className="relative group rounded-3xl overflow-hidden border border-white/[0.1] bg-black shadow-[0_20px_70px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <video
                  ref={videoRef}
                  key={`${activeLesson.level || 'basico'}_${activeLesson.telegram_msg_id}`}
                  controls
                  playsInline
                  autoPlay
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full aspect-video object-contain bg-black max-h-[72vh] outline-none"
                  src={`${API_BASE_URL}/api/stream/${activeLesson.level || 'basico'}/${activeLesson.telegram_msg_id}`}
                />
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                <div className="flex-1">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {activeLesson.level || 'basico'} • Aula {activeLesson.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" />
                      {activeLesson.duration_formatted}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      {activeLesson.size_mb} MB
                    </span>
                  </div>

                  <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight leading-snug">
                    {activeLesson.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex items-center bg-white/[0.05] border border-white/[0.08] p-1 rounded-xl">
                    {[1, 1.25, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          playbackSpeed === speed
                            ? 'bg-white text-black shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => toggleComplete(activeLesson)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      completedLessons.includes(getLessonKey(activeLesson))
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08]'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${completedLessons.includes(getLessonKey(activeLesson)) ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    {completedLessons.includes(getLessonKey(activeLesson)) ? 'Concluída' : 'Marcar Concluída'}
                  </button>
                </div>
              </div>

              {/* Guia de Estudo da IA */}
              <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-zinc-200 tracking-wider uppercase">
                        Guia Teológico de Estudo
                      </h3>
                      <p className="text-[11px] text-zinc-500">
                        Síntese conceptual, bases históricas e referências
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAiSummary}
                    disabled={isGeneratingSummary}
                    className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-300/10 hover:from-amber-500/30 hover:to-amber-300/20 border border-amber-400/30 text-amber-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    {isGeneratingSummary ? 'A consultar fundamentos...' : aiSummary ? 'Regenerar com IA' : 'Gerar Guia com IA'}
                  </button>
                </div>

                {activeLesson.description && (
                  <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-xs text-zinc-400 font-mono">
                    <span className="text-[10px] uppercase text-zinc-500 block mb-1 font-sans font-semibold">Tópico Original:</span>
                    {activeLesson.description}
                  </div>
                )}

                {summaryError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                    {summaryError}
                  </div>
                )}

                {aiSummary ? (
                  <div className="pt-2">
                    <ReactMarkdown
                      components={{
                        h2: ({ children }) => (
                          <div className="mt-8 mb-4 flex items-center gap-2.5">
                            <span className="w-1.5 h-5 bg-amber-400 rounded-full inline-block" />
                            <h2 className="text-base md:text-lg font-semibold text-white tracking-tight m-0">
                              {children}
                            </h2>
                          </div>
                        ),
                        p: ({ children }) => (
                          <p className="text-xs md:text-sm leading-relaxed text-zinc-300 mb-4 font-light">
                            {children}
                          </p>
                        ),
                        li: ({ children }) => (
                          <li className="flex items-start gap-3 text-xs md:text-sm text-zinc-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-2xl border border-white/[0.04] mb-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <div className="flex-1">{children}</div>
                          </li>
                        ),
                        strong: ({ children }) => (
                          <strong className="font-semibold text-white">{children}</strong>
                        ),
                        em: ({ children }) => (
                          <em className="text-amber-200/90 not-italic font-medium">{children}</em>
                        ),
                      }}
                    >
                      {aiSummary}
                    </ReactMarkdown>
                  </div>
                ) : !isGeneratingSummary ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500 gap-2.5">
                    <BookOpenCheck className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                    <p className="text-xs max-w-sm leading-relaxed">
                      Clica em <span className="text-amber-400 font-medium">"Gerar Guia com IA"</span> para obter a análise exegética e o resumo estruturado desta aula.
                    </p>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                    <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    <p className="text-xs text-zinc-400 animate-pulse">
                      A construir o sumário teológico...
                    </p>
                  </div>
                )}
              </div>

            </div>
          </main>
        )}

        {/* 4. Gaveta Lateral de Apontamentos */}
        {showNotesDrawer && activeLesson && (
          <aside className="w-96 border-l border-white/[0.08] bg-black/60 backdrop-blur-2xl p-6 flex flex-col z-20 transition-all duration-300 animate-in slide-in-from-right-10">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-4">
              <div className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-white">Caderno de Estudos</h3>
              </div>
              <button 
                onClick={() => setShowNotesDrawer(false)}
                className="w-7 h-7 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="text-[11px] font-medium text-zinc-400 mb-2">
                Notas da <span className="text-white font-semibold">Aula {activeLesson.id} ({activeLesson.level || 'basico'})</span>
              </label>
              <textarea
                value={currentNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Regista termos originais em hebraico/grego, passagens bíblicas ou reflexões de aula..."
                className="w-full flex-1 bg-white/[0.03] focus:bg-white/[0.06] border border-white/[0.08] focus:border-amber-400/40 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed transition-all"
              />
              <p className="text-[10px] text-zinc-500 mt-2 text-center">
                Guardado automaticamente no navegador
              </p>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}