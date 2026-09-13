export type UserRole = 'PATIENT' | 'HOSPITAL_ADMIN' | 'DOCTOR' | 'STAFF';

export type WardType = 'GENERAL' | 'ICU' | 'EMERGENCY_TRAUMA' | 'PRIVATE' | 'ISOLATION';

export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'RESERVED';

export type DoctorStatus = 'AVAILABLE' | 'IN_CONSULTATION' | 'IN_SURGERY' | 'OFF_DUTY';

export type TokenStatus = 'WAITING' | 'NOW_SERVING' | 'IN_CONSULTATION' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export type CapacityLevel = 'AVAILABLE' | 'FILLING_FAST' | 'FULL';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  hospitalId?: string;
  hospitalName?: string;
  department?: string;
  createdAt: string;
  avatar?: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  location: string;
  address: string;
  emergencyContact: string;
  ambulanceContact: string;
  distanceKm: number;
  isEmergencyOpen: boolean;
  totalBeds: number;
  availableBeds: number;
  icuTotal: number;
  icuAvailable: number;
  rating: number;
}

export interface Ward {
  id: string;
  hospitalId: string;
  type: WardType;
  name: string;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  cleaningBeds: number;
  oxygenEquippedBeds: number;
  ventilatorBeds: number;
  lastUpdated: string;
}

export interface Bed {
  id: string;
  wardId: string;
  hospitalId: string;
  wardType: WardType;
  bedNumber: string;
  status: BedStatus;
  hasOxygen: boolean;
  hasVentilator: boolean;
  patientName?: string;
  admittedAt?: string;
  lastUpdated: string;
}

export interface Doctor {
  id: string;
  hospitalId: string;
  name: string;
  department: string;
  qualification: string;
  experienceYears: number;
  roomNumber: string;
  status: DoctorStatus;
  currentTokenNumber?: string;
  avgConsultationTimeMin: number;
  activeQueueLength: number;
  avatar: string;
  languages: string[];
}

export interface StaffRoster {
  hospitalId: string;
  totalDoctorsOnDuty: number;
  totalNursesOnDuty: number;
  supportStaffOnDuty: number;
  emergencyDoctorsOnCall: number;
  shiftName: string;
  lastUpdated: string;
}

export interface Token {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  hospitalId: string;
  hospitalName: string;
  department: string;
  doctorId: string;
  doctorName: string;
  roomNumber: string;
  status: TokenStatus;
  queuePosition: number;
  estimatedWaitMinutes: number;
  generatedAt: string;
  calledAt?: string;
  completedAt?: string;
  priority: 'NORMAL' | 'SENIOR_CITIZEN' | 'EMERGENCY';
  symptomsSummary?: string;
  qrCodeSeed: string;
}

export interface SyncEvent {
  type: 
    | 'BED_STATUS_CHANGED'
    | 'STAFF_COUNT_UPDATED'
    | 'DOCTOR_STATUS_CHANGED'
    | 'TOKEN_GENERATED'
    | 'TOKEN_CALLED'
    | 'TOKEN_COMPLETED'
    | 'TOKEN_CANCELLED'
    | 'RESET_ALL';
  payload: any;
  timestamp: string;
  sourceTerminal: string;
}
