import { Manifest, Summary, Seed } from '../types';

// Utility to calculate status based on prompt rules
function calculateStatus(trace: number, weight: number): 'ACTIVE' | 'DORMANT' | 'PROMOTED' {
  if (weight >= 1.0) return 'PROMOTED';
  if (trace < 0.5) return 'DORMANT'; // Arbitrary threshold for dormancy
  return 'ACTIVE';
}

const mockManifest: Manifest = {
  timestamp: new Date().toISOString(),
  run_id: 'run-open-set-seed-review-v4.5',
  environment: 'Node 24 Phase 3',
  version: 'SSL 4.5',
  data_sources: ['gap-finder-regressions', 'adversarial-evaluations']
};

const mockSeeds: Seed[] = [
  {
    id: 's-101',
    concept: 'Non-linear Temporal Reasoning',
    gap_description: 'Models fail to properly resolve causal links when events are presented in non-chronological order without explicit time markers.',
    trace: 2.5,
    weight: 0.1,
    status: calculateStatus(2.5, 0.1),
    provenance: 'eval-batch-7a',
    last_updated: new Date().toISOString()
  },
  {
    id: 's-102',
    concept: 'Implicit Negation Blindness',
    gap_description: 'Double negations using rare vocabulary are often processed as affirmative statements.',
    trace: 1.8,
    weight: 1.2,
    status: calculateStatus(1.8, 1.2),
    provenance: 'run-blind-benchmark-q2',
    last_updated: new Date().toISOString()
  },
  {
    id: 's-103',
    concept: 'Contextual Semantic Drift',
    gap_description: 'Long-context models lose the precise definition of a newly introduced term after 10k tokens.',
    trace: 0.2,
    weight: 0.0,
    status: calculateStatus(0.2, 0.0),
    provenance: 'long-context-eval-3',
    last_updated: new Date().toISOString()
  },
  {
    id: 's-104',
    concept: 'Cross-lingula Idiom Mapping',
    gap_description: 'Models literalize idioms when translating between low-resource language pairs.',
    trace: 3.1,
    weight: 1.5,
    status: calculateStatus(3.1, 1.5),
    provenance: 'run-open-set-seed-review',
    last_updated: new Date().toISOString()
  }
];

const mockSummary: Summary = {
  total_seeds: mockSeeds.length,
  active_gaps: mockSeeds.filter(s => s.status === 'ACTIVE').length,
  promoted_seeds: mockSeeds.filter(s => s.status === 'PROMOTED').length,
  dormant_seeds: mockSeeds.filter(s => s.status === 'DORMANT').length,
  phases_completed: ['Phase 1', 'Phase 2', 'Phase 3 (Active)'],
  seeds: mockSeeds
};

export const GitHubService = {
  async fetchManifest(): Promise<Manifest> {
    try {
      const res = await fetch('https://raw.githubusercontent.com/E-AI-MODEL/shadowseed/main/results/latest/manifest.json');
      if (!res.ok) throw new Error('Not found');
      return await res.json();
    } catch (e) {
      console.warn('Failed to fetch manifest.json, using mock data.');
      return mockManifest;
    }
  },

  async fetchSummary(): Promise<Summary> {
    try {
      const res = await fetch('https://raw.githubusercontent.com/E-AI-MODEL/shadowseed/main/results/latest/summary.json');
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      // Ensure statuses are calculated if missing
      data.seeds = data.seeds.map((s: any) => ({
        ...s,
        status: s.status || calculateStatus(s.trace, s.weight)
      }));
      return data;
    } catch (e) {
      console.warn('Failed to fetch summary.json, using mock data.');
      return mockSummary;
    }
  }
};
