import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { UserRole, TestimonyMediaItem, MediaType } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  Camera,
  Video,
  Mic,
  Heart,
  Sparkles,
  Radio,
  Share2,
  Plus,
  Play,
  Upload,
} from 'lucide-react';

interface MediaTestimonyScreenProps {
  userRole: UserRole;
  theme?: 'dark' | 'light';
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToStream: () => void;
}

export const MediaTestimonyScreen: React.FC<MediaTestimonyScreenProps> = ({
  userRole,
  onSuccessToast,
  onNavigateToStream,
}) => {
  const { palette } = useTheme();
  const [testimonies, setTestimonies] = useState<TestimonyMediaItem[]>(
    dataService.getTestimonies()
  );
  const [filterType, setFilterType] = useState<'all' | MediaType>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('picture');
  const [centreName, setCentreName] = useState('Abuja Central Hub');
  const [caption, setCaption] = useState('');

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setTestimonies(dataService.getTestimonies());
    });
    return unsub;
  }, []);

  const handleLike = (id: string) => {
    dataService.likeTestimony(id);
    setTestimonies(dataService.getTestimonies());
  };

  const handleCreateTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await dataService.addTestimony({
      title: title.trim(),
      mediaType,
      contributorName: contributorName.trim() || 'Evangelist',
      centreId: 'cnt-abj-01',
      centreName: centreName.trim() || 'Abuja Hub',
      url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      caption: caption.trim() || undefined,
      approved: true,
      isFeatured: false,
    });

    onSuccessToast('Testimony Published', 'Praise report recorded to the media feed.');
    setTitle('');
    setCaption('');
    setShowUploadModal(false);
    setTestimonies(dataService.getTestimonies());
  };

  const filtered = testimonies.filter(
    t => filterType === 'all' || t.mediaType === filterType
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              Media & Field Testimonies
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-life testimonies, salvation voice notes, and evangelism harvest photos from across Abuja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToStream}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Live Stream Mode</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Praise Report</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {(
          [
            { id: 'all', label: 'All Praise Reports' },
            { id: 'picture', label: 'Field Photos' },
            { id: 'video_testimony', label: '1-Min Videos' },
            { id: 'audio_testimony', label: 'Audio Voice Notes' },
          ] as const
        ).map(f => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === f.id
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Testimony Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(item => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
          >
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  {item.mediaType === 'video_testimony' ? (
                    <Video className="w-3 h-3 text-red-500" />
                  ) : item.mediaType === 'audio_testimony' ? (
                    <Mic className="w-3 h-3 text-indigo-500" />
                  ) : (
                    <Camera className="w-3 h-3 text-emerald-500" />
                  )}
                  <span>
                    {item.mediaType === 'video_testimony'
                      ? 'Video'
                      : item.mediaType === 'audio_testimony'
                      ? 'Voice Note'
                      : 'Photo'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(item.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                {item.title}
              </h4>

              {item.caption && (
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                  "{item.caption}"
                </p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>By {item.contributorName}</span>
              <button
                onClick={() => handleLike(item.id)}
                className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
              >
                <Heart className="w-4 h-4 fill-rose-500" />
                <span>{item.likesCount || 0}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Upload Harvest Praise Report
            </h3>

            <form onSubmit={handleCreateTestimony} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Praise Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant Peace & Miracle Confession"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Media Category
                  </label>
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value as MediaType)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs cursor-pointer"
                  >
                    <option value="picture">Field Photo</option>
                    <option value="video_testimony">Short Video (1-Min)</option>
                    <option value="audio_testimony">Salvation Voice Note</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Soul Winner Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Evangelist Joshua"
                    value={contributorName}
                    onChange={e => setContributorName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Testimony Narrative / Caption
                </label>
                <textarea
                  rows={3}
                  placeholder="Write testimony details..."
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold cursor-pointer"
                >
                  Publish Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
