import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
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
  FolderTree,
  Award,
  Trophy,
  LogIn,
  LogOut,
  Lock,
  ShieldCheck,
  BookOpen,
  Sparkle
} from 'lucide-react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, signInWithPopup, signOut } from './firebase.ts';
import type { Lesson, CourseLevel, WatchProgress } from './types';
import { 
  ACHIEVEMENTS_LIST, 
  calculateRank, 
  getNextRank 
} from './gamification';

const API_BASE_URL = 'http://127.0.0.1:8000';

// Componente da Tela de Login / Bloqueio de Acesso
function LoginScreen({ onLogin, onBackHome }: { onLogin: () => void; onBackHome: () => void }) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAction = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 w-full relative overflow-hidden bg-gradient-to-b from-[#07090e] via-zinc-950 to-black">
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[340px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-2xl p-8 sm:p-10 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.9)] text-center flex flex-col items-center">
        
        {/* Ícone de Cadeado / Brasão */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600/30 via-amber-500/20 to-amber-300/10 border border-amber-500/30 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/10">
          <Lock className="w-7 h-7 text-amber-400 stroke-[2]" />
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
          Acesso Restrito a Alunos
        </span>

        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
          Identifique-se para Estudar
        </h2>

        <p className="text-xs sm:text-sm text-zinc-400 mt-2.5 max-w-sm leading-relaxed font-light">
          A grade curricular, o reprodutor de vídeo e os cadernos de estudo estão bloqueados para visitantes anônimos.
        </p>

        {/* Vantagens ao fazer login */}
        <div className="w-full my-7 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-left space-y-2.5">
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <BookOpen className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Acesso completo aos 3 níveis (Básico, Intermediário e Avançado)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Evolução de ranks históricos (de Catecúmeno a Doutor da Igreja)</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Guias exegéticos e resumos gerados com IA sob demanda</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Progresso sincronizado na nuvem em tempo real</span>
          </div>
        </div>

        {/* Botão de Login com Google */}
        <button
          onClick={handleAction}
          disabled={isLoggingIn}
          className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-amber-400 text-black font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-xl hover:shadow-amber-500/10 active:scale-[0.99] disabled:opacity-60 cursor-pointer group"
        >
          {isLoggingIn ? (
            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="tracking-wide">
            {isLoggingIn ? 'Conectando ao Google...' : 'Entrar com Conta Google'}
          </span>
        </button>

        <button
          onClick={onBackHome}
          className="mt-4 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
        >
          Voltar para a página inicial
        </button>
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
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  // Utilizador do Firebase
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Estados de Gamificação
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
  const [isLoading, setIsLoading] = useState(true);

  // Estados da IA
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const getLessonKey = (lesson: Lesson) => `${lesson.level || 'basico'}_${lesson.telegram_msg_id}`;

  // 1. Ouvir estado de autenticação do Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadUserDataFromFirestore(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Carregar dados do Cloud Firestore
  const loadUserDataFromFirestore = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const snapshot = await getDoc(userDocRef);

      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.xp !== undefined) {
          setUserXp(data.xp);
          localStorage.setItem('teologia_xp', data.xp.toString());
        }
        if (data.badges) {
          setUnlockedBadges(data.badges);
          localStorage.setItem('teologia_badges', JSON.stringify(data.badges));
        }
        if (data.completed) {
          setCompletedLessons(data.completed);
          localStorage.setItem('teologia_completed', JSON.stringify(data.completed));
        }
        if (data.playbackProgress) {
          setPlaybackProgress((prev) => ({ ...prev, ...data.playbackProgress }));
          localStorage.setItem('teologia_playback_progress', JSON.stringify({ ...playbackProgress, ...data.playbackProgress }));
        }
        if (data.notes) {
          setNotes((prev) => ({ ...prev, ...data.notes }));
          localStorage.setItem('teologia_notes', JSON.stringify({ ...notes, ...data.notes }));
        }
      }
    } catch (err) {
      console.error('Erro ao ler dados do Firestore:', err);
    }
  };

  // 3. Login com Google (Popup Nativo)
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setCurrentView('aulas');
    } catch (err) {
      console.error('Falha no login com Google:', err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('home');
  };

  // 4. Carregar catálogo de aulas
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

  // 5. Atribuir XP e atualizar Firestore
  const awardXp = async (amount: number) => {
    const newXp = userXp + amount;
    setUserXp(newXp);
    localStorage.setItem('teologia_xp', newXp.toString());

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { xp: newXp }, { merge: true });
    }

    checkAchievements(newXp, completedLessons);
  };

  // 6. Verificar Conquistas
  const checkAchievements = async (currentXp: number, currentCompleted: string[]) => {
    const toUnlock: string[] = [];

    if (currentCompleted.length >= 1 && !unlockedBadges.includes('first_lesson')) {
      toUnlock.push('first_lesson');
    }
    if (currentCompleted.length >= 5 && !unlockedBadges.includes('five_lessons')) {
      toUnlock.push('five_lessons');
    }
    if (Object.keys(notes).length >= 1 && !unlockedBadges.includes('first_note')) {
      toUnlock.push('first_note');
    }
    if (calculateRank(currentXp).level >= 5 && !unlockedBadges.includes('exegete_rank')) {
      toUnlock.push('exegete_rank');
    }

    if (toUnlock.length > 0) {
      const updated = [...unlockedBadges, ...toUnlock];
      setUnlockedBadges(updated);
      localStorage.setItem('teologia_badges', JSON.stringify(updated));

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      if (currentUser) {
        await setDoc(doc(db, 'users', currentUser.uid), { badges: updated }, { merge: true });
      }
    }
  };

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

      if (currentUser) {
        setDoc(doc(db, 'users', currentUser.uid), {
          playbackProgress: { [key]: updated }
        }, { merge: true });
      }

      if (updated.percentage > 90 && !completedLessons.includes(key)) {
        toggleComplete(activeLesson);
      }
    }
  };

  // Trava de segurança: Iniciar aula requer autenticação
  const startLesson = (lesson: Lesson) => {
    if (!currentUser) {
      setCurrentView('login');
      return;
    }
    setActiveLesson(lesson);
    setSelectedLevel(lesson.level || 'basico');
    setCurrentView('player');
  };

  // Trava de segurança: Navegar para Aulas requer autenticação
  const handleNavigateToAulas = (targetLevel?: CourseLevel) => {
    if (targetLevel) setSelectedLevel(targetLevel);
    if (!currentUser) {
      setCurrentView('login');
      return;
    }
    setCurrentView('aulas');
  };

  const toggleComplete = async (lesson: Lesson) => {
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

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), { completed: updated }, { merge: true });
    }
  };

  const handleNoteChange = async (text: string) => {
    setCurrentNote(text);
    if (!activeLesson) return;
    const key = getLessonKey(activeLesson);
    const updated = { ...notes, [key]: text };
    setNotes(updated);
    localStorage.setItem('teologia_notes', JSON.stringify(updated));

    if (!notes[key] && text.trim().length > 10) {
      awardXp(15);
    }

    if (currentUser) {
      await setDoc(doc(db, 'users', currentUser.uid), {
        notes: { [key]: text }
      }, { merge: true });
    }
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
      awardXp(20);
    } catch (err: any) {
      setSummaryError(err.message || 'Erro ao comunicar com a IA');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const currentRank = calculateRank(userXp);
  const nextRank = getNextRank(userXp);
  const xpInLevel = userXp - currentRank.minXp;
  const xpNeeded = nextRank ? nextRank.minXp - currentRank.minXp : 1000;
  const levelProgress = nextRank ? Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)) : 100;

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
      
      {/* 1. Barra Superior Minimalista Apple TV com HUD de Gamificação & Auth */}
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

        {/* 2. HUD de Gamificação & Conta Firebase */}
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
              {currentUser.photoURL ? (
                <img 
                  src={currentUser.photoURL} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full border border-amber-400/40 object-cover" 
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs text-amber-300 font-bold">
                  {currentUser.email?.charAt(0).toUpperCase()}
                </div>
              )}
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
              <span>Entrar com Gmail</span>
            </button>
          )}
        </div>
      </header>

      {/* 3. Área Central */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ==================== VISTA 0: TELA DE LOGIN / BLOQUEIO ==================== */}
        {currentView === 'login' && (
          <LoginScreen 
            onLogin={handleGoogleLogin} 
            onBackHome={() => setCurrentView('home')} 
          />
        )}

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
                        <span>{currentUser ? (resumeProgress ? 'Retomar Aula' : 'Iniciar Aula') : 'Entrar para Assistir'}</span>
                      </button>
                      <button
                        onClick={() => handleNavigateToAulas(resumeLesson.level || 'basico')}
                        className="px-5 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Layers className="w-4 h-4" />
                        <span>Explorar Módulos</span>
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
                    { id: 'basico', title: 'Básico', desc: 'Introdução bíblica, panorama geral e princípios essenciais da fé cristã.' },
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
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400">
                              {count > 0 ? `${count} Aulas Indexadas` : 'Aguardando Indexação'}
                            </span>
                            {!currentUser && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] bg-white/[0.05] text-zinc-400 border border-white/[0.08] flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Requer Login
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-white mt-1.5 group-hover:text-amber-300 transition-colors">
                            Curso {item.title}
                          </h3>
                          <p className="text-xs text-zinc-400 mt-2 leading-relaxed font-light">
                            {item.desc}
                          </p>
                        </div>

                        <div className="mt-6 flex items-center justify-between pt-4 border-t border-white/[0.04]">
                          <span className="text-xs text-zinc-500 font-medium">
                            {currentUser ? 'Acessar grade de aulas' : 'Entrar para acessar'}
                          </span>
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

        {/* ==================== VISTA 2: AULAS E MÓDULOS (TRAVA SE !currentUser) ==================== */}
        {currentView === 'aulas' && (
          !currentUser ? (
            <LoginScreen 
              onLogin={handleGoogleLogin} 
              onBackHome={() => setCurrentView('home')} 
            />
          ) : (
            <main className="flex-1 overflow-y-auto p-6 md:p-10 w-full">
              <div className="max-w-5xl mx-auto w-full space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-amber-400" />
                      Grade de Aulas • Nível {(selectedLevel || 'basico').toUpperCase()}
                    </h1>
                    <p className="text-xs text-zinc-400 mt-1">
                      {currentLevelLessons.length} aulas organizadas por disciplinas teológicas
                    </p>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar lição ou tema..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] focus:border-amber-400/40 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                  </div>
                </div>

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
                            onClick={() => {
                              setExpandedModules((prev) => ({
                                ...prev,
                                [moduleName]: !isOpen
                              }));
                            }}
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
                      Nenhuma lição encontrada para o nível <strong>{selectedLevel}</strong>.
                    </div>
                  )}
                </div>
              </div>
            </main>
          )
        )}

        {/* ==================== VISTA 3: PLAYER (TRAVA SE !currentUser) ==================== */}
        {currentView === 'player' && (
          !currentUser || !activeLesson ? (
            <LoginScreen 
              onLogin={handleGoogleLogin} 
              onBackHome={() => setCurrentView('home')} 
            />
          ) : (
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
                      {completedLessons.includes(getLessonKey(activeLesson)) ? 'Concluída (+50 XP)' : 'Marcar Concluída'}
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
                          Síntese conceitual, bases históricas e referências
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleGenerateAiSummary}
                      disabled={isGeneratingSummary}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-amber-500/20 via-amber-400/20 to-amber-300/10 hover:from-amber-500/30 hover:to-amber-300/20 border border-amber-400/30 text-amber-300 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                      {isGeneratingSummary ? 'A consultar fundamentos...' : aiSummary ? 'Regenerar (+20 XP)' : 'Gerar Guia com IA (+20 XP)'}
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
                        Clique em <span className="text-amber-400 font-medium">"Gerar Guia com IA"</span> para obter a análise exegética e o resumo estruturado desta aula.
                      </p>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-6 h-6 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                      <p className="text-xs text-zinc-400 animate-pulse">
                        Construindo o sumário teológico...
                      </p>
                    </div>
                  )}
                </div>

              </div>
            </main>
          )
        )}

        {/* 4. Modal: Sala de Troféus e Títulos Teológicos */}
        {showTrophyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
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
                      Nível {currentRank.level} • {userXp} Pontos de Experiência (XP)
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
                    Conquistas & Troféus Desbloqueados
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
                            <span className="text-[9px] font-mono mt-1 block text-zinc-500">
                              {isUnlocked ? '✓ Desbloqueado' : '🔒 Bloqueado'}
                            </span>
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

        {/* 5. Gaveta de Anotações */}
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
                Notas de <span className="text-white font-semibold">Aula {activeLesson.id} ({activeLesson.level || 'basico'})</span>
              </label>
              <textarea
                value={currentNote}
                onChange={(e) => handleNoteChange(e.target.value)}
                placeholder="Registre termos originais (hebraico/grego), passagens bíblicas ou notas de aula..."
                className="w-full flex-1 bg-white/[0.03] focus:bg-white/[0.06] border border-white/[0.08] focus:border-amber-400/40 rounded-2xl p-4 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none resize-none leading-relaxed transition-all"
              />
              <p className="text-[10px] text-zinc-500 mt-2 text-center">
                {currentUser ? '☁️ Sincronizado no Firestore' : '💾 Guardado localmente no navegador'}
              </p>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}