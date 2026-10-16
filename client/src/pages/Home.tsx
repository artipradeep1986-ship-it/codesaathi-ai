import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { useEditorStore } from '../stores/editorStore';
import type { Program, LearningProgress } from '../types';
import { Chip } from '../components/ui/Chip';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CardSkeleton, Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressTracker } from '../components/learn/ProgressTracker';
import {
  Camera,
  Code2,
  FolderCode,
  ArrowRight,
  BookOpen,
  Sparkles,
  Play,
  Clock,
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const resetEditor = useEditorStore((state) => state.reset);
  const loadProgramIntoStore = useEditorStore((state) => state.loadProgram);

  const [selectedLang, setSelectedLang] = useState<'java' | 'python' | 'cpp'>('java');
  const [recentPrograms, setRecentPrograms] = useState<Program[]>([]);
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [totalLessons, setTotalLessons] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [progs, progData, lessons] = await Promise.allSettled([
          api.programs.list(),
          api.lessons.progress(),
          api.lessons.list(),
        ]);

        if (progs.status === 'fulfilled') {
          // Take first 3 programs
          setRecentPrograms(progs.value.slice(0, 3));
        }

        if (progData.status === 'fulfilled') {
          setProgressList(progData.value || []);
        }

        if (lessons.status === 'fulfilled' && lessons.value.length > 0) {
          setTotalLessons(lessons.value.length);
        }
      } catch (err) {
        console.warn('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleStartScan = () => {
    navigate('/scan');
  };

  const handleStartNewCode = () => {
    resetEditor();
    navigate('/editor');
  };

  const handleOpenProgram = async (id: string) => {
    try {
      await loadProgramIntoStore(id);
      navigate('/editor');
    } catch {
      navigate(`/programs/${id}`);
    }
  };

  const completedCount = progressList.filter((p) => p.completed).length;

  return (
    <div className="space-y-6 pb-6 animate-fade-in">
      {/* Top Greeting & Language Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text tracking-tight">
            Hello, {profile?.display_name || 'Student'}! 👋
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Class {profile?.class_level || 10} • {profile?.education_board || 'ICSE'} •{' '}
            {profile?.subject || 'Computer Applications'}
          </p>
        </div>

        {/* Language selector chips */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-full border border-border shadow-xs">
          <Chip
            label="Java"
            active={selectedLang === 'java'}
            onClick={() => setSelectedLang('java')}
          />
          <Chip
            label="Python"
            active={selectedLang === 'python'}
            onClick={() => setSelectedLang('python')}
          />
          <Chip
            label="C++"
            active={selectedLang === 'cpp'}
            onClick={() => setSelectedLang('cpp')}
          />
        </div>
      </div>

      {/* BIG PRIMARY CARD: Scan Notebook Code */}
      <div
        onClick={handleStartScan}
        className="cursor-pointer group relative overflow-hidden rounded-card bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 max-w-md">
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>AI Notebook Digitizer</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              📸 Scan Notebook Code
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Take a photo of your handwritten practical code. We convert it to runnable code in seconds.
            </p>
          </div>

          <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <Camera className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Two action cards side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Write Code */}
        <Card
          interactive
          onClick={handleStartNewCode}
          className="flex items-center justify-between p-5 border-l-4 border-l-primary"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-btn bg-primary-50 text-primary flex items-center justify-center mb-2">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-text">✏️ Write Code</h3>
            <p className="text-xs text-text-secondary">
              Open editor, write programs, run and test output
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-text-muted" />
        </Card>

        {/* My Programs */}
        <Card
          interactive
          onClick={() => navigate('/programs')}
          className="flex items-center justify-between p-5 border-l-4 border-l-indigo-500"
        >
          <div className="space-y-1">
            <div className="w-10 h-10 rounded-btn bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
              <FolderCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-text">📁 My Programs</h3>
            <p className="text-xs text-text-secondary">
              Review your scanned code and saved solutions
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-text-muted" />
        </Card>
      </div>

      {/* Learn Card */}
      <Link to="/learn" className="block">
        <ProgressTracker
          completedCount={completedCount}
          totalCount={totalLessons}
          language="Java"
        />
      </Link>

      {/* Recent Programs Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-lg text-text">Recent Programs</h3>
          </div>
          {recentPrograms.length > 0 && (
            <Link
              to="/programs"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : recentPrograms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recentPrograms.map((prog) => (
              <Card
                key={prog.id}
                interactive
                onClick={() => handleOpenProgram(prog.id)}
                className="p-4 flex flex-col justify-between hover:border-primary/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="font-semibold text-sm text-text truncate">
                      {prog.title || 'Untitled Program'}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-50 text-primary uppercase">
                      {prog.programming_language || 'JAVA'}
                    </span>
                  </div>
                  <pre className="p-2 rounded bg-slate-900 text-slate-200 font-mono text-[11px] h-16 overflow-hidden">
                    {prog.source_code.slice(0, 80)}...
                  </pre>
                </div>

                <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between text-xs text-text-muted">
                  <span>Open in Editor</span>
                  <Play className="w-3.5 h-3.5 text-primary" />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Code2 className="w-8 h-8" />}
            title="No programs yet"
            description="Scan your notebook or start writing code to build your practical portfolio."
            actionLabel="Scan Notebook Code"
            onAction={handleStartScan}
          />
        )}
      </div>
    </div>
  );
};
