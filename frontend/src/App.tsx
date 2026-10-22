import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Play, 
  CheckCircle2, 
  Search, 
  Clock, 
  PenLine, 
  X, 
  ArrowRight,
  Layers,
  Home,
  GraduationCap,
  Award,
  Trophy,
  LogIn,
  LogOut,
  Lock,
  Mail,
  KeyRound,
  SkipBack,
  SkipForward
} from 'lucide-react';
import type { Lesson, CourseLevel, WatchProgress } from './types';
import { ACHIEVEMENTS_LIST, calculateRank, getNextRank } from './gamification';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface LocalUser {
  email: string;
  name: string;
}

// Ecrã de Login e Cadastro Simplificado
function SimpleLoginScreen({ 
  onLoginSuccess, 
  onBackHome 
}: { 
  onLoginSuccess: (email: string) => void; 
  onBackHome: () => void; 
}) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@') || !email.includes('.')) {
      setError('Por favor, introduz um e-mail válido.');
      return;
    }

    if (password.length < 4) {
      setError('A palavra-passe deve ter pelo menos 4 carateres.');
      return;
    }

    onLoginSuccess(email);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 w-full relative overflow-hidden bg-gradient-to-b from-[#07090e] via-zinc-950 to-black">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
          <Lock className="w-6 h-6 stroke-[2]" />
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
          Acesso Restrito
        </span>

        <h2 className="text-2xl font-bold text-white tracking-tight">
          {isSignUp ? 'Criar Conta de Aluno' : 'Entrar na Plataforma'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 mb-6 text-center font-light leading-relaxed">
          Introduz o teu e-mail e palavra-passe para aceder às aulas e guardar o teu progresso.
        </p>

        {error && (
          <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="teuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/50 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-zinc-400 block mb-1">Palavra-passe</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Introduz a tua palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/50 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs transition-all shadow-lg active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>{isSignUp ? 'Registar e Entrar' : 'Entrar nas Aulas'}</span>
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between w-full pt-4 border-t border-white/[0.06] text-xs">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-amber-400/90 hover:text-amber-300 transition-colors cursor-pointer"
          >
            {isSignUp ? 'Já tens conta? Entrar' : 'Não tens conta? Regista-te'}
          </button>

          <button
            type="button"
            onClick={onBackHome}
            className="text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'aulas' | 'player' | 'login'>('home');
  const [selectedLevel, setSelectedLevel] = useState<CourseLevel>('basico');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showTrophyModal, setShowTrophyModal] = useState(false);

  // Utilizador Local
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(() => {
    const saved = localStorage.getItem('teologia_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Gamificação e Progresso
  const [userXp, setUserXp] = useState<number>(() => {
    const saved = localStorage.getItem('teologia_xp');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>(() => {
    const saved = localStorage.getItem('teologia_badges');
    return saved ? JSON.parse(saved) : [];
  });
  const [playbackProgress, setPlaybackProgress] = useState<Record<string, WatchProgress>>(() => {
    const saved = localStorage.getItem('teologia_playback_progress');
    return saved ? JSON.parse(saved) : {};
  });
  const [lastWatchedKey, setLastWatchedKey] = useState<string | null>(() => {
    const saved = localStorage.getItem('teologia_last_watched_key');
    return saved ? JSON.parse(saved) : null;
  });
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('teologia_completed');
    return saved ? JSON.parse(saved) : [];
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('teologia_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentNote, setCurrentNote] = useState('');
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getLessonKey = (lesson: Lesson) => `${lesson.level || 'basico'}_${lesson.telegram_msg_id}`;

  const handleLoginSuccess = (email: string) => {
    const user: LocalUser = {
      email,
      name: email.split('@')[0]
    };
    setCurrentUser(user);
    localStorage.setItem('teologia_current_user', JSON.stringify(user));
    setCurrentView('aulas');
    confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('teologia_current_user');
    setCurrentView('home');
  };

  // Carregar aulas: tenta API local, com fallback automático para catalogo_aulas.json estático na Vercel
  useEffect(() => {
    const loadLessons = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/lessons`).catch(() => null);
        const data: Lesson[] = (res && res.ok) 
          ? await res.json() 
          : await fetch('/catalogo_aulas.json').then((r) => r.json());

        const normalized: Lesson[] = data.map((l, index) => ({
          ...l,
          id: l.id || index + 1,
          level: (l.level as CourseLevel) || 'basico',
          module: l.module || 'Catálogo do Curso',
          title: l.title || `Aula ${index + 1}`
        }));

        setLessons(normalized);

        if (normalized.length > 0) {
          if (lastWatchedKey) {
            const found = normalized.find((l) => getLessonKey(l) === lastWatchedKey);
            setActiveLesson(found || normalized[0]);
          } else {
            setActiveLesson(normalized[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar catálogo:', err);
      }
    };

    loadLessons();
  }, []);

  const awardXp = (amount: number) => {
    const newXp = userXp + amount;
    setUserXp(newXp);
    localStorage.setItem('teologia_xp', newXp.toString());
    checkAchievements(newXp, completedLessons);
  };

  const checkAchievements = (currentXp: number, currentCompleted: string[]) => {
    const toUnlock: string[] = [];
    if (currentCompleted.length >= 1 && !unlockedBadges.includes('first_lesson')) toUnlock.push('first_lesson');
    if (currentCompleted.length >= 5 && !unlockedBadges.includes('five_lessons')) toUnlock.push('five_lessons');
    if (Object.keys(notes).length >= 1 && !unlockedBadges.includes('first_note')) toUnlock.push('first_note');
    if (calculateRank(currentXp).level >= 5 && !unlockedBadges.includes('exegete_rank')) toUnlock.push('exegete_rank');

    if (toUnlock.length > 0) {
      const updated = [...unlockedBadges, ...toUnlock];
      setUnlockedBadges(updated);
      localStorage.setItem('teologia_badges', JSON.stringify(updated));
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  };

  useEffect(() => {
    if (!activeLesson) return;
    const key = getLessonKey(activeLesson);
    setCurrentNote(notes[key] || '');
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
    if (!currentUser) {
      setCurrentView('login');
      return;
    }
    setActiveLesson(lesson);
    setSelectedLevel(lesson.level || 'basico');
    setCurrentView('player');
  };

  const handleNavigateToAulas = (targetLevel?: CourseLevel) => {
    if (targetLevel) setSelectedLevel(targetLevel);
    if (!currentUser) {
      setCurrentView('login');
      return;
    }
    setCurrentView('aulas');
  };

  const toggleComplete = (lesson: Lesson) => {
    const key = getLessonKey(lesson);
    const isNowDone = !completedLessons.includes(key);
    const updated = isNowDone
      ? [...completedLessons, key]
      : completedLessons.filter((k) => k !== key);

    setCompletedLessons(updated);
    localStorage.setItem('teologia_completed', JSON.stringify(updated));

    if (isNowDone) {
      awardXp(50);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleNoteChange = (text: string) => {
    setCurrentNote(text);
    if (!activeLesson) return;
    const key = getLessonKey(activeLesson);
    const updated = { ...notes, [key]: text };
    setNotes(updated);
    localStorage.setItem('teologia_notes', JSON.stringify(updated));

    if (!notes[key] && text.trim().length > 10) {
      awardXp(15);
    }
  };

  // Navegação: Próxima e Anterior
  const currentLevelLessons = lessons.filter((l) => (l.level || 'basico') === selectedLevel);
  const currentIndex = activeLesson ? currentLevelLessons.findIndex((l) => l.telegram_msg_id === activeLesson.telegram_msg_id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < currentLevelLessons.length - 1;

  const handlePreviousLesson = () => {
    if (hasPrevious) {
      startLesson(currentLevelLessons[currentIndex - 1]);
    }
  };

  const handleNextLesson = () => {
    if (hasNext) {
      startLesson(currentLevelLessons[currentIndex + 1]);
    }
  };

  const currentRank = calculateRank(userXp);
  const nextRank = getNextRank(userXp);
  const xpInLevel = userXp - currentRank.minXp;
  const xpNeeded = nextRank ? nextRank.minXp - currentRank.minXp : 1000;
  const levelProgress = nextRank ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

  const filteredLessons = currentLevelLessons.filter((l) => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resumeLesson = activeLesson || lessons[0];
  const resumeProgress = resumeLesson ? playbackProgress[getLessonKey(resumeLesson)] : null;

  return (
    <div className="h-screen w-screen bg-[#07090e] text-zinc-100 flex flex-col overflow-hidden font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. Header Apple TV com Logo em Selo Académico */}
      <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-white/[0.06] bg-black/40 backdrop-blur-2xl z-30 shrink-0">
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-md group-hover:bg-amber-400/25 transition-all" />
              <GraduationCap className="w-8 h-8 relative z-10 transition-transform duration-300 group-hover:scale-105 text-amber-400" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold tracking-tight text-white group-hover:text-amber-400 transition-colors">
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
              onClick={() => handleNavigateToAulas()}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                currentView === 'aulas' ? 'bg-white/15 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Aulas</span>
              {!currentUser && <Lock className="w-2.5 h-2.5 text-zinc-500 ml-0.5" />}
            </button>
            {activeLesson && currentUser && (
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

        {/* 2. Gamificação & Login */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setShowTrophyModal(true)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer transition-all"
            title="Ver Troféus e Títulos Teológicos"
          >
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm">
              {currentRank.badge}
            </div>
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white tracking-tight">{currentRank.title}</span>
                <span className="text-[10px] text-amber-400 font-mono">Nv.{currentRank.level}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500" 
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
                <span className="text-[9px] text-zinc-400 font-mono">{userXp} XP</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowTrophyModal(true)}
            className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] flex items-center justify-center text-amber-400 transition-all cursor-pointer"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xs text-amber-300 font-bold uppercase">
                {currentUser.name.charAt(0)}
              </div>
              <button
                onClick={handleLogout}
                className="w-8 h-8 rounded-full bg-white/[0.04] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 flex items-center justify-center transition-all cursor-pointer"
                title="Terminar Sessão"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCurrentView('login')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-black hover:bg-amber-400 text-xs font-semibold transition-all shadow-md cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Entrar / Registar</span>
            </button>
          )}
        </div>
      </header>

      {/* 3. Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* VISTA 0: LOGIN */}
        {currentView === 'login' && (
          <SimpleLoginScreen 
            onLoginSuccess={handleLoginSuccess} 
            onBackHome={() => setCurrentView('home')} 
          />
        )}

        {/* VISTA 1: INÍCIO */}
        {currentView === 'home' && (
          <main className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
            <div className="max-w-6xl mx-auto w-full space-y-10">
              {resumeLesson ? (
                <div className="relative rounded-3xl overflow-hidden border border-white/[0.1] bg-gradient-to-r from-zinc-950 via-zinc-900 to-black p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 group">
                  <div className="max-w-xl z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Continuar a Assistir • {(resumeLesson.level || 'basico').toUpperCase()}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Aula {resumeLesson.id} • {resumeLesson.duration_formatted}
                      </span>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-snug">
                      {resumeLesson.title}
                    </h1>

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
                        <span>{currentUser ? (resumeProgress ? 'Retomar Aula' : 'Iniciar Aula') : 'Entrar para Assistir'}</span>
                      </button>
                      <button
                        onClick={() => handleNavigateToAulas(resumeLesson.level || 'basico')}
                        className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Ver Grade Completa</span>
                        {!currentUser && <Lock className="w-3 h-3 text-zinc-400" />}
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
                    { id: 'basico', title: 'Básico', desc: 'Introdução bíblica, panorama geral e fundamentos cristãos.' },
                    { id: 'intermediario', title: 'Intermediário', desc: 'Teologia histórica, métodos exegéticos e desenvolvimento doutrinário.' },
                    { id: 'avancado', title: 'Avançado', desc: 'Epistemologia religiosa, teologia sistemática e controvérsias contemporâneas.' },
                  ].map((item) => {
                    const count = lessons.filter(l => (l.level || 'basico') === item.id).length;
                    const isCurrent = selectedLevel === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleNavigateToAulas(item.id as CourseLevel)}
                        className={`p-6 rounded-3xl bg-white/[0.02] hover:bg-white/[0.05] border transition-all flex flex-col justify-between cursor-pointer group ${
                          isCurrent ? 'border-amber-400/40' : 'border-white/[0.06]'
                        }`}
                      >
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                            {count > 0 ? `${count} Aulas Indexadas` : 'Aguardando Indexação'}
                          </span>
                          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors">
                            Curso {item.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-light">
                            {item.desc}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <span className="text-xs text-zinc-500 font-medium">Aceder à grade de aulas</span>
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

        {/* VISTA 2: AULAS NA SEQUÊNCIA EXATA DO TELEGRAM */}
        {currentView === 'aulas' && (
          !currentUser ? (
            <SimpleLoginScreen 
              onLoginSuccess={handleLoginSuccess} 
              onBackHome={() => setCurrentView('home')} 
            />
          ) : (
            <main className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
              <div className="max-w-5xl mx-auto w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-amber-400" />
                      Grade de Aulas ({selectedLevel.toUpperCase()})
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      {filteredLessons.length} aulas na sequência do catálogo
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar por título ou tema..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] divide-y divide-white/[0.04] overflow-hidden">
                  {filteredLessons.map((lesson) => {
                    const key = getLessonKey(lesson);
                    const isDone = completedLessons.includes(key);
                    const progress = playbackProgress[key];

                    return (
                      <div
                        key={lesson.telegram_msg_id}
                        onClick={() => startLesson(lesson)}
                        className="p-3.5 sm:p-4 hover:bg-white/[0.04] cursor-pointer group transition-all flex items-center justify-between gap-4"
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
              </div>
            </main>
          )
        )}

        {/* VISTA 3: PLAYER COM ANTERIOR / PRÓXIMO */}
        {currentView === 'player' && (
          !currentUser || !activeLesson ? (
            <SimpleLoginScreen 
              onLoginSuccess={handleLoginSuccess} 
              onBackHome={() => setCurrentView('home')} 
            />
          ) : (
            <main className="flex-1 overflow-y-auto p-6 lg:p-8 w-full">
              <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
                
                {/* Reprodutor de Vídeo */}
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

                {/* Barra de Metadados e Controles */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {activeLesson.level || 'basico'} • Aula {activeLesson.id.toString().padStart(3, '0')}
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

                  <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                    {/* Velocidades */}
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

                    {/* Marcar Concluída */}
                    <button
                      onClick={() => toggleComplete(activeLesson)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        completedLessons.includes(getLessonKey(activeLesson))
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08]'
                      }`}
                    >
                      <CheckCircle2 className={`w-4 h-4 ${completedLessons.includes(getLessonKey(activeLesson)) ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      {completedLessons.includes(getLessonKey(activeLesson)) ? 'Concluída (+50 XP)' : 'Marcar Concluída'}
                    </button>

                    {/* Caderno de Anotações */}
                    <button
                      onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                      className="p-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-zinc-200 border border-white/[0.08] cursor-pointer"
                      title="Abrir Anotações"
                    >
                      <PenLine className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>

                {/* NAVEGAÇÃO: AULA ANTERIOR / PRÓXIMA AULA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handlePreviousLesson}
                    disabled={!hasPrevious}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.06] flex items-center gap-3 transition-all cursor-pointer text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-amber-400/20 flex items-center justify-center shrink-0 transition-colors">
                      <SkipBack className="w-4 h-4 text-zinc-300 group-hover:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Aula Anterior</span>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 truncate block">
                        {hasPrevious ? currentLevelLessons[currentIndex - 1].title : 'Início do Curso'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={handleNextLesson}
                    disabled={!hasNext}
                    className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-30 disabled:pointer-events-none border border-white/[0.06] flex items-center justify-between gap-3 transition-all cursor-pointer text-right group"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-mono tracking-wider block">Próxima Aula</span>
                      <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300 truncate block">
                        {hasNext ? currentLevelLessons[currentIndex + 1].title : 'Fim do Curso'}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/[0.05] group-hover:bg-amber-400/20 flex items-center justify-center shrink-0 transition-colors">
                      <SkipForward className="w-4 h-4 text-zinc-300 group-hover:text-amber-400" />
                    </div>
                  </button>
                </div>

                {/* Informações da Lição */}
                {activeLesson.description && (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05]">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Informações da Lição
                    </span>
                    <p className="text-xs leading-relaxed text-zinc-300 whitespace-pre-line font-light">
                      {activeLesson.description}
                    </p>
                  </div>
                )}

              </div>
            </main>
          )
        )}

        {/* Modal de Conquistas */}
        {showTrophyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl">
            <div 
              className="w-full max-w-2xl max-h-[85vh] bg-[#0c1017] border border-white/[0.1] rounded-3xl flex flex-col shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl">
                    {currentRank.badge}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      {currentRank.title}
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Nível {currentRank.level} • {userXp} XP
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrophyModal(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {nextRank && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col gap-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-400">Próximo Título: <strong className="text-amber-300">{nextRank.title}</strong></span>
                      <span className="font-mono text-zinc-400">{nextRank.minXp - userXp} XP restantes</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Troféus Desbloqueados
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ACHIEVEMENTS_LIST.map((ach) => {
                      const isUnlocked = unlockedBadges.includes(ach.id);

                      return (
                        <div
                          key={ach.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                            isUnlocked
                              ? 'bg-amber-500/[0.05] border-amber-500/30'
                              : 'bg-white/[0.01] border-white/[0.04] opacity-50'
                          }`}
                        >
                          <div className="text-2xl">{ach.icon}</div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-white">{ach.name}</h4>
                              <span className="text-[10px] text-amber-400 font-mono">+{ach.xpReward} XP</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
                              {ach.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 4. Caderno de Anotações */}
        {showNotesDrawer && activeLesson && (
          <aside className="w-96 border-l border-white/[0.08] bg-black/60 backdrop-blur-2xl p-6 flex flex-col z-20">
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
                Notas da Aula {activeLesson.id}
              </label>
              <textarea
                value={currentNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Escreve as tuas anotações aqui..."
                className="w-full flex-1 bg-white/[0.03] focus:bg-white/[0.06] border border-white/[0.08] focus:border-amber-400/40 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed transition-all"
              />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}