import { create } from 'zustand';
import { RecordingSession, SavedScript } from '../services/storage.service.js';

export type DirectorMode = 'strict' | 'flexible' | 'coach';
export type PrivacyMode = 'local' | 'ai-assisted' | 'transcript-only';

interface AppState {
  directorMode: DirectorMode;
  privacyMode: PrivacyMode;
  hasFrameConsent: boolean;

  selectedCameraId: string;
  selectedMicId: string;

  activeScript: SavedScript | null;
  recentSessions: RecordingSession[];
  lastReport: any | null;
  lastRecordedBlobUrl: string | null;

  setDirectorMode: (mode: DirectorMode) => void;
  setPrivacyMode: (mode: PrivacyMode) => void;
  setHasFrameConsent: (consent: boolean) => void;
  setSelectedCameraId: (id: string) => void;
  setSelectedMicId: (id: string) => void;
  setActiveScript: (script: SavedScript | null) => void;
  setRecentSessions: (sessions: RecordingSession[]) => void;
  setLastReport: (report: any) => void;
  setLastRecordedBlobUrl: (url: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  directorMode: 'flexible',
  privacyMode: 'local', // Privacy-first default
  hasFrameConsent: false, // Never preselected!

  selectedCameraId: '',
  selectedMicId: '',

  activeScript: null,
  recentSessions: [],
  lastReport: null,
  lastRecordedBlobUrl: null,

  setDirectorMode: (mode) => set({ directorMode: mode }),
  setPrivacyMode: (mode) => set({ privacyMode: mode }),
  setHasFrameConsent: (consent) => set({ hasFrameConsent: consent }),
  setSelectedCameraId: (id) => set({ selectedCameraId: id }),
  setSelectedMicId: (id) => set({ selectedMicId: id }),
  setActiveScript: (script) => set({ activeScript: script }),
  setRecentSessions: (sessions) => set({ recentSessions: sessions }),
  setLastReport: (report) => set({ lastReport: report }),
  setLastRecordedBlobUrl: (url) => set({ lastRecordedBlobUrl: url })
}));

