import React, { useState, useRef, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { TestimonyMediaItem, MediaType, UserRole } from '../types';
import {
  Camera,
  Mic,
  Video,
  Upload,
  Play,
  Pause,
  Star,
  Heart,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Radio,
  Clock,
  MapPin,
  User,
  Square,
  Sparkles,
  Share2,
} from 'lucide-react';
import { playDingSound } from '../utils/audioUtils';

interface MediaTestimonyScreenProps {
  userRole: UserRole;
  theme: 'light' | 'dark';
  onSuccessToast: (title: string, message: string) => void;
  onNavigateToStream?: () => void;
}

export const MediaTestimonyScreen: React.FC<MediaTestimonyScreenProps> = ({
  userRole,
  theme,
  onSuccessToast,
  onNavigateToStream,
}) => {
  const [activeTab, setActiveTab] = useState<'gallery' | 'upload'>('gallery');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [filterCentre, setFilterCentre] = useState<string>('all');
  const [testimonies, setTestimonies] = useState<TestimonyMediaItem[]>([]);

  // Form states
  const [mediaType, setMediaType] = useState<MediaType>('picture');
  const [title, setTitle] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [centreId, setCentreId] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Picture upload state
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureBlob, setPictureBlob] = useState<Blob | null>(null);

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Video state (Max 1 minute)
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Active audio player state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);

  const centres = dataService.getCentres();

  useEffect(() => {
    const updateList = () => {
      setTestimonies(dataService.getTestimonies());
    };
    updateList();
    const unsubscribe = dataService.subscribe(updateList);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (centres.length > 0 && !centreId) {
      setCentreId(centres[0].id);
    }
  }, [centres, centreId]);

  // Clean up audio playback on unmount
  useEffect(() => {
    return () => {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // --- Voice Recording Logic ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported in this browser.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please grant permission or upload an audio file.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
  };

  // --- Image Upload Handler ---
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPictureBlob(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPicturePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Video Upload Handler (with 1-min duration check) ---
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setVideoError(null);
    if (!file) return;

    // Check mime type
    if (!file.type.startsWith('video/')) {
      setVideoError('Please upload a valid video file (MP4, WebM, MOV).');
      return;
    }

    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      const duration = Math.round(video.duration);
      setVideoDuration(duration);

      if (duration > 60) {
        setVideoError(
          `Video is ${duration} seconds. To ensure fast stream playback, please select or trim a video under 60 seconds (1 minute max).`
        );
        setVideoFile(null);
        setVideoUrl(null);
      } else {
        setVideoFile(file);
        setVideoUrl(url);
      }
    };

    video.onerror = () => {
      setVideoError('Could not decode video file metadata. Please try a standard MP4 or WebM video.');
    };

    video.src = url;
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contributorName.trim()) {
      alert('Please enter a title and soul-winner contributor name.');
      return;
    }

    const selectedCentre = centres.find((c) => c.id === centreId) || centres[0];

    setIsSubmitting(true);
    try {
      let finalUrl = '';
      let blobToSave: Blob | undefined;
      let duration: number | undefined;

      if (mediaType === 'picture') {
        if (!picturePreview) {
          alert('Please select a photo to upload.');
          setIsSubmitting(false);
          return;
        }
        finalUrl = picturePreview;
        blobToSave = pictureBlob || undefined;
      } else if (mediaType === 'audio_testimony') {
        if (!audioUrl || !audioBlob) {
          alert('Please record a voice testimony or upload an audio clip.');
          setIsSubmitting(false);
          return;
        }
        finalUrl = audioUrl;
        blobToSave = audioBlob;
        duration = recordingSeconds || 30;
      } else if (mediaType === 'video_testimony') {
        if (!videoUrl || !videoFile) {
          alert('Please upload a short video clip (maximum 1 minute).');
          setIsSubmitting(false);
          return;
        }
        finalUrl = videoUrl;
        blobToSave = videoFile;
        duration = videoDuration || 45;
      }

      await dataService.addTestimony(
        {
          title: title.trim(),
          contributorName: contributorName.trim(),
          centreId: selectedCentre.id,
          centreName: selectedCentre.name,
          areaCouncilCode: selectedCentre.areaCouncilCode || 'AMAC',
          mediaType,
          url: finalUrl,
          durationSeconds: duration,
          caption: caption.trim(),
          isFeatured: true, // Automatically featured on live stream!
          approved: true,
        },
        blobToSave
      );

      playDingSound();
      onSuccessToast(
        'Testimony Uploaded!',
        `Your ${mediaType === 'picture' ? 'photo' : mediaType === 'audio_testimony' ? 'voice note' : '1-min video'} has been broadcast to the Live Stream and Collation Hub.`
      );

      // Reset form
      setTitle('');
      setCaption('');
      setPicturePreview(null);
      setPictureBlob(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSeconds(0);
      setVideoFile(null);
      setVideoUrl(null);
      setVideoDuration(null);
      setActiveTab('gallery');
    } catch (err) {
      console.error('Error submitting testimony:', err);
      alert('Failed to upload media. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Audio Player Helper ---
  const togglePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      activeAudioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      const audio = new Audio(url);
      activeAudioRef.current = audio;
      audio.play();
      setPlayingAudioId(id);
      audio.onended = () => {
        setPlayingAudioId(null);
      };
    }
  };

  const filteredTestimonies = testimonies.filter((t) => {
    if (filterType !== 'all' && t.mediaType !== filterType) return false;
    if (filterCentre !== 'all' && t.centreId !== filterCentre) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div
        className={`rounded-2xl p-6 sm:p-8 border shadow-sm relative overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
            : 'bg-gradient-to-r from-white via-indigo-50/50 to-white border-slate-200'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Collation Media & Testimonies
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Field Testimonies & Media Hub
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Upload evangelism photos, voice clips, and short 1-minute videos of souls won across Abuja. Featured media appears live on the YouTube broadcast and church projectors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {onNavigateToStream && (
              <button
                onClick={onNavigateToStream}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-500/20 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                Open Live Stream View
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gallery'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Media Gallery ({testimonies.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload New Testimony
          </button>
        </div>

        {activeTab === 'gallery' && (
          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300"
            >
              <option value="all">All Media</option>
              <option value="picture">Photos Only</option>
              <option value="audio_testimony">Voice Notes</option>
              <option value="video_testimony">1-Min Videos</option>
            </select>

            <select
              value={filterCentre}
              onChange={(e) => setFilterCentre(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 max-w-[150px] truncate"
            >
              <option value="all">All Centres</option>
              {centres.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: UPLOAD TESTIMONY */}
      {activeTab === 'upload' && (
        <div
          className={`rounded-2xl p-6 sm:p-8 border shadow-sm ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
            <div>
              <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                Select Media Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setMediaType('picture')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                    mediaType === 'picture'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Evangelism Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('audio_testimony')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                    mediaType === 'audio_testimony'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Mic className="w-6 h-6" />
                  <span className="text-xs">Voice Testimony</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMediaType('video_testimony')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                    mediaType === 'video_testimony'
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <Video className="w-6 h-6" />
                  <span className="text-xs">1-Min Video Clip</span>
                </button>
              </div>
            </div>

            {/* Media Upload Body */}
            {mediaType === 'picture' && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Outreach / Convert Photo
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                  {picturePreview ? (
                    <div className="space-y-3">
                      <img
                        src={picturePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-xl object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPicturePreview(null);
                          setPictureBlob(null);
                        }}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove and choose another
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Camera className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Drag and drop an evangelism photo or click to browse
                      </p>
                      <p className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-4 text-xs mx-auto block file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {mediaType === 'audio_testimony' && (
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Record or Upload Voice Clip (Max 60s)
                </label>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-950/40 text-center space-y-4">
                  {isRecording ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-red-600 animate-ping mx-auto flex items-center justify-center text-white" />
                      <div className="text-lg font-bold text-red-600">
                        Recording... 00:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds} / 01:00
                      </div>
                      <p className="text-xs text-slate-500">
                        Speak clearly about the soul won and the miracle of salvation.
                      </p>
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Square className="w-4 h-4 fill-white" />
                        Stop Recording
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {audioUrl ? (
                        <div className="space-y-3">
                          <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Voice Note Ready ({recordingSeconds}s)
                          </p>
                          <audio src={audioUrl} controls className="mx-auto w-full max-w-md" />
                          <button
                            type="button"
                            onClick={() => {
                              setAudioUrl(null);
                              setAudioBlob(null);
                              setRecordingSeconds(0);
                            }}
                            className="text-xs text-rose-600 hover:underline block mx-auto"
                          >
                            Re-record voice note
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <button
                            type="button"
                            onClick={startRecording}
                            className="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform hover:scale-105 cursor-pointer"
                          >
                            <Mic className="w-7 h-7" />
                          </button>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            Tap to Record Voice Testimony
                          </p>
                          <p className="text-xs text-slate-500">
                            Uses your phone or computer microphone directly.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-xs text-slate-500">Or upload audio file: </span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setAudioBlob(file);
                          setAudioUrl(URL.createObjectURL(file));
                          setRecordingSeconds(45);
                        }
                      }}
                      className="text-xs inline-block ml-2 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-slate-200 dark:file:bg-slate-700 text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {mediaType === 'video_testimony' && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Short 1-Minute Video Clip
                </label>
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 transition-colors">
                  {videoError && (
                    <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 text-left">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{videoError}</span>
                    </div>
                  )}

                  {videoUrl ? (
                    <div className="space-y-3">
                      <video
                        src={videoUrl}
                        controls
                        className="max-h-64 mx-auto rounded-xl shadow-sm bg-black"
                      />
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <Clock className="w-3.5 h-3.5" />
                        Duration: {videoDuration}s (Within 1-min limit)
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoUrl(null);
                          setVideoDuration(null);
                        }}
                        className="text-xs text-rose-600 hover:underline block mx-auto"
                      >
                        Choose different video
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Video className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Select a 1-minute video testimony
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        MP4, WebM or MOV (Maximum 60 seconds)
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="mt-4 text-xs mx-auto block file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Testimony Title / Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15 Youth Accepted Christ at Wuse Market"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Soul Winner / Contributor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bro. Emmanuel Eze"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Collation Centre Hub *
              </label>
              <select
                value={centreId}
                onChange={(e) => setCentreId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.areaCouncilCode || 'Abuja FCT'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Soul Winning Story / Caption
              </label>
              <textarea
                rows={3}
                placeholder="Share what God did on the field! What was the convert's reaction?"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              {isSubmitting ? 'Uploading & Broadcasting...' : 'Broadcast to Live Stream & Collation'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: TESTIMONIES GALLERY */}
      {activeTab === 'gallery' && (
        <div>
          {filteredTestimonies.length === 0 ? (
            <div
              className={`rounded-2xl p-12 text-center border ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              <Camera className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                No testimonies match your filter
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Be the first to upload an evangelism photo, audio clip, or 1-minute video clip!
              </p>
              <button
                onClick={() => setActiveTab('upload')}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                Upload Testimony
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTestimonies.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Media Frame */}
                  <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                    {item.mediaType === 'picture' && (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                      />
                    )}

                    {item.mediaType === 'video_testimony' && (
                      <video
                        src={item.url}
                        poster={item.thumbnailUrl}
                        controls
                        className="w-full h-full object-contain"
                      />
                    )}

                    {item.mediaType === 'audio_testimony' && (
                      <div className="p-6 text-center w-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white">
                        <div className="w-14 h-14 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mb-3">
                          <Mic className="w-7 h-7 text-indigo-300" />
                        </div>
                        <p className="text-xs font-medium text-indigo-200 mb-2">Voice Testimony</p>
                        <button
                          onClick={() => togglePlayAudio(item.id, item.url)}
                          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-transform hover:scale-105 cursor-pointer shadow-md"
                        >
                          {playingAudioId === item.id ? (
                            <>
                              <Pause className="w-3.5 h-3.5" /> Pause Clip
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" /> Listen ({item.durationSeconds || 40}s)
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Format Pill */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/60 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                      {item.mediaType === 'picture' && <Camera className="w-3 h-3 text-sky-400" />}
                      {item.mediaType === 'audio_testimony' && <Mic className="w-3 h-3 text-amber-400" />}
                      {item.mediaType === 'video_testimony' && <Video className="w-3 h-3 text-rose-400" />}
                      <span>
                        {item.mediaType === 'picture'
                          ? 'Photo'
                          : item.mediaType === 'audio_testimony'
                          ? 'Voice Note'
                          : '1-Min Video'}
                      </span>
                    </div>

                    {/* Featured Badge */}
                    {item.isFeatured && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-600/80 backdrop-blur-md text-white border border-emerald-400/30 flex items-center gap-1">
                        <Radio className="w-3 h-3 animate-pulse" />
                        Live on Stream
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{item.centreName}</span>
                        <span>•</span>
                        <span>{item.areaCouncilCode}</span>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-2 mb-2">
                        {item.title}
                      </h3>

                      {item.caption && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
                          {item.caption}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[120px] font-medium">{item.contributorName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Like Button */}
                        <button
                          onClick={() => dataService.likeTestimony(item.id)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Heart className="w-3.5 h-3.5 fill-rose-500/20 text-rose-500" />
                          <span className="text-[11px] font-semibold">{item.likesCount}</span>
                        </button>

                        {/* Feature Toggle for Coordinators/Admins */}
                        {(userRole === 'admin' || userRole === 'coordinator') && (
                          <button
                            onClick={() => dataService.toggleFeatureTestimony(item.id)}
                            title={item.isFeatured ? 'Remove from Stream' : 'Feature on YouTube Stream'}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              item.isFeatured
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                                : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${item.isFeatured ? 'fill-amber-400' : ''}`} />
                          </button>
                        )}

                        {/* Delete Button for Admins */}
                        {userRole === 'admin' && (
                          <button
                            onClick={() => {
                              if (confirm('Delete this testimony?')) {
                                dataService.deleteTestimony(item.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
