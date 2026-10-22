export interface TheologicalRank {
  level: number;
  title: string;
  minXp: number;
  badge: string;
}

export const THEOLOGICAL_RANKS: TheologicalRank[] = [
  { level: 1, title: 'Catecúmeno', minXp: 0, badge: '🕊️' },
  { level: 2, title: 'Discípulo das Escrituras', minXp: 200, badge: '📖' },
  { level: 3, title: 'Leitor de Manuscritos', minXp: 600, badge: '📜' },
  { level: 4, title: 'Estudioso da Patrística', minXp: 1200, badge: '🏛️' },
  { level: 5, title: 'Exegeta Bíblico', minXp: 2200, badge: '🔍' },
  { level: 6, title: 'Mestre da Escolástica', minXp: 3600, badge: '🕯️' },
  { level: 7, title: 'Teólogo Sistemático', minXp: 5500, badge: '⚔️' },
  { level: 8, title: 'Doutor da Igreja', minXp: 8000, badge: '👑' },
];

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  {
    id: 'first_lesson',
    name: 'Primeiras Letras',
    description: 'Conclua sua primeira lição teológica.',
    icon: '📜',
    xpReward: 50,
  },
  {
    id: 'five_lessons',
    name: 'Constância Monástica',
    description: 'Conclua 5 lições no curso.',
    icon: '⚡',
    xpReward: 100,
  },
  {
    id: 'first_note',
    name: 'Escriba Fiel',
    description: 'Escreva sua primeira anotação no caderno de estudos.',
    icon: '✍️',
    xpReward: 30,
  },
  {
    id: 'patristic_student',
    name: 'Voz dos Padres',
    description: 'Conclua 3 aulas da matéria de Patrística.',
    icon: '🏛️',
    xpReward: 80,
  },
  {
    id: 'exegete_rank',
    name: 'Maturidade Doutrinária',
    description: 'Alcance o nível de Exegeta Bíblico.',
    icon: '🏆',
    xpReward: 150,
  },
];

export function calculateRank(xp: number): TheologicalRank {
  let currentRank = THEOLOGICAL_RANKS[0];
  for (const rank of THEOLOGICAL_RANKS) {
    if (xp >= rank.minXp) {
      currentRank = rank;
    } else {
      break;
    }
  }
  return currentRank;
}

export function getNextRank(xp: number): TheologicalRank | null {
  for (const rank of THEOLOGICAL_RANKS) {
    if (xp < rank.minXp) {
      return rank;
    }
  }
  return null;
}