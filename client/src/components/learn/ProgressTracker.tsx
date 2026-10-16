import React from 'react';
import { ProgressBar } from '../ui/ProgressBar';
import { Award, Zap } from 'lucide-react';

export interface ProgressTrackerProps {
  completedCount: number;
  totalCount: number;
  language?: string;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  completedCount,
  totalCount,
  language = 'Java',
}) => {
  const percent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-card p-5 shadow-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-blue-200 block mb-0.5">
            Curriculum Roadmap
          </span>
          <h3 className="text-xl font-bold">Learn {language}</h3>
        </div>
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-xs">
          <Award className="w-6 h-6 text-amber-300" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-sm font-medium text-blue-100 mb-2">
          <span>
            {completedCount} of {totalCount} lessons completed
          </span>
          <span className="font-bold text-white">{Math.round(percent)}%</span>
        </div>
        <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-blue-100 pt-1">
        <Zap className="w-4 h-4 text-amber-300" />
        <span>Complete daily practice questions to master exams!</span>
      </div>
    </div>
  );
};
