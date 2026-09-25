import React, { useState, useEffect, useRef } from 'react';
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
  Square,
  Trash2,
  CheckCircle2,
  Volume2,
  X,
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
  const [centreName, setCentreName] = useState('Abuja Central Collation Hub');
  const [caption, setCaption] = useState('');

  // Media file & recording state
  const [selectedFile, setSelectedFile] = useState<Blob | File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      if (file.type.startsWith('video/')) {
        setMediaType('video_testimony');
      } else if (file.type.startsWith('audio/')) {
        setMediaType('audio_testimony');
      } else {
        setMediaType('picture');
      }
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setSelectedFile(audioBlob);
        setFileName(`Voice_Recording_${Date.now()}.webm`);
        const url = URL.createObjectURL(audioBlob);
        setPreviewUrl(url);
        setMediaType('audio_testimony');
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone access is required to record salvation voice notes.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearSelectedMedia = () => {
    setSelectedFile(null);
    setPreviewUrl('');
    setFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateTestimony = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalUrl = previewUrl;
    if (!finalUrl && selectedFile) {
      finalUrl = URL.createObjectURL(selectedFile);
    }
    if (!finalUrl) {
      finalUrl = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';
    }

    await dataService.addTestimony(
      {
        title: title.trim(),
        mediaType,
        contributorName: contributorName.trim() || 'Soul Winner',
        centreId: 'cnt-abj-01',
        centreName: centreName.trim() || 'Abuja Central Collation Hub',
        url: finalUrl,
        caption: caption.trim() || undefined,
        approved: true,
        isFeatured: false,
      },
      selectedFile || undefined
    );

    onSuccessToast('Praise Report Published', 'Media testimony successfully uploaded and saved.');
    setTitle('');
    setCaption('');
    setContributorName('');
    clearSelectedMedia();
    setShowUploadModal(false);
    setTestimonies(dataService.getTestimonies());
  };

  const filtered = testimonies.filter(
    (t) => filterType === 'all' || t.mediaType === filterType
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
            Real-life testimonies, salvation voice notes, and field harvest photos from across Abuja.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onNavigateToStream}
            className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span>Live Stream Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs hover:opacity-90"
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
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilterType(f.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        {filtered.map((item) => (
          <div
            key={item.id}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
          >
            {/* Render Media Assets */}
            {item.mediaType === 'picture' && item.url && (
              <div className="w-full h-52 overflow-hidden bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800">
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}

            {item.mediaType === 'video_testimony' && item.url && (
              <div className="w-full h-56 bg-black flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-slate-800">
                <video src={item.url} controls className="w-full h-full object-contain" />
              </div>
            )}

            <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
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
                        ? 'Video Clip'
                        : item.mediaType === 'audio_testimony'
                        ? 'Voice Note'
                        : 'Field Photo'}
                    </span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleDateString('en-GB')}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h4>

                {item.mediaType === 'audio_testimony' && item.url && (
                  <div className="p-3 my-2 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/60 dark:border-indigo-800/50 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      <Volume2 className="w-4 h-4 text-indigo-500" />
                      <span>Salvation Voice Note</span>
                    </div>
                    <audio src={item.url} controls className="w-full h-9 rounded-lg" />
                  </div>
                )}

                {item.caption && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{item.caption}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  By {item.contributorName}
                </span>
                <button
                  type="button"
                  onClick={() => handleLike(item.id)}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold cursor-pointer bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500" />
                  <span>{item.likesCount || 0}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-500" />
                Upload Harvest Praise Report
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestimony} className="space-y-4 text-xs">
              {/* Media File Input / Voice Recorder Dropzone */}
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                <label className="font-bold text-slate-800 dark:text-slate-200 block">
                  Select Photo / Video / Voice Note File *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-file-input"
                />

                {!previewUrl && !isRecording && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 py-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    <label
                      htmlFor="media-file-input"
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs hover:opacity-90"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Choose Media File</span>
                    </label>

                    <span className="text-slate-400 font-bold">OR</span>

                    <button
                      type="button"
                      onClick={startVoiceRecording}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Mic className="w-4 h-4" />
                      <span>Record Live Voice Note</span>
                    </button>
                  </div>
                )}

                {/* Voice Recorder Active Indicator */}
                {isRecording && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold animate-pulse">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <Mic className="w-4 h-4 text-rose-500" />
                      <span>Recording Voice Note: {recordingSeconds}s</span>
                    </div>
                    <button
                      type="button"
                      onClick={stopVoiceRecording}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Square className="w-3.5 h-3.5 fill-white" />
                      <span>Stop & Save</span>
                    </button>
                  </div>
                )}

                {/* Selected File / Audio Live Preview */}
                {previewUrl && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[240px]">
                        {fileName || 'Selected Media Asset'}
                      </span>
                      <button
                        type="button"
                        onClick={clearSelectedMedia}
                        className="text-rose-500 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title="Remove Media"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Preview Player */}
                    {mediaType === 'picture' && (
                      <div className="w-full h-40 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {mediaType === 'video_testimony' && (
                      <div className="w-full h-40 bg-black rounded-xl overflow-hidden flex items-center justify-center">
                        <video src={previewUrl} controls className="w-full h-full object-contain" />
                      </div>
                    )}
                    {mediaType === 'audio_testimony' && (
                      <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                        <audio src={previewUrl} controls className="w-full h-8" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Metadata Inputs */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Praise Report Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Instant Peace & Miracle Salvation Confession"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                    onChange={(e) => setMediaType(e.target.value as MediaType)}
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
                    placeholder="e.g. Brother Joshua"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
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
                  placeholder="Write testimony details or field notes..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold cursor-pointer shadow-xs hover:opacity-90"
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
