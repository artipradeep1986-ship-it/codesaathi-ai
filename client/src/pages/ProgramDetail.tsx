import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useEditorStore } from '../stores/editorStore';
import type { Program, ProgramImage, ExecutionResult } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import {
  Code,
  Image as ImageIcon,
  History,
  Play,
  Trash2,
  Calendar,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const loadProgramIntoStore = useEditorStore((state) => state.loadProgram);

  const [program, setProgram] = useState<Program | null>(null);
  const [images, setImages] = useState<ProgramImage[]>([]);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'code' | 'images' | 'history'>('code');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProgramDetails = async () => {
      setLoading(true);
      try {
        const progData = await api.programs.get(id);
        setProgram(progData);

        const [imgs, execs] = await Promise.allSettled([
          api.programs.getImages(id),
          api.programs.getExecutions(id),
        ]);

        if (imgs.status === 'fulfilled') setImages(imgs.value || []);
        if (execs.status === 'fulfilled') setExecutions(execs.value || []);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch program';
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchProgramDetails();
  }, [id]);

  const handleOpenInEditor = async () => {
    if (!program) return;
    try {
      await loadProgramIntoStore(program.id);
      navigate('/editor');
    } catch {
      toast.error('Could not load program into editor');
    }
  };

  const handleDelete = async () => {
    if (!program) return;
    setIsDeleting(true);
    try {
      await api.programs.delete(program.id);
      toast.success('Program deleted');
      navigate('/programs', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <Spinner size="lg" label="Loading program details..." />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-text">Program not found</h2>
        <Button onClick={() => navigate('/programs')} variant="primary">
          Back to Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Header Info Banner */}
      <div className="bg-white rounded-card p-5 border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-text">{program.title}</h1>
            <Badge variant="info">
              {program.programming_language?.toUpperCase() || 'JAVA'}
            </Badge>
          </div>
          {program.description && (
            <p className="text-sm text-text-secondary">{program.description}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-text-muted pt-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Created on {new Date(program.created_at || '').toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Button
            variant="primary"
            icon={<Play className="w-4 h-4" />}
            onClick={handleOpenInEditor}
            className="flex-1 md:flex-none shadow-sm"
          >
            Open in Editor
          </Button>

          <Button
            variant="danger"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => setShowDeleteModal(true)}
            className="flex-1 md:flex-none"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border bg-white rounded-t-btn px-2">
        <button
          onClick={() => setActiveTab('code')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'code'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>Code</span>
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'images'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Notebook Photos ({images.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-text'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Run History ({executions.length})</span>
        </button>
      </div>

      {/* Tab 1: Code */}
      {activeTab === 'code' && (
        <div className="bg-slate-950 text-slate-100 rounded-b-card p-4 overflow-x-auto font-mono text-sm border border-t-0 border-border">
          <pre>
            <code>{program.source_code}</code>
          </pre>
        </div>
      )}

      {/* Tab 2: Scanned Photos */}
      {activeTab === 'images' && (
        <div className="bg-white rounded-b-card p-5 border border-t-0 border-border">
          {images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="rounded-btn border border-border overflow-hidden bg-slate-900 group"
                >
                  <div className="p-1.5 bg-slate-800 text-slate-300 text-xs font-semibold flex justify-between">
                    <span>Page {img.page_number}</span>
                  </div>
                  <img
                    src={img.url || img.storage_path}
                    alt={`Page ${img.page_number}`}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-text-muted text-sm">
              No notebook photos attached to this program.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Execution History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-b-card p-5 border border-t-0 border-border space-y-3">
          {executions.length > 0 ? (
            executions.map((exec, idx) => (
              <div
                key={exec.id || idx}
                className="p-3.5 rounded-btn border border-border/80 bg-surface-soft/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {exec.execution_status === 'success' ? (
                      <Badge variant="success" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                        Success
                      </Badge>
                    ) : (
                      <Badge variant="error" icon={<XCircle className="w-3.5 h-3.5" />}>
                        {exec.execution_status.toUpperCase()}
                      </Badge>
                    )}
                    {exec.execution_time && (
                      <span className="text-xs text-text-muted">
                        {exec.execution_time.toFixed(2)}s
                      </span>
                    )}
                  </div>
                </div>

                {exec.output && (
                  <pre className="p-2.5 rounded bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                    {exec.output}
                  </pre>
                )}

                {exec.error_output && (
                  <pre className="p-2.5 rounded bg-slate-900 text-rose-400 font-mono text-xs overflow-x-auto">
                    {exec.error_output}
                  </pre>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-text-muted text-sm">
              No executions recorded yet. Open in editor to run!
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Program"
        message={`Are you sure you want to permanently delete "${program.title}"?`}
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
export default ProgramDetail;
