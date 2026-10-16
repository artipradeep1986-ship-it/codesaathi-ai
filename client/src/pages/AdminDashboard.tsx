import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { AdminStats, Lesson } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import {
  Users,
  Code2,
  Terminal,
  Sparkles,
  BookOpen,
  UploadCloud,
  Plus,
  Trash2,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 1420,
    totalPrograms: 8320,
    totalExecutions: 34190,
    aiRequestsToday: 642,
  });
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Curriculum state
  const [selectedBoard, setSelectedBoard] = useState('ICSE');
  const [selectedClass, setSelectedClass] = useState(10);
  const [curriculumFile, setCurriculumFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Add Lesson Modal state
  const [showAddLessonModal, setShowAddLessonModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newClass, setNewClass] = useState(10);
  const [newBoard, setNewBoard] = useState('ICSE');
  const [newLanguage, setNewLanguage] = useState('java');
  const [newExplanation, setNewExplanation] = useState('');
  const [newCodeExample, setNewCodeExample] = useState('');
  const [newExpectedOutput, setNewExpectedOutput] = useState('');
  const [newPracticeQ, setNewPracticeQ] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);

  // Delete Lesson state
  const [deleteLessonId, setDeleteLessonId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        const [statsData, lessonsData] = await Promise.allSettled([
          api.admin.stats(),
          api.lessons.list(),
        ]);

        if (statsData.status === 'fulfilled') {
          setStats(statsData.value);
        }
        if (lessonsData.status === 'fulfilled') {
          setLessons(lessonsData.value);
        }
      } catch (err) {
        console.warn('Admin API fetch failed', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleUploadCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!curriculumFile) {
      toast.error('Please choose a curriculum syllabus JSON/PDF file');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.admin.uploadCurriculum({
        board: selectedBoard,
        class_level: selectedClass,
        file: curriculumFile,
      });
      toast.success(`Curriculum uploaded! Created ${res.count || 'lessons'} successfully.`);
      setCurriculumFile(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Curriculum upload failed';
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExplanation.trim() || !newCodeExample.trim()) {
      toast.error('Please fill required lesson fields');
      return;
    }

    setIsCreatingLesson(true);
    try {
      const created = await api.admin.createLesson({
        title: newTitle.trim(),
        class_level: newClass,
        board: newBoard,
        language: newLanguage,
        order: lessons.length + 1,
        content: {
          explanation: newExplanation,
          code_example: newCodeExample,
          expected_output: newExpectedOutput,
          practice_question: newPracticeQ,
          solution: newSolution,
          solution_explanation: 'Standard solution explanation.',
        },
      });

      setLessons((prev) => [...prev, created]);
      toast.success('Lesson created successfully!');
      setShowAddLessonModal(false);
      // Reset form
      setNewTitle('');
      setNewExplanation('');
      setNewCodeExample('');
      setNewExpectedOutput('');
      setNewPracticeQ('');
      setNewSolution('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not create lesson';
      toast.error(msg);
    } finally {
      setIsCreatingLesson(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonId) return;
    try {
      await api.admin.deleteLesson(deleteLessonId);
      setLessons((prev) => prev.filter((l) => l.id !== deleteLessonId));
      toast.success('Lesson deleted');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toast.error(msg);
    } finally {
      setDeleteLessonId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in max-w-4xl mx-auto">
      {/* Admin Title Badge */}
      <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-card p-4">
        <div className="flex items-center gap-2.5 text-amber-800">
          <ShieldCheck className="w-6 h-6 text-amber-600" />
          <div>
            <h1 className="font-bold text-lg">Staff & Admin Panel</h1>
            <p className="text-xs text-amber-700/90">
              Manage school curriculums, lesson syllabus, and platform executions.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 space-y-1 border-t-4 border-t-primary">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase">Total Users</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-text">{stats.totalUsers.toLocaleString()}</p>
        </Card>

        <Card className="p-4 space-y-1 border-t-4 border-t-indigo-500">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase">Programs</span>
            <Code2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-text">{stats.totalPrograms.toLocaleString()}</p>
        </Card>

        <Card className="p-4 space-y-1 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase">Runs</span>
            <Terminal className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-text">{stats.totalExecutions.toLocaleString()}</p>
        </Card>

        <Card className="p-4 space-y-1 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase">AI Queries</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-text">{stats.aiRequestsToday.toLocaleString()}</p>
        </Card>
      </div>

      {/* Upload Curriculum Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border/60">
          <UploadCloud className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-base text-text">Bulk Upload Curriculum</h2>
        </div>

        <form onSubmit={handleUploadCurriculum} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-muted uppercase mb-1 block">
                Target Board
              </label>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-sm text-text"
              >
                <option value="ICSE">ICSE</option>
                <option value="CBSE">CBSE</option>
                <option value="State Board">State Board</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-muted uppercase mb-1 block">
                Target Standard
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(parseInt(e.target.value, 10))}
                className="w-full h-11 px-3 rounded-btn border border-border bg-white text-sm text-text"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted uppercase mb-1 block">
              Curriculum Syllabus File (.JSON or .TXT)
            </label>
            <input
              type="file"
              accept=".json,.txt,.csv"
              onChange={(e) => setCurriculumFile(e.target.files?.[0] || null)}
              className="w-full p-2 border border-border rounded-btn text-sm bg-white"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={isUploading}
            icon={<UploadCloud className="w-4 h-4" />}
          >
            Upload & Ingest Syllabus
          </Button>
        </form>
      </Card>

      {/* Manage Lessons Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-base text-text">
              Curriculum Lessons ({lessons.length})
            </h2>
          </div>

          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddLessonModal(true)}
          >
            New Lesson
          </Button>
        </div>

        <div className="divide-y divide-border">
          {lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="py-3 flex items-center justify-between gap-3 text-sm"
            >
              <div>
                <h4 className="font-semibold text-text">{lesson.title}</h4>
                <p className="text-xs text-text-muted">
                  Class {lesson.class_level} • {lesson.board} • {lesson.language}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDeleteLessonId(lesson.id)}
                className="p-1.5 text-text-muted hover:text-error hover:bg-error-bg/40 rounded-btn min-h-[36px] min-w-[36px] flex items-center justify-center transition-colors"
                title="Delete Lesson"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Create Lesson Modal */}
      <Modal
        isOpen={showAddLessonModal}
        onClose={() => setShowAddLessonModal(false)}
        maxWidth="lg"
        title="Add Curriculum Lesson"
      >
        <form onSubmit={handleCreateLesson} className="space-y-4">
          <Input
            label="Lesson Title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Nested Loops in Java"
            required
          />

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-text block mb-1">Class</label>
              <select
                value={newClass}
                onChange={(e) => setNewClass(parseInt(e.target.value, 10))}
                className="w-full h-10 px-2 rounded-btn border border-border text-sm"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((c) => (
                  <option key={c} value={c}>
                    {c}th
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text block mb-1">Board</label>
              <select
                value={newBoard}
                onChange={(e) => setNewBoard(e.target.value)}
                className="w-full h-10 px-2 rounded-btn border border-border text-sm"
              >
                <option value="ICSE">ICSE</option>
                <option value="CBSE">CBSE</option>
                <option value="State Board">State Board</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text block mb-1">Language</label>
              <select
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                className="w-full h-10 px-2 rounded-btn border border-border text-sm"
              >
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-text block mb-1">
              Concept Explanation
            </label>
            <textarea
              value={newExplanation}
              onChange={(e) => setNewExplanation(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-btn border border-border text-sm"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text block mb-1">
              Code Example
            </label>
            <textarea
              value={newCodeExample}
              onChange={(e) => setNewCodeExample(e.target.value)}
              rows={4}
              className="w-full p-2.5 rounded-btn border border-border font-mono text-xs"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text block mb-1">
              Expected Output
            </label>
            <input
              type="text"
              value={newExpectedOutput}
              onChange={(e) => setNewExpectedOutput(e.target.value)}
              className="w-full h-10 px-3 rounded-btn border border-border text-sm font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text block mb-1">
              Practice Question
            </label>
            <input
              type="text"
              value={newPracticeQ}
              onChange={(e) => setNewPracticeQ(e.target.value)}
              className="w-full h-10 px-3 rounded-btn border border-border text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-text block mb-1">
              Solution Code
            </label>
            <textarea
              value={newSolution}
              onChange={(e) => setNewSolution(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-btn border border-border font-mono text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddLessonModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isCreatingLesson}>
              Save Lesson
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete lesson confirmation */}
      <ConfirmDialog
        isOpen={!!deleteLessonId}
        onClose={() => setDeleteLessonId(null)}
        onConfirm={handleDeleteLesson}
        title="Delete Lesson"
        message="Are you sure you want to permanently delete this curriculum lesson?"
        confirmLabel="Delete"
        isDestructive
      />
    </div>
  );
};
export default AdminDashboard;
