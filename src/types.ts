export interface Manifest {
  timestamp: string;
  run_id: string;
  environment: string;
  version: string;
  data_sources: string[];
}

export interface Summary {
  total_seeds: number;
  active_gaps: number;
  promoted_seeds: number;
  dormant_seeds: number;
  phases_completed: string[];
  seeds: Seed[];
}

export type SeedStatus = 'ACTIVE' | 'DORMANT' | 'PROMOTED';

export interface Seed {
  id: string;
  concept: string;
  gap_description: string;
  trace: number; // Visibility, starts at 2.0
  weight: number; // Influence, starts at 0.0
  status: SeedStatus;
  provenance: string; // Source paper/run
  last_updated: string;
}
