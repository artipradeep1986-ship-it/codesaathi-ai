import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, Terminal, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const Welcome: React.FC = () => {
  const features = [
    {
      icon: Camera,
      title: 'Photograph Handwritten Code',
      description:
        'Snap your school notebook pages. Our AI model recognizes your handwriting, retains structure, and flags doubtful characters.',
      color: 'bg-blue-50 text-primary border-blue-100',
    },
    {
      icon: Terminal,
      title: 'Run & Fix in Seconds',
      description:
        'Execute Java without complex setups. Get friendly explanations in English, Hindi, or Hinglish that explain why bugs happen.',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      icon: GraduationCap,
      title: 'Board Exam Aligned',
      description:
        'Curated lessons and practice challenges matching ICSE, CBSE, and State Board computer applications syllabus.',
      color: 'bg-amber-50 text-amber-600 border-amber-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/60 via-white to-slate-50 flex flex-col justify-between p-4 md:p-8">
      {/* Header Brand */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-btn bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
            CS
          </div>
          <div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              CodeSaathi AI
            </span>
          </div>
        </div>

        <Link
          to="/login"
          className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors px-3 py-2"
        >
          Login
        </Link>
      </header>

      {/* Hero section */}
      <div className="max-w-md mx-auto w-full py-8 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-light/60 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Made for Indian School Students</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-text tracking-tight leading-tight">
          From Notebook <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            to Output.
          </span>
        </h1>

        <p className="text-base text-text-secondary leading-relaxed max-w-sm mx-auto">
          Write code in your practical notebook, scan it with your phone, run it instantly, and learn from mistakes without frustration.
        </p>

        {/* Feature Cards */}
        <div className="space-y-3 pt-4 text-left">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-card p-4 border border-border/80 shadow-xs flex items-start gap-3.5 hover:shadow-card transition-shadow"
              >
                <div
                  className={`w-11 h-11 rounded-btn flex items-center justify-center shrink-0 border ${item.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-0.5">{item.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom CTA Actions */}
      <div className="max-w-md mx-auto w-full space-y-3 pb-4">
        <Link to="/signup" className="block w-full">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ArrowRight className="w-5 h-5" />}
            iconPosition="right"
          >
            Get Started Free
          </Button>
        </Link>

        <div className="text-center">
          <span className="text-xs text-text-muted">Already have an account? </span>
          <Link
            to="/login"
            className="text-xs font-semibold text-primary hover:underline ml-1"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
