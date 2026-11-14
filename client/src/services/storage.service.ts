export interface RecordingSession {
  id: string;
  createdAt: number;
  durationSeconds: number;
  mode: 'strict' | 'flexible' | 'coach';
  scriptTitle?: string;
  scriptText?: string;
  overallScore: number;
  categoryScores: {
    delivery: number;
    technical: number;
    scriptFidelity: number;
    audioQuality: number;
    contentStructure: number;
  };
  transcript: string;
  reportData: any;
  notesCount: number;
  videoBlobUrl?: string;
}

export interface SavedScript {
  id: string;
  title: string;
  category: string;
  rawText: string;
  objective?: string;
  updatedAt: number;
}

const DB_NAME = 'framepilot_db';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const SCRIPTS_STORE = 'scripts';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SCRIPTS_STORE)) {
        db.createObjectStore(SCRIPTS_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export class StorageService {
  // --- SESSIONS ---
  public static async saveSession(session: RecordingSession): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      tx.objectStore(SESSIONS_STORE).put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async getAllSessions(): Promise<RecordingSession[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readonly');
      const req = tx.objectStore(SESSIONS_STORE).getAll();
      req.onsuccess = () => {
        const results = req.result as RecordingSession[];
        // Sort newest first
        results.sort((a, b) => b.createdAt - a.createdAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async getSessionById(id: string): Promise<RecordingSession | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readonly');
      const req = tx.objectStore(SESSIONS_STORE).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteSession(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SESSIONS_STORE, 'readwrite');
      tx.objectStore(SESSIONS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- SCRIPTS ---
  public static async saveScript(script: SavedScript): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SCRIPTS_STORE, 'readwrite');
      tx.objectStore(SCRIPTS_STORE).put(script);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  public static async getAllScripts(): Promise<SavedScript[]> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SCRIPTS_STORE, 'readonly');
      const req = tx.objectStore(SCRIPTS_STORE).getAll();
      req.onsuccess = () => {
        const results = req.result as SavedScript[];
        results.sort((a, b) => b.updatedAt - a.updatedAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  public static async deleteScript(id: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SCRIPTS_STORE, 'readwrite');
      tx.objectStore(SCRIPTS_STORE).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- EXPORTS ---
  public static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  public static exportJson(data: any, filename: string = 'framepilot-report.json'): void {
    const content = JSON.stringify(data, null, 2);
    this.downloadFile(content, filename, 'application/json');
  }

  public static exportNotesCsv(
    notes: Array<{ timestamp: number; type: string; message: string; severity: string }>,
    filename: string = 'director-notes.csv'
  ): void {
    const header = 'Timestamp (s),Type,Severity,Message\n';
    const rows = notes
      .map(n => `${n.timestamp},"${n.type}","${n.severity}","${n.message.replace(/"/g, '""')}"`)
      .join('\n');
    this.downloadFile(header + rows, filename, 'text/csv;charset=utf-8;');
  }

  public static exportTranscriptTxt(transcript: string, filename: string = 'take-transcript.txt'): void {
    this.downloadFile(transcript, filename, 'text/plain;charset=utf-8;');
  }
}

