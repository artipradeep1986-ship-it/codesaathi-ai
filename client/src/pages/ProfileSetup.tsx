import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Chip } from '../components/ui/Chip';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';
import { ArrowLeft, ArrowRight, Sparkles, Check } from 'lucide-react';
import type { StudentProfile } from '../types';

export const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { setProfile, profile } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [classLevel, setClassLevel] = useState<number>(profile?.class_level || 10);
  const [board, setBoard] = useState<'ICSE' | 'CBSE' | 'State Board' | 'Other'>(
    profile?.education_board || 'ICSE'
  );
  const [stateBoard, setStateBoard] = useState(profile?.state_board || '');
  const [subject, setSubject] = useState(profile?.subject || 'Computer Applications');
  const [prefLanguage, setPrefLanguage] = useState<'english' | 'hindi' | 'hinglish'>(
    profile?.preferred_language || 'hinglish'
  );
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    profile?.programming_level || 'beginner'
  );

  const classes = [6, 7, 8, 9, 10, 11, 12];
  const boards: Array<'ICSE' | 'CBSE' | 'State Board' | 'Other'> = [
    'ICSE',
    'CBSE',
    'State Board',
    'Other',
  ];
  const languages: Array<{ id: 'english' | 'hindi' | 'hinglish'; label: string }> = [
    { id: 'hinglish', label: 'Hinglish (Mix)' },
    { id: 'english', label: 'Simple English' },
    { id: 'hindi', label: 'Hindi (हिंदी)' },
  ];
  const levels: Array<{ id: 'beginner' | 'intermediate' | 'advanced'; label: string; desc: string }> = [
    { id: 'beginner', label: 'Beginner', desc: 'Starting with basic Java/Python syntax' },
    { id: 'intermediate', label: 'Intermediate', desc: 'Familiar with loops, methods & arrays' },
    { id: 'advanced', label: 'Advanced', desc: 'Preparing for board exams / OOP mastery' },
  ];

  const handleNext = () => {
    if (step === 1) {
      if (!displayName.trim()) {
        toast.error('Please enter your name');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (board === 'State Board' && !stateBoard.trim()) {
        toast.error('Please enter your State Board name (e.g. Maharashtra, Karnataka)');
        return;
      }
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const payload: Partial<StudentProfile> = {
        display_name: displayName.trim(),
        class_level: classLevel,
        education_board: board,
        state_board: board === 'State Board' ? stateBoard.trim() : undefined,
        subject: subject.trim(),
        preferred_language: prefLanguage,
        programming_level: level,
      };

      let saved: StudentProfile;
      try {
        saved = await api.profile.create(payload);
      } catch {
        // If profile already exists, update it
        saved = await api.profile.update(payload);
      }

      setProfile(saved);
      toast.success(`Welcome to CodeSaathi, ${displayName}!`);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      let msg = 'Could not save profile. Please retry.';
      if (err instanceof Error) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg bg-white rounded-card shadow-card p-6 md:p-8 border border-border">
        {/* Wizard progress */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-text-muted uppercase">
            <span>Step {step} of 3</span>
            <span>
              {step === 1 ? 'About You' : step === 2 ? 'Your School Board' : 'Learning Style'}
            </span>
          </div>
          <ProgressBar progress={(step / 3) * 100} showPercentage={false} />
        </div>

        {/* Step 1: Name & Class */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-text">What should we call you?</h2>
              <p className="text-xs text-text-muted mt-1">
                Enter your student name and current class standard.
              </p>
            </div>

            <Input
              label="Student Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              required
              autoFocus
            />

            <div>
              <label className="text-sm font-medium text-text block mb-2">
                Select Your Class / Grade:
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {classes.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setClassLevel(c)}
                    className={`h-12 rounded-btn font-semibold text-sm transition-all border ${
                      classLevel === c
                        ? 'bg-primary text-white border-primary shadow-xs'
                        : 'bg-white text-text-secondary border-border hover:border-primary/50'
                    }`}
                  >
                    {c}th
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Board & Subject */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-text">Which board do you study in?</h2>
              <p className="text-xs text-text-muted mt-1">
                We will personalize lessons and coding questions to match your syllabus.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-text block mb-2">Education Board:</label>
              <div className="grid grid-cols-2 gap-2.5">
                {boards.map((b) => (
                  <button
                    type="button"
                    key={b}
                    onClick={() => setBoard(b)}
                    className={`p-3 rounded-btn text-left font-semibold text-sm transition-all border ${
                      board === b
                        ? 'bg-primary-50 text-primary border-primary ring-1 ring-primary'
                        : 'bg-white text-text-secondary border-border hover:border-primary/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {board === 'State Board' && (
              <Input
                label="State Name"
                value={stateBoard}
                onChange={(e) => setStateBoard(e.target.value)}
                placeholder="e.g. Maharashtra, Karnataka, UP, WB"
                required
              />
            )}

            <Input
              label="Computer Subject Name"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Computer Applications, Informatics Practices"
            />
          </div>
        )}

        {/* Step 3: Explanation Language & Level */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold text-text">How would you like to learn?</h2>
              <p className="text-xs text-text-muted mt-1">
                Choose the language in which you want AI explanations and your coding level.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-text block mb-2">
                Preferred Explanation Language:
              </label>
              <div className="flex flex-wrap gap-2">
                {languages.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.label}
                    active={prefLanguage === l.id}
                    onClick={() => setPrefLanguage(l.id)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-text block mb-2">
                Programming Experience:
              </label>
              <div className="space-y-2">
                {levels.map((lvl) => (
                  <button
                    type="button"
                    key={lvl.id}
                    onClick={() => setLevel(lvl.id)}
                    className={`w-full p-3 rounded-btn text-left transition-all border ${
                      level === lvl.id
                        ? 'bg-primary-50 text-primary border-primary ring-1 ring-primary'
                        : 'bg-white text-text-secondary border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="font-semibold text-sm text-text">{lvl.label}</div>
                    <div className="text-xs text-text-muted mt-0.5">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-border">
          {step > 1 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleFinish}
              loading={loading}
              icon={<Sparkles className="w-4 h-4" />}
              iconPosition="right"
            >
              Start Learning!
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
