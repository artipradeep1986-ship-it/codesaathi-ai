import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { Lesson, LearningProgress } from '../types';
import { LessonCard } from '../components/learn/LessonCard';
import { ProgressTracker } from '../components/learn/ProgressTracker';
import { Chip } from '../components/ui/Chip';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

const FALLBACK_LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Introduction to Java & Basic Structure',
    class_level: 10,
    board: 'ICSE',
    language: 'java',
    order: 1,
    content: {
      explanation: 'Java is an object-oriented programming language widely used in school curriculums.',
      code_example: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
      expected_output: 'Hello World',
      practice_question: 'Write a program to display your name and school name on two separate lines.',
      solution: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("My Name");\n        System.out.println("My School");\n    }\n}',
      solution_explanation: 'System.out.println prints the argument and then moves cursor to a new line.',
    },
  },
  {
    id: 'lesson-2',
    title: 'Variables, Data Types & Operators',
    class_level: 10,
    board: 'ICSE',
    language: 'java',
    order: 2,
    content: {
      explanation: 'Variables are containers for storing data values like int, double, char, and boolean.',
      code_example: 'int a = 15;\nint b = 25;\nint sum = a + b;\nSystem.out.println("Sum = " + sum);',
      expected_output: 'Sum = 40',
      practice_question: 'Create two float numbers and calculate their average.',
      solution: 'float x = 12.5f;\nfloat y = 7.5f;\nfloat avg = (x + y) / 2;\nSystem.out.println(avg);',
      solution_explanation: 'We divide the sum by 2 using parentheses to ensure precedence.',
    },
  },
  {
    id: 'lesson-3',
    title: 'Conditional Statements (if-else & switch)',
    class_level: 10,
    board: 'ICSE',
    language: 'java',
    order: 3,
    content: {
      explanation: 'Decision making in Java allows executing specific blocks based on boolean conditions.',
      code_example: 'int marks = 85;\nif (marks >= 90) {\n    System.out.println("Grade A");\n} else {\n    System.out.println("Grade B");\n}',
      expected_output: 'Grade B',
      practice_question: 'Check whether an integer is positive, negative, or zero.',
      solution: 'int num = -5;\nif (num > 0) System.out.println("Positive");\nelse if (num < 0) System.out.println("Negative");\nelse System.out.println("Zero");',
      solution_explanation: 'Use chained if-else if conditions.',
    },
  },
  {
    id: 'lesson-4',
    title: 'Loops: for, while & do-while',
    class_level: 10,
    board: 'ICSE',
    language: 'java',
    order: 4,
    content: {
      explanation: 'Loops are used to execute a block of code repeatedly as long as a condition is met.',
      code_example: 'for (int i = 1; i <= 5; i++) {\n    System.out.print(i + " ");\n}',
      expected_output: '1 2 3 4 5 ',
      practice_question: 'Print factorial of 5 using a for loop.',
      solution: 'int fact = 1;\nfor (int i = 1; i <= 5; i++) fact *= i;\nSystem.out.println(fact);',
      solution_explanation: 'Multiply factorial by loop index at each step.',
    },
  },
  {
    id: 'lesson-5',
    title: 'Nested Loops & Star Patterns',
    class_level: 10,
    board: 'ICSE',
    language: 'java',
    order: 5,
    content: {
      explanation: 'A loop inside another loop is known as a nested loop, very common in ICSE/CBSE practicals.',
      code_example: 'for (int i = 1; i <= 4; i++) {\n    for (int j = 1; j <= i; j++) {\n        System.out.print("* ");\n    }\n    System.out.println();\n}',
      expected_output: '* \n* * \n* * * \n* * * * \n',
      practice_question: 'Print a right-angled triangle of numbers from 1 to row count.',
      solution: 'for(int i=1;i<=3;i++){\n    for(int j=1;j<=i;j++) System.out.print(j+" ");\n    System.out.println();\n}',
      solution_explanation: 'Inner loop variable j increments until i.',
    },
  },
];

export const LearnHome: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LearningProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Class 9' | 'Class 10' | 'Class 11' | 'Class 12'>('All');

  useEffect(() => {
    const fetchLessonsAndProgress = async () => {
      setLoading(true);
      try {
        const [lessonData, progressData] = await Promise.allSettled([
          api.lessons.list({
            class_level: profile?.class_level,
            board: profile?.education_board,
          }),
          api.lessons.progress(),
        ]);

        if (lessonData.status === 'fulfilled' && lessonData.value.length > 0) {
          setLessons(lessonData.value);
        } else {
          setLessons(FALLBACK_LESSONS);
        }

        if (progressData.status === 'fulfilled') {
          setProgress(progressData.value);
        }
      } catch (err) {
        console.warn('Failed to fetch lessons', err);
        setLessons(FALLBACK_LESSONS);
      } finally {
        setLoading(false);
      }
    };

    fetchLessonsAndProgress();
  }, [profile]);

  const completedMap = new Set(progress.filter((p) => p.completed).map((p) => p.lesson_id));

  const filteredLessons = lessons.filter((l) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Class 9') return l.class_level === 9;
    if (selectedFilter === 'Class 10') return l.class_level === 10;
    if (selectedFilter === 'Class 11') return l.class_level === 11;
    if (selectedFilter === 'Class 12') return l.class_level === 12;
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      {/* Progress banner */}
      <ProgressTracker
        completedCount={completedMap.size}
        totalCount={lessons.length}
        language="Java"
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {(['All', 'Class 9', 'Class 10', 'Class 11', 'Class 12'] as const).map((f) => (
          <Chip
            key={f}
            label={f}
            active={selectedFilter === f}
            onClick={() => setSelectedFilter(f)}
          />
        ))}
      </div>

      {/* Lessons List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredLessons.length > 0 ? (
          filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isCompleted={completedMap.has(lesson.id)}
              onClick={(l) => navigate(`/learn/${l.id}`)}
            />
          ))
        ) : (
          <EmptyState
            icon={<BookOpen className="w-8 h-8" />}
            title="No lessons found"
            description="No lessons currently match your selected standard filter."
          />
        )}
      </div>
    </div>
  );
};
export default LearnHome;
