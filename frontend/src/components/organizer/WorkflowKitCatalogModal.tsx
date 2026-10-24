import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  Trophy,
  GraduationCap,
  Briefcase,
  Heart,
  FileText,
  Check,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WorkflowTemplateKit } from '../../types';

interface WorkflowKitCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKitApplied?: (kitName: string) => void;
}

const CATEGORIES = [
  'All',
  'School & Youth',
  'Conferences & Seminars',
  'Tech & Innovation',
  'Sports & Athletics',
  'Outreach & Community',
  'Festivals & Cultural',
];

export const WorkflowKitCatalogModal: React.FC<WorkflowKitCatalogModalProps> = ({
  isOpen,
  onClose,
  onKitApplied,
}) => {
  const { workflowKits, loadTaskTemplate } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [appliedKitId, setAppliedKitId] = useState<string | null>(null);

  const filteredKits = useMemo(() => {
    return workflowKits.filter((kit) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        kit.name.toLowerCase().includes(q) ||
        kit.description.toLowerCase().includes(q) ||
        kit.tagline.toLowerCase().includes(q) ||
        (kit.tags && kit.tags.some((t) => t.toLowerCase().includes(q))) ||
        (kit.milestones && kit.milestones.some((m) => m.toLowerCase().includes(q)));

      const matchesCat =
        selectedCategory === 'All' || kit.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [workflowKits, searchQuery, selectedCategory]);

  const handleApply = (kit: WorkflowTemplateKit) => {
    loadTaskTemplate(kit.id);
    setAppliedKitId(kit.id);
    if (onKitApplied) {
      onKitApplied(kit.name);
    }
    setTimeout(() => {
      setAppliedKitId(null);
      onClose();
    }, 900);
  };

  const getKitIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />;
      case 'Trophy':
        return <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-500 dark:text-rose-400" />;
      case 'FileText':
        return <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#3E6CB5] dark:text-[#7EA6E0]" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#171E2B] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4 bg-[#FAF9F5] dark:bg-[#12161F]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[#EBF3FC] dark:bg-[#1E293B] text-[#3E6CB5] dark:text-[#7EA6E0]">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Browse Event Workflow Kits
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#2B6149] dark:bg-[#17271F] dark:text-[#81B89B]">
                {workflowKits.length} Kits Available
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select a pre-engineered event template. All tasks will be initialized in <strong>To Do</strong> state and automatically mapped to your committee assignments.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 space-y-3 bg-white dark:bg-[#171E2B]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search kits by name, category, or keyword (e.g. 'School', 'Technology', 'Sports', 'Symposium', 'Orientation')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFD] dark:bg-[#111722] border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3E6CB5]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#3E6CB5] text-white shadow-xs'
                    : 'bg-[#F8FAFD] dark:bg-[#111722] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Kits Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {filteredKits.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No matching workflow kits found
              </p>
              <p className="text-xs text-slate-400">
                Try searching for "School", "Conference", "Outreach", or select "All" categories.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredKits.map((kit) => {
                const isApplied = appliedKitId === kit.id;

                return (
                  <div
                    key={kit.id}
                    className="bg-white dark:bg-[#171E2B] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-[#3E6CB5]/50 dark:hover:border-[#7EA6E0]/50 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-[#FAF9F5] dark:bg-[#111722] border border-slate-100 dark:border-slate-800 shrink-0">
                            {getKitIcon(kit.icon)}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {kit.category}
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#3E6CB5] dark:group-hover:text-[#7EA6E0] transition-colors leading-tight">
                              {kit.name}
                            </h3>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                          {kit.task_count} Tasks
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {kit.description}
                      </p>

                      {/* Milestones Preview */}
                      {kit.milestones && kit.milestones.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Key Milestones:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {kit.milestones.slice(0, 3).map((m, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-[#FAF9F5] dark:bg-[#111722] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800 truncate max-w-[200px]"
                              >
                                {m}
                              </span>
                            ))}
                            {kit.milestones.length > 3 && (
                              <span className="text-[10px] px-1.5 py-0.5 text-slate-400">
                                +{kit.milestones.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Apply Button */}
                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => handleApply(kit)}
                        disabled={isApplied}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#EBF3FC] hover:bg-[#3E6CB5] text-[#244A85] hover:text-white dark:bg-[#1E293B] dark:hover:bg-[#3E6CB5] dark:text-[#8BB0E8] dark:hover:text-white border border-[#C8DCF7] dark:border-[#2D4160]'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Applied to Event!</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Apply Kit to Event</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-[#FAF9F5] dark:bg-[#12161F]">
          <span>Tip: You can refine or manually override individual task owners anytime.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#171E2B] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
