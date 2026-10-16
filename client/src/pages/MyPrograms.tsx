import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useEditorStore } from '../stores/editorStore';
import type { Program } from '../types';
import { ProgramSearch } from '../components/programs/ProgramSearch';
import { ProgramCard } from '../components/programs/ProgramCard';
import { EmptyState } from '../components/ui/EmptyState';
import { CardSkeleton } from '../components/ui/Skeleton';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import { Plus, FolderCode } from 'lucide-react';

export const MyPrograms: React.FC = () => {
  const navigate = useNavigate();
  const resetEditor = useEditorStore((state) => state.reset);
  const loadProgramIntoStore = useEditorStore((state) => state.loadProgram);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');

  // Deletion modal state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const data = await api.programs.list();
      setPrograms(data);
    } catch (err: unknown) {
      console.warn('Failed to fetch programs', err);
      // Fallback empty list
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  const handleCreateNew = () => {
    resetEditor();
    navigate('/editor');
  };

  const handleOpenProgram = async (program: Program) => {
    try {
      await loadProgramIntoStore(program.id);
      navigate('/editor');
    } catch (err) {
      console.error(err);
      navigate(`/programs/${program.id}`);
    }
  };

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await api.programs.delete(deleteId);
      setPrograms((prev) => prev.filter((p) => p.id !== deleteId));
      toast.success('Program deleted');
      setDeleteId(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete program';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter programs based on search and topic
  const filteredPrograms = programs.filter((p) => {
    const matchesSearch =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.source_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTopic =
      selectedTopic === 'All' ||
      (p.topic && p.topic.toLowerCase() === selectedTopic.toLowerCase()) ||
      p.source_code.toLowerCase().includes(selectedTopic.toLowerCase());

    return matchesSearch && matchesTopic;
  });

  return (
    <div className="space-y-5 animate-fade-in relative pb-16">
      {/* Search and Filters */}
      <ProgramSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTopic={selectedTopic}
        onTopicChange={setSelectedTopic}
      />

      {/* Program list cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredPrograms.map((program) => (
            <ProgramCard
              key={program.id}
              program={program}
              onOpen={handleOpenProgram}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FolderCode className="w-8 h-8" />}
          title={searchQuery ? 'No matching programs found' : 'Your library is empty'}
          description={
            searchQuery
              ? 'Try modifying your search or filter criteria.'
              : 'Start by writing a program or scan your school practical notebook.'
          }
          actionLabel="Create New Program"
          onAction={handleCreateNew}
        />
      )}

      {/* Floating Action Button (FAB) for new program */}
      <button
        type="button"
        onClick={handleCreateNew}
        className="fixed bottom-20 right-5 md:bottom-8 md:right-8 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-primary-dark active:scale-95 transition-all z-20 focus:outline-none focus:ring-4 focus:ring-primary/30"
        title="Create New Program"
        aria-label="Create New Program"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Program"
        message="Are you sure you want to delete this program from your library? This action cannot be undone."
        confirmLabel="Delete"
        isDestructive
        isLoading={isDeleting}
      />
    </div>
  );
};
export default MyPrograms;
