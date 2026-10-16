import React from 'react';
import type { Lesson } from '../../types';
import { Card } from '../ui/Card';
import { CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';

export interface LessonCardProps {
  lesson: Lesson;
  isCompleted?: boolean;
  onClick: (lesson: Lesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isCompleted = false,
  onClick,
}) => {
  return (
    <Card
      interactive
      onClick={() => onClick(lesson)}
      className="flex items-center justify-between p-4 hover:border-primary/50 transition-all"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
            isCompleted
              ? 'bg-success-bg text-success border border-success/30'
              : 'bg-primary-50 text-primary border border-primary/20'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : lesson.order || '#'}
        </div>

        <div>
          <h3 className="font-semibold text-text text-base line-clamp-1">
            {lesson.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
            <span>Class {lesson.class_level}</span>
            <span>•</span>
            <span>{lesson.board}</span>
            <span>•</span>
            <span className="capitalize">{lesson.language}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 text-primary">
        <ChevronRight className="w-5 h-5" />
      </div>
    </Card>
  );
};
