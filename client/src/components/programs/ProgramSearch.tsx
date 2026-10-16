import React from 'react';
import { Search, X } from 'lucide-react';
import { Chip } from '../ui/Chip';

export interface ProgramSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  topics?: string[];
}

const DEFAULT_TOPICS = ['All', 'Loops', 'Patterns', 'Arrays', 'Strings', 'OOP', 'Methods'];

export const ProgramSearch: React.FC<ProgramSearchProps> = ({
  searchQuery,
  onSearchChange,
  selectedTopic,
  onTopicChange,
  topics = DEFAULT_TOPICS,
}) => {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search programs by title or code..."
          className="w-full h-12 pl-11 pr-10 rounded-btn border border-border bg-white text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm md:text-base shadow-xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Topic Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {topics.map((topic) => (
          <Chip
            key={topic}
            label={topic}
            active={selectedTopic === topic}
            onClick={() => onTopicChange(topic)}
          />
        ))}
      </div>
    </div>
  );
};
