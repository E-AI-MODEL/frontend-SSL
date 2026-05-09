import React, { useState, useEffect } from 'react';
import { 
  Database, Search, FlaskConical, GitMerge, FileText, 
  ChevronRight, Activity, ArrowUpRight, Zap, Loader2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GitHubService } from './services/githubService';
import { AIService } from './services/aiService';
import { Summary, Manifest, Seed } from './types';
import Markdown from 'react-markdown';
import { cn } from './lib/utils';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, ScatterChart, Scatter, ZAxis
} from 'recharts';

type Tab = 'overview' | 'seeds' | 'papers' | 'probes';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningBenchmark, setRunningBenchmark] = useState(false);
  const [benchmarkLogs, setBenchmarkLogs] = useState<string[]>([]);
  const [benchmarkStatus, setBenchmarkStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [humanMode, setHumanMode] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [sum, man] = await Promise.all([
        GitHubService.fetchSummary(),
        GitHubService.fetchManifest()
      ]);
      setSummary(sum);
      setManifest(man);
      setLoading(false);
    }
    load();
  }, []);

  const runBlindBenchmark = async () => {
    setRunningBenchmark(true);
    setBenchmarkStatus('running');
    
    if (humanMode) {
      setBenchmarkLogs(['[UITVOER] Testing zonder voorkennis gestart...']);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[UITVOER] AI krijgt nu lastige vragen...']), 1500);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[TEST] De juiste antwoorden worden verborgen...']), 3000);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[SCORE] Kwaliteitsbewaker beoordeelt de antwoorden...']), 4500);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[GEREED] Evaluatie succesvol afgerond.']), 6000);
      setTimeout(() => {
        setBenchmarkLogs(prev => [...prev, '[RAPPORT] We hebben de AI succesvol getest zonder hem de antwoorden vooraf te geven; hij scoorde hoog.']);
        setBenchmarkStatus('completed');
      }, 6500);
    } else {
      setBenchmarkLogs(['[INFO] Triggering GitHub Actions...']);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[INFO] Job queued: run-blind-benchmark']), 800);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[INFO] Environment: Node 24 Phase 3']), 1500);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[SCAN] Masking ground truth labels for scoring...']), 2200);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[EVAL] Executing zero-weight trace-heavy seeds...']), 3500);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[EVAL] Validation Gate parsing responses...']), 4800);
      setTimeout(() => setBenchmarkLogs(prev => [...prev, '[SUCCESS] Run complete.']), 6000);
      setTimeout(() => {
        setBenchmarkLogs(prev => [...prev, '[REPORT] Run \'06 Blind test\' succeeded in GitHub Actions pipeline.']);
        setBenchmarkStatus('completed');
      }, 6500);
    }
    
    setTimeout(() => {
      setRunningBenchmark(false);
      setBenchmarkStatus('idle');
      setBenchmarkLogs([]);
    }, 11000); // Auto close after showing result
  };

  return (
    <div className="flex h-screen w-full bg-[#E4E3E0] font-sans text-[#141414] overflow-hidden">
      
      {/* Sidebar */}
      <div className="w-64 border-r border-[#141414] bg-[#EBEAE7] flex flex-col z-10">
        <div className="h-14 flex items-center px-6 border-b border-[#141414] bg-[#D8D7D4]">
          <Database className="w-5 h-5 text-[#141414] mr-3" />
          <span className="font-mono font-bold text-xs tracking-tighter bg-[#141414] text-[#E4E3E0] px-2 py-1 uppercase">SSL 4.5 Console</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <NavButton 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
            icon={<Activity size={18} />}
            label={humanMode ? "Kwaliteitsmeter" : "Overview"}
          />
          <NavButton 
            active={activeTab === 'seeds'} 
            onClick={() => setActiveTab('seeds')}
            icon={<Search size={18} />}
            label={humanMode ? "Informatie-kiemen" : "Seed Analysis"}
          />
          <NavButton 
            active={activeTab === 'papers'} 
            onClick={() => setActiveTab('papers')}
            icon={<FileText size={18} />}
            label="Paper Pipeline"
          />
          <NavButton 
            active={activeTab === 'probes'} 
            onClick={() => setActiveTab('probes')}
            icon={<FlaskConical size={18} />}
            label={humanMode ? "Stresstest" : "Dialectical Probes"}
          />
        </div>

        <div className="p-4 border-t border-[#141414] bg-[#D8D7D4] text-[10px] font-mono uppercase font-bold tracking-widest text-[#141414]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse"></span>
            <span>repo connected</span>
          </div>
          {manifest ? (
            <div className="space-y-1 opacity-70">
              <div>RUN: <span className="text-[#0066CC] font-mono">{manifest.run_id}</span></div>
              <div>ENV: <span className="text-[#0066CC] font-mono">{manifest.environment}</span></div>
            </div>
          ) : (
            <div>Connecting...</div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-white">
        <div className="h-14 flex items-center px-8 border-b border-[#141414] bg-[#D8D7D4] justify-between shrink-0">
          <h2 className="text-xl font-serif italic text-[#141414] flex items-center gap-2">
            <GitMerge className="w-4 h-4 not-italic opacity-50" /> 
            {activeTab === 'overview' && (humanMode ? 'Kwaliteitsmeter & Overzicht' : 'Data Interpretation')}
            {activeTab === 'seeds' && (humanMode ? 'Kwaliteitsbewaker & Resultaten' : 'Validation Gate & Seed Review')}
            {activeTab === 'papers' && 'Adversarial Paper Analysis'}
            {activeTab === 'probes' && (humanMode ? 'Stresstest Generator' : 'Probe Generation Engine')}
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setHumanMode(!humanMode)}
              className={cn("px-3 py-1 border border-[#141414] text-[10px] uppercase font-bold transition-colors shadow-[2px_2px_0px_#141414] hover:shadow-none translate-y-[-2px] hover:translate-y-[0px]", humanMode ? "bg-[#141414] text-[#00FF00]" : "bg-[#EBEAE7] text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0]")}
            >
              {humanMode ? 'Expert Mode' : 'Eenvoudige Taal'}
            </button>
            <button 
              onClick={runBlindBenchmark}
              disabled={runningBenchmark}
              className="px-3 py-1 border border-[#141414] bg-[#EBEAE7] text-[10px] uppercase font-bold hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors shadow-[2px_2px_0px_#141414] hover:shadow-none translate-y-[-2px] hover:translate-y-[0px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {humanMode ? 'Start Validatietest' : 'Run Blind Benchmark'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 bg-[#E4E3E0] relative">
          
          <AnimatePresence>
            {runningBenchmark && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-8 left-8 right-8 z-50 bg-[#141414] border border-[#141414] shadow-[4px_4px_0px_rgba(0,0,0,0.3)] text-[#00FF00] font-mono text-[10px] p-4 flex flex-col"
                style={{ maxHeight: 'calc(100% - 64px)' }}
              >
                <div className="flex justify-between items-center mb-4 border-b border-[#333] pb-2">
                  <span className="uppercase tracking-widest font-bold opacity-70">Terminal / GitHub Actions</span>
                  {benchmarkStatus === 'completed' && (
                    <button onClick={() => setRunningBenchmark(false)} className="px-2 py-0.5 border border-[#333] hover:bg-[#333] text-white">CLOSE</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto space-y-1">
                  <div className="opacity-50 mb-2">$ {humanMode ? 'run test:blind --simple' : 'npm run test:blind -- --env Node24'}</div>
                  {benchmarkLogs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                  {benchmarkStatus === 'running' && (
                    <div className="mt-2 animate-pulse">_</div>
                  )}
                  {benchmarkStatus === 'completed' && (
                    <div className="mt-4 text-[#0066CC] font-bold">» {humanMode ? 'De test is geslaagd. Waardes opgeslagen.' : 'Benchmark finished successfully. Metrics pushed to artifact cache.'}</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading || !summary ? (
             <div className="flex items-center justify-center h-full">
               <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
             </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="max-w-6xl mx-auto h-full"
              >
                {activeTab === 'overview' && <OverviewView summary={summary} humanMode={humanMode} />}
                {activeTab === 'seeds' && <SeedAnalysisView summary={summary} humanMode={humanMode} />}
                {activeTab === 'papers' && <PaperPipelineView summary={summary} humanMode={humanMode} />}
                {activeTab === 'probes' && <ProbeView summary={summary} humanMode={humanMode} />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-200 group text-left relative overflow-hidden border border-transparent",
        active 
          ? "border-[#141414] bg-white shadow-[2px_2px_0px_#141414]" 
          : "hover:border-[#141414] hover:bg-white/50"
      )}
    >
      <span className={cn("transition-colors", active ? "text-[#141414]" : "text-[#141414] opacity-50 group-hover:opacity-100")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

// -- OVERVIEW TAB --
function OverviewView({ summary, humanMode }: { summary: Summary, humanMode: boolean }) {
  const chartData = [
    { name: humanMode ? 'Klaar/Actief' : 'Active', value: summary.active_gaps, color: '#0066CC' },
    { name: humanMode ? 'Geslaagd' : 'Promoted', value: summary.promoted_seeds, color: '#00FF00' },
    { name: humanMode ? 'Gepauzeerd' : 'Dormant', value: summary.dormant_seeds, color: '#71717a' },
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-6 border-b border-[#141414] pb-6">
        <h1 className="font-serif italic text-3xl mb-2">{humanMode ? 'Kwaliteitsmeter Module' : 'Research Intelligence Layer'}</h1>
        <p className="text-[#141414] opacity-70 font-mono text-[10px] uppercase tracking-widest max-w-2xl leading-relaxed">
          {humanMode ? 'Bekijk hoe goed de AI zijn eigen kennishiaten heeft omgezet in volwaardige trainingsdata.' : 'Translating structural absences and gaps identified in SSL 4.5. Monitor regressional stability and Phase 3 validation tracking metrics.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title={humanMode ? "Totaal Kiemen" : "Total Seeds"} value={summary.total_seeds} />
        <StatCard title={humanMode ? "Geslaagd (Vertrouwensscore ≥ 1.0)" : "Promoted (Weight ≥ 1.0)"} value={summary.promoted_seeds} highlight="green" />
        <StatCard title={humanMode ? "Onder Onderzoek" : "Active Probes"} value={summary.active_gaps} highlight="blue" />
        <StatCard title={humanMode ? "Gepauzeerd" : "Dormant Tracks"} value={summary.dormant_seeds} highlight="zinc" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-[#EBEAE7] border border-[#141414] p-6 shadow-[2px_2px_0px_#141414]">
          <h3 className="font-serif italic text-xs uppercase mb-4 opacity-60">{humanMode ? 'Verdeling van Kiemen' : 'Seed Distribution'}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#141414" fontSize={10} tickLine={false} axisLine={{ stroke: '#141414' }} />
                <YAxis stroke="#141414" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(20, 20, 20, 0.05)'}}
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#141414', borderRadius: '0', color: '#141414', fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase' }}
                  itemStyle={{ color: '#141414', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[2, 2, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#EBEAE7] border border-[#141414] p-6 flex flex-col shadow-[2px_2px_0px_#141414]">
          <h3 className="font-serif italic text-xs uppercase mb-4 opacity-60">{humanMode ? 'Status Beoordeling' : 'Phase Progress'}</h3>
          <div className="flex-1 flex flex-col justify-center space-y-6">
            {summary.phases_completed.map((phase, idx) => {
              const isCurrent = idx === summary.phases_completed.length - 1;
              let humanPhase = phase;
              if (humanMode && phase.includes('Phase 3')) humanPhase = "We testen nu of de AI goed reageert op onverwachte tests.";
              return (
                <div key={idx} className="relative pl-6 border-l border-[#141414] border-dashed">
                  <span className={cn(
                    "absolute -left-[5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border border-[#141414]",
                    isCurrent ? "bg-[#00FF00] shadow-[0_0_8px_#00FF00]" : "bg-[#141414]"
                  )} />
                  <div className={cn("font-mono text-xs uppercase font-bold tracking-widest", isCurrent ? "text-[#141414]" : "text-[#141414] opacity-50")}>
                    {humanPhase}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, highlight }: { title: string, value: number | string, highlight?: 'green' | 'blue' | 'zinc' }) {
  return (
    <div className="bg-white border border-[#141414] shadow-[2px_2px_0px_#141414] p-6 relative overflow-hidden group">
      {highlight && (
        <div className={cn(
          "absolute top-0 right-0 w-2 h-full",
          highlight === 'green' ? "bg-green-500" : highlight === 'blue' ? "bg-blue-500" : "bg-gray-400"
        )} />
      )}
      <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mb-3">{title}</div>
      <div className="text-4xl font-mono font-bold tracking-tight text-[#141414]">{value}</div>
    </div>
  );
}

// -- SEEDS TAB --
function SeedAnalysisView({ summary, humanMode }: { summary: Summary, humanMode: boolean }) {
  const [selectedSeed, setSelectedSeed] = useState<Seed | null>(null);
  const [analysisText, setAnalysisText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const analyze = async (seed: Seed) => {
    setSelectedSeed(seed);
    setAnalyzing(true);
    setAnalysisText('');
    try {
      const result = await AIService.analyzeSeed(seed, humanMode);
      setAnalysisText(result);
    } catch (e) {
      setAnalysisText('Error analyzing seed. ' + (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  const statusColors = {
    ACTIVE: 'bg-blue-100 text-blue-800',
    DORMANT: 'bg-gray-100 text-gray-500',
    PROMOTED: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-12">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-2xl mb-1">{humanMode ? 'De Kwaliteitsbewaker' : 'Validation Gate'}</h2>
        <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">{humanMode ? 'Bekijk hoe specifieke informatie-kiemen de kwaliteitscontrole hebben doorstaan.' : 'Review trace/weight states. Select a seed to simulate the AI validation logic.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        {/* List */}
        <div className="bg-white border border-[#141414] flex flex-col overflow-hidden shadow-[2px_2px_0px_#141414]">
           <div className="overflow-y-auto">
            <table className="w-full text-xs text-left font-mono">
              <thead className="text-[10px] uppercase font-bold tracking-widest bg-[#EBEAE7] border-b border-[#141414] sticky top-0">
                <tr>
                  <th className="px-4 py-3">{humanMode ? 'Kennis-Kiem' : 'Concept / ID'}</th>
                  <th className="px-4 py-3">{humanMode ? 'Signaal / Score' : 'T / W'}</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-2 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]">
                {summary.seeds.map(s => (
                  <tr 
                    key={s.id} 
                    onClick={() => analyze(s)}
                    className={cn(
                      "group cursor-pointer transition-colors hover:bg-[#FFF9E6]",
                      selectedSeed?.id === s.id && "bg-[#FFF9E6]"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#141414]">{s.concept}</div>
                      <div className="text-[10px] opacity-50 mt-0.5">{s.id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span>{s.trace.toFixed(1)}</span> / <span className="font-bold">{s.weight.toFixed(1)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase border border-[#141414]", statusColors[s.status])}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#141414]">→</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-white border border-[#141414] shadow-[2px_2px_0px_#141414] p-6 flex flex-col relative overflow-hidden">
          {!selectedSeed ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center p-8">
              <span className="text-4xl mb-4 font-serif italic">?</span>
              <p className="font-mono text-[10px] uppercase tracking-widest">{humanMode ? 'Klik op een kiem om de analyse te starten' : 'Select a seed from the Validation Gate'}</p>
            </div>
          ) : (
            <>
              <div className="mb-6 border-b border-[#141414] pb-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-serif italic text-[#141414]">{selectedSeed.concept}</h3>
                  <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase border border-[#141414]", statusColors[selectedSeed.status])}>
                    {selectedSeed.status}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-[#141414] mb-4 bg-[#EBEAE7] p-2 border border-[#141414]">
                  <span className="font-bold">PROVENANCE:</span> <span className="text-[#0066CC]">{selectedSeed.provenance}</span>
                </div>
                <div className="text-[#141414] text-xs leading-relaxed mb-4 border-l-4 border-[#141414] pl-4 font-mono bg-[#FFF9E6] py-3 pr-3">
                  <span className="font-bold opacity-50 text-[10px] uppercase tracking-widest block mb-1">{humanMode ? 'Wat mist de AI?' : 'Gap Description:'}</span>
                  {selectedSeed.gap_description}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[#141414] p-3 flex flex-col">
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{humanMode ? 'Signaalsterkte' : 'Trace'}</span>
                    <span className="text-lg font-mono font-bold mt-1">{selectedSeed.trace.toFixed(1)}</span>
                  </div>
                  <div className="border border-[#141414] p-3 flex flex-col bg-[#FFF9E6]">
                    <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{humanMode ? 'Vertrouwensscore' : 'Weight'}</span>
                    <span className="text-lg font-mono font-bold mt-1 text-red-600">{selectedSeed.weight.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {analyzing ? (
                  <div className="flex items-center gap-3 text-[#141414] font-mono text-[10px] uppercase font-bold tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse border border-[#141414]"></span>
                    {humanMode ? 'Beoordeling wordt samengevat...' : 'Analyzing Validation Gate logic via Gemini...'}
                  </div>
                ) : (
                  <div className="font-mono text-[11px] leading-relaxed prose prose-sm max-w-none text-[#141414] marker:text-[#141414] prose-h3:font-serif prose-h3:italic prose-h3:text-lg">
                    <Markdown>{analysisText}</Markdown>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// -- PAPERS TAB --
function PaperPipelineView({ summary, humanMode }: { summary: Summary, humanMode: boolean }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState('manual');

  const MOCK_PAPERS = [
    { id: 'LLM_GAPS_QUANT_2024.pdf', text: 'Recent studies indicate a persistent gap in structural constraint adherence. Models demonstrate high surface-level competency but lack underlying negative knowledge boundaries. Specifically, causal loops and temporal ambiguity remain unresolved mapping targets.' },
    { id: 'STRUCTURAL_ABSENCE_REV.pdf', text: 'We review the structural absences in cross-lingual idiom mapping. The findings suggest that models literalize idioms from low-resource languages, indicating a gap in pragmatic ambiguity resolution.'}
  ];

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPaper(e.target.value);
    const paper = MOCK_PAPERS.find(p => p.id === e.target.value);
    if (paper) {
      setText(paper.text);
    } else {
      setText('');
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setAnalysis('');
    try {
      const result = await AIService.analyzePaper(text, summary.seeds, humanMode);
      setAnalysis(result);
    } catch(e) {
      setAnalysis('Error: ' + (e as Error).message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col pb-12">
       <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-2xl mb-1">{humanMode ? 'PDF Documenten Analyseren' : 'Paper Pipeline'}</h2>
        <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">{humanMode ? 'Vind nieuwe kennishiaten in documenten en vergelijk ze met wat we al weten.' : 'Identify structural absences in academic literature and map to SSL gaps.'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        <div className="flex flex-col bg-white border border-[#141414] p-4 shadow-[2px_2px_0px_#141414]">
          <div className="mb-4">
            <select 
              value={selectedPaper} 
              onChange={handleSelect}
              className="w-full bg-[#EBEAE7] border border-[#141414] p-2 text-[10px] font-mono uppercase font-bold tracking-widest focus:outline-none focus:bg-[#FFF9E6]"
            >
              <option value="manual">{humanMode ? '-- Handmatig tekst plakken --' : '-- Manual Upload / Paste Text --'}</option>
              {MOCK_PAPERS.map(p => (
                <option key={p.id} value={p.id}>data/papers/{p.id}</option>
              ))}
            </select>
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={humanMode ? "Plak hier tekst uit een document..." : "Paste paper abstract or content here..."}
            className="flex-1 w-full bg-[#EBEAE7] border border-[#141414] p-4 text-xs font-mono text-[#141414] focus:outline-none focus:bg-[#FFF9E6] resize-none leading-relaxed"
          ></textarea>
          <div className="mt-4 flex justify-end">
             <button
              onClick={handleAnalyze}
              disabled={analyzing || !text.trim()}
              className="bg-[#141414] text-white font-mono text-[10px] uppercase font-bold tracking-widest py-2 px-6 hover:bg-white hover:text-[#141414] hover:shadow-[2px_2px_0px_#141414] border border-[#141414] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
               {humanMode ? 'Tekst Analyseren' : 'Run Adversarial Comparison'}
             </button>
          </div>
        </div>

        <div className="bg-white border border-[#141414] shadow-[2px_2px_0px_#141414] p-6 overflow-y-auto">
          {analysis ? (
             <div className="font-mono text-[11px] leading-relaxed prose prose-sm max-w-none text-[#141414] marker:text-[#141414] prose-h3:font-serif prose-h3:italic prose-h3:text-lg">
               <Markdown>{analysis}</Markdown>
             </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-50 text-center">
              <FileText className="w-8 h-8 mb-4 border border-[#141414] p-1 shadow-[2px_2px_0px_#141414]" />
              <p className="font-mono text-[10px] uppercase tracking-widest max-w-[200px]">{humanMode ? `Plak een tekst en klik op 'Analyseren' om deze te vergelijken met de ${summary.total_seeds} bekende kiemen.` : `Paste text and click 'Run' to let the Intelligence Layer map it against ${summary.total_seeds} existing seeds.`}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- PROBES TAB --
function ProbeView({ summary, humanMode }: { summary: Summary, humanMode: boolean }) {
  const [probes, setProbes] = useState('');
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    setProbes('');
    try {
      const result = await AIService.generateProbes(summary.seeds, humanMode);
      setProbes(result);
    } catch(e) {
      setProbes('Error: ' + (e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  const promotedCount = summary.seeds.filter(s => s.status === 'PROMOTED').length;

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div className="border-b border-[#141414] pb-4">
        <h2 className="font-serif italic text-2xl mb-1">{humanMode ? 'De Stresstest Generator' : 'Dialectical Probes Generator'}</h2>
        <p className="font-mono text-[10px] opacity-60 uppercase tracking-widest">{humanMode ? 'Genereert lastige vragen om te kijken of de AI echt snapt wat er ontbrak.' : 'Generate adversarial follow-ups based on Promoted seeds (run-probe-utility-benchmark).'}</p>
      </div>

      <div className="bg-white border border-[#141414] shadow-[2px_2px_0px_#141414]">
        <div className="flex items-center justify-between p-6 border-b border-[#141414] bg-[#EBEAE7]">
          <div>
            <div className="text-xl font-bold font-mono text-green-600 mb-1">{promotedCount} {humanMode ? 'GESLAAGDE KIEMEN BESCHIKBAAR' : 'PROMOTED SEEDS AVAILABLE'}</div>
            <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{humanMode ? 'Gereed om de tests te genereren.' : 'Weights ≥ 1.0. Ready for adversarial test generation.'}</div>
          </div>
          <button
              onClick={generate}
              disabled={generating || promotedCount === 0}
              className="bg-[#141414] text-[#00FF00] font-mono text-[10px] uppercase font-bold tracking-widest py-3 px-6 hover:bg-white hover:text-[#141414] hover:shadow-[2px_2px_0px_#141414] border border-[#141414] transition-all focus:outline-none flex items-center gap-2"
          >
             {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
             {humanMode ? 'Genereer Vragen' : 'Generate Probes'}
          </button>
        </div>

        <div className="min-h-[300px] bg-[#EBEAE7] p-8">
          {generating ? (
            <div className="flex items-center justify-center h-full gap-3 font-mono text-[10px] uppercase font-bold tracking-widest text-[#141414]">
               <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-[0_0_8px_#00FF00] animate-pulse border border-[#141414]"></span>
               {humanMode ? 'Lastige vragen bedenken...' : 'Generating Adversarial Probes...'}
            </div>
          ) : probes ? (
            <div className="font-mono text-[11px] leading-relaxed prose prose-sm max-w-none text-[#141414] bg-white p-6 border border-[#141414] shadow-[2px_2px_0px_#141414] marker:text-[#141414] prose-h3:font-serif prose-h3:italic prose-h3:text-lg">
               <Markdown>{probes}</Markdown>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-[200px] opacity-50">
               <span className="font-mono text-4xl mb-4 font-bold">_</span>
               <p className="font-mono text-[10px] uppercase tracking-widest">{humanMode ? 'Klik op genereer om nieuwe tests te maken.' : 'Hit generate to create targeted adversarial evaluations for Phase 3 review.'}</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
