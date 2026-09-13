import {
  Hospital,
  Ward,
  Bed,
  Doctor,
  StaffRoster,
  Token,
  SyncEvent,
  BedStatus,
  DoctorStatus,
  TokenStatus,
  WardType,
} from '../types';
import {
  INITIAL_HOSPITALS,
  INITIAL_WARDS,
  INITIAL_BEDS,
  INITIAL_DOCTORS,
  INITIAL_STAFF_ROSTER,
  INITIAL_TOKENS,
} from '../data/mockDatabase';

const STORAGE_KEYS = {
  HOSPITALS: 'swasthya_setu_hospitals_v1',
  WARDS: 'swasthya_setu_wards_v1',
  BEDS: 'swasthya_setu_beds_v1',
  DOCTORS: 'swasthya_setu_doctors_v1',
  ROSTER: 'swasthya_setu_roster_v1',
  TOKENS: 'swasthya_setu_tokens_v1',
};

type EventListener = (event: SyncEvent) => void;

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<EventListener> = new Set();
  private terminalId: string;
  private lastPingMs: number = 4;

  constructor() {
    this.terminalId = `term_${Math.random().toString(36).substring(2, 9)}`;

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('swasthya_setu_bus');
        this.channel.onmessage = (messageEvent: MessageEvent<SyncEvent>) => {
          this.handleIncomingSync(messageEvent.data);
        };
      } catch (err) {
        console.warn('BroadcastChannel not supported in this frame, falling back to local bus.', err);
      }

      window.addEventListener('storage', (e) => {
        if (e.key === 'swasthya_setu_sync_ping' && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue) as SyncEvent;
            if (parsed.sourceTerminal !== this.terminalId) {
              this.handleIncomingSync(parsed);
            }
          } catch (error) {
            console.error('Storage sync error:', error);
          }
        }
      });
    }

    this.ensureInitialized();
  }

  public getTerminalId(): string {
    return this.terminalId;
  }

  public getLastPing(): number {
    return this.lastPingMs;
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.HOSPITALS)) {
      localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.WARDS)) {
      localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(INITIAL_WARDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BEDS)) {
      localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(INITIAL_BEDS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.DOCTORS)) {
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROSTER)) {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(INITIAL_STAFF_ROSTER));
    }
    if (!localStorage.getItem(STORAGE_KEYS.TOKENS)) {
      localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(INITIAL_TOKENS));
    }
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyAll(event: SyncEvent) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    });
  }

  private broadcast(event: SyncEvent) {
    const startTime = performance.now();
    this.notifyAll(event);

    if (this.channel) {
      try {
        this.channel.postMessage(event);
      } catch (err) {
        console.error('BroadcastChannel post error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('swasthya_setu_sync_ping', JSON.stringify({
          ...event,
          _nonce: Math.random(),
        }));
      } catch (e) {
        // quota ignore
      }
    }

    this.lastPingMs = Math.max(1, Math.round(performance.now() - startTime));
  }

  private handleIncomingSync(event: SyncEvent) {
    if (event.type === 'TOKEN_CALLED') {
      this.playHospitalChime();
    }
    this.notifyAll(event);
  }

  // Web Audio chime for "Now Serving" or emergency alert
  public playHospitalChime() {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.65);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  }

  // --- Getters ---

  public getHospitals(): Hospital[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HOSPITALS);
      return data ? JSON.parse(data) : INITIAL_HOSPITALS;
    } catch {
      return INITIAL_HOSPITALS;
    }
  }

  public getWards(hospitalId: string = 'hosp-aiims-delhi'): Ward[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WARDS);
      const parsed = data ? JSON.parse(data) : INITIAL_WARDS;
      return parsed[hospitalId] || INITIAL_WARDS['hosp-aiims-delhi'] || [];
    } catch {
      return INITIAL_WARDS['hosp-aiims-delhi'] || [];
    }
  }

  public getBeds(hospitalId: string = 'hosp-aiims-delhi'): Bed[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BEDS);
      const parsed = data ? JSON.parse(data) : INITIAL_BEDS;
      return parsed[hospitalId] || INITIAL_BEDS['hosp-aiims-delhi'] || [];
    } catch {
      return INITIAL_BEDS['hosp-aiims-delhi'] || [];
    }
  }

  public getDoctors(hospitalId: string = 'hosp-aiims-delhi'): Doctor[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      const parsed: Doctor[] = data ? JSON.parse(data) : INITIAL_DOCTORS;
      return parsed.filter((d) => d.hospitalId === hospitalId);
    } catch {
      return INITIAL_DOCTORS;
    }
  }

  public getStaffRoster(hospitalId: string = 'hosp-aiims-delhi'): StaffRoster {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROSTER);
      const parsed = data ? JSON.parse(data) : INITIAL_STAFF_ROSTER;
      return parsed[hospitalId] || INITIAL_STAFF_ROSTER['hosp-aiims-delhi'];
    } catch {
      return INITIAL_STAFF_ROSTER['hosp-aiims-delhi'];
    }
  }

  public getTokens(hospitalId: string = 'hosp-aiims-delhi'): Token[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
      const parsed: Token[] = data ? JSON.parse(data) : INITIAL_TOKENS;
      return parsed.filter((t) => t.hospitalId === hospitalId);
    } catch {
      return INITIAL_TOKENS;
    }
  }

  // --- Real-time Mutators ---

  public updateBedStatus(
    hospitalId: string,
    bedId: string,
    newStatus: BedStatus,
    patientName?: string
  ): void {
    const allBeds = this.getAllBedsMap();
    const hospitalBeds = allBeds[hospitalId] || [];

    const bedIndex = hospitalBeds.findIndex((b) => b.id === bedId);
    if (bedIndex === -1) return;

    const targetBed = hospitalBeds[bedIndex];
    const prevStatus = targetBed.status;
    targetBed.status = newStatus;
    targetBed.lastUpdated = 'Just now';

    if (newStatus === 'OCCUPIED') {
      targetBed.patientName = patientName || 'Admitted Patient (Emergency Triage)';
      targetBed.admittedAt = 'Just now';
    } else if (newStatus === 'AVAILABLE' || newStatus === 'CLEANING') {
      targetBed.patientName = undefined;
      targetBed.admittedAt = undefined;
    }

    allBeds[hospitalId] = [...hospitalBeds];
    localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(allBeds));

    // Recalculate ward aggregate counts
    this.recalculateWardBedCounts(hospitalId, targetBed.wardId);

    const event: SyncEvent = {
      type: 'BED_STATUS_CHANGED',
      payload: { hospitalId, bedId, newStatus, prevStatus, bedNumber: targetBed.bedNumber, wardType: targetBed.wardType },
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };
    this.broadcast(event);
  }

  private recalculateWardBedCounts(hospitalId: string, wardId: string) {
    const allWards = this.getAllWardsMap();
    const hospitalWards = allWards[hospitalId] || [];
    const wardIndex = hospitalWards.findIndex((w) => w.id === wardId);
    if (wardIndex === -1) return;

    const beds = this.getBeds(hospitalId).filter((b) => b.wardId === wardId);
    if (beds.length > 0) {
      const occupied = beds.filter((b) => b.status === 'OCCUPIED').length;
      const cleaning = beds.filter((b) => b.status === 'CLEANING').length;
      const available = beds.filter((b) => b.status === 'AVAILABLE').length;

      hospitalWards[wardIndex].occupiedBeds = occupied;
      hospitalWards[wardIndex].cleaningBeds = cleaning;
      hospitalWards[wardIndex].availableBeds = available;
      hospitalWards[wardIndex].lastUpdated = 'Just now';
      allWards[hospitalId] = [...hospitalWards];
      localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(allWards));

      // Also update hospital top-level aggregates
      this.recalculateHospitalSummary(hospitalId);
    }
  }

  private recalculateHospitalSummary(hospitalId: string) {
    const hospitals = this.getHospitals();
    const idx = hospitals.findIndex((h) => h.id === hospitalId);
    if (idx === -1) return;

    const wards = this.getWards(hospitalId);
    const totalAvail = wards.reduce((sum, w) => sum + w.availableBeds, 0);
    const icuWard = wards.find((w) => w.type === 'ICU');

    hospitals[idx].availableBeds = totalAvail;
    if (icuWard) {
      hospitals[idx].icuAvailable = icuWard.availableBeds;
    }

    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(hospitals));
  }

  public updateDoctorStatus(doctorId: string, newStatus: DoctorStatus): void {
    const doctors = this.getAllDoctors();
    const idx = doctors.findIndex((d) => d.id === doctorId);
    if (idx === -1) return;

    const oldStatus = doctors[idx].status;
    doctors[idx].status = newStatus;
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));

    const event: SyncEvent = {
      type: 'DOCTOR_STATUS_CHANGED',
      payload: { doctorId, name: doctors[idx].name, newStatus, oldStatus },
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };
    this.broadcast(event);
  }

  public updateStaffCounts(
    hospitalId: string,
    delta: { doctors?: number; nurses?: number; support?: number }
  ): void {
    const rosterMap = this.getAllRosterMap();
    const roster = rosterMap[hospitalId] || INITIAL_STAFF_ROSTER['hosp-aiims-delhi'];

    if (delta.doctors !== undefined) {
      roster.totalDoctorsOnDuty = Math.max(1, roster.totalDoctorsOnDuty + delta.doctors);
    }
    if (delta.nurses !== undefined) {
      roster.totalNursesOnDuty = Math.max(1, roster.totalNursesOnDuty + delta.nurses);
    }
    if (delta.support !== undefined) {
      roster.supportStaffOnDuty = Math.max(1, roster.supportStaffOnDuty + delta.support);
    }
    roster.lastUpdated = 'Synced just now';

    rosterMap[hospitalId] = { ...roster };
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(rosterMap));

    const event: SyncEvent = {
      type: 'STAFF_COUNT_UPDATED',
      payload: { hospitalId, roster: { ...roster } },
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };
    this.broadcast(event);
  }

  public generateToken(params: {
    hospitalId: string;
    hospitalName: string;
    department: string;
    doctorId: string;
    doctorName: string;
    patientId: string;
    patientName: string;
    patientPhone: string;
    priority?: 'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY';
    symptoms?: string;
  }): Token {
    const allTokens = this.getAllTokens();
    const doctorTokens = allTokens.filter(
      (t) => t.doctorId === params.doctorId && (t.status === 'WAITING' || t.status === 'NOW_SERVING')
    );

    const doctor = this.getAllDoctors().find((d) => d.id === params.doctorId);
    const avgVelocity = doctor ? doctor.avgConsultationTimeMin : 10;
    const roomNumber = doctor ? doctor.roomNumber : 'OPD-101';

    // Letter prefix based on department (A for Cardiology, B for Orthopedics, etc.)
    const prefix = params.department.charAt(0).toUpperCase();
    const serial = allTokens.length + 10;
    const tokenNumber = `${prefix}-${String(serial).padStart(3, '0')}`;

    const queuePosition = doctorTokens.filter((t) => t.status === 'WAITING').length + 1;
    const estimatedWaitMinutes = queuePosition * avgVelocity;

    const newToken: Token = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      tokenNumber,
      patientId: params.patientId,
      patientName: params.patientName,
      patientPhone: params.patientPhone,
      hospitalId: params.hospitalId,
      hospitalName: params.hospitalName,
      department: params.department,
      doctorId: params.doctorId,
      doctorName: params.doctorName,
      roomNumber,
      status: 'WAITING',
      queuePosition,
      estimatedWaitMinutes,
      generatedAt: 'Just now',
      priority: params.priority || 'NORMAL',
      symptomsSummary: params.symptoms || 'General consultation request',
      qrCodeSeed: `SS-${params.hospitalId.substring(5, 10)}-${tokenNumber}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    allTokens.push(newToken);
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(allTokens));

    // Update doctor's active queue length
    const doctors = this.getAllDoctors();
    const dIdx = doctors.findIndex((d) => d.id === params.doctorId);
    if (dIdx !== -1) {
      doctors[dIdx].activeQueueLength = queuePosition;
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    }

    const event: SyncEvent = {
      type: 'TOKEN_GENERATED',
      payload: { token: newToken },
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };
    this.broadcast(event);

    return newToken;
  }

  public callNextToken(doctorId: string): { calledToken: Token | null; completedToken: Token | null } {
    const allTokens = this.getAllTokens();
    const doctors = this.getAllDoctors();
    const docIdx = doctors.findIndex((d) => d.id === doctorId);
    const doctor = docIdx !== -1 ? doctors[docIdx] : null;
    const avgVelocity = doctor ? doctor.avgConsultationTimeMin : 10;

    // 1. Find currently serving token and mark as COMPLETED
    const currentServing = allTokens.find(
      (t) => t.doctorId === doctorId && (t.status === 'NOW_SERVING' || t.status === 'IN_CONSULTATION')
    );
    if (currentServing) {
      currentServing.status = 'COMPLETED';
      currentServing.completedAt = 'Just now';
    }

    // 2. Find next waiting token
    const waitingTokens = allTokens
      .filter((t) => t.doctorId === doctorId && t.status === 'WAITING')
      .sort((a, b) => a.queuePosition - b.queuePosition);

    let nextToken: Token | null = null;
    if (waitingTokens.length > 0) {
      nextToken = waitingTokens[0];
      nextToken.status = 'NOW_SERVING';
      nextToken.calledAt = 'Just now';
      nextToken.queuePosition = 0;
      nextToken.estimatedWaitMinutes = 0;

      // Recalculate remaining waiting tokens
      for (let i = 1; i < waitingTokens.length; i++) {
        waitingTokens[i].queuePosition = i;
        waitingTokens[i].estimatedWaitMinutes = i * avgVelocity;
      }
    }

    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(allTokens));

    // Update doctor record with current token
    if (doctor) {
      if (nextToken) {
        doctor.currentTokenNumber = nextToken.tokenNumber;
        doctor.status = 'IN_CONSULTATION';
        doctor.activeQueueLength = Math.max(0, waitingTokens.length - 1);
      } else {
        doctor.currentTokenNumber = undefined;
        doctor.status = 'AVAILABLE';
        doctor.activeQueueLength = 0;
      }
      doctors[docIdx] = { ...doctor };
      localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    }

    const event: SyncEvent = {
      type: 'TOKEN_CALLED',
      payload: {
        doctorId,
        calledToken: nextToken,
        completedToken: currentServing || null,
        remainingQueue: Math.max(0, waitingTokens.length - 1),
      },
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };

    this.broadcast(event);
    this.playHospitalChime();

    return { calledToken: nextToken, completedToken: currentServing || null };
  }

  public resetAllToSeed(): void {
    localStorage.setItem(STORAGE_KEYS.HOSPITALS, JSON.stringify(INITIAL_HOSPITALS));
    localStorage.setItem(STORAGE_KEYS.WARDS, JSON.stringify(INITIAL_WARDS));
    localStorage.setItem(STORAGE_KEYS.BEDS, JSON.stringify(INITIAL_BEDS));
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(INITIAL_DOCTORS));
    localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(INITIAL_STAFF_ROSTER));
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(INITIAL_TOKENS));

    const event: SyncEvent = {
      type: 'RESET_ALL',
      payload: {},
      timestamp: new Date().toISOString(),
      sourceTerminal: this.terminalId,
    };
    this.broadcast(event);
  }

  // Helpers
  private getAllBedsMap(): Record<string, Bed[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BEDS);
      return data ? JSON.parse(data) : INITIAL_BEDS;
    } catch {
      return INITIAL_BEDS;
    }
  }

  private getAllWardsMap(): Record<string, Ward[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WARDS);
      return data ? JSON.parse(data) : INITIAL_WARDS;
    } catch {
      return INITIAL_WARDS;
    }
  }

  private getAllDoctors(): Doctor[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
      return data ? JSON.parse(data) : INITIAL_DOCTORS;
    } catch {
      return INITIAL_DOCTORS;
    }
  }

  private getAllRosterMap(): Record<string, StaffRoster> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROSTER);
      return data ? JSON.parse(data) : INITIAL_STAFF_ROSTER;
    } catch {
      return INITIAL_STAFF_ROSTER;
    }
  }

  private getAllTokens(): Token[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TOKENS);
      return data ? JSON.parse(data) : INITIAL_TOKENS;
    } catch {
      return INITIAL_TOKENS;
    }
  }
}

export const realtimeSync = new RealtimeSyncManager();
