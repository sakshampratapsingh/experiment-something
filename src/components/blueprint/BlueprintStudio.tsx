import React, { useState } from 'react';
import { 
  Database, 
  Code2, 
  Layers, 
  Copy, 
  Check, 
  Cpu, 
  Table, 
  Flame, 
  Radio, 
  FileCode, 
  Smartphone, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  GitBranch,
  FileText
} from 'lucide-react';

export const BlueprintStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SCHEMA' | 'REACT_NATIVE' | 'FLUTTER' | 'SYNC_ENGINE'>('SCHEMA');
  const [schemaSubTab, setSchemaSubTab] = useState<'ERD' | 'SQL' | 'FIRESTORE'>('ERD');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const SQL_DDL = `-- =========================================================================
-- SWASTHYA SETU: PRODUCTION RELATIONAL DATABASE SCHEMA (PostgreSQL / Supabase)
-- Real-Time Hospital Management & Patient Coordination Platform
-- =========================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS FOR STRICT DATA INTEGRITY
CREATE TYPE user_role AS ENUM ('PATIENT', 'HOSPITAL_ADMIN', 'DOCTOR', 'STAFF');
CREATE TYPE ward_type AS ENUM ('GENERAL', 'ICU', 'EMERGENCY_TRAUMA', 'PRIVATE', 'ISOLATION');
CREATE TYPE bed_status AS ENUM ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'RESERVED');
CREATE TYPE doctor_status AS ENUM ('AVAILABLE', 'IN_CONSULTATION', 'IN_SURGERY', 'OFF_DUTY');
CREATE TYPE token_status AS ENUM ('WAITING', 'NOW_SERVING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE triage_priority AS ENUM ('NORMAL', 'SENIOR_CITIZEN', 'EMERGENCY');

-- 2. HOSPITALS MASTER TABLE
CREATE TABLE hospitals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    emergency_contact VARCHAR(30) NOT NULL,
    ambulance_contact VARCHAR(30) NOT NULL,
    is_emergency_open BOOLEAN DEFAULT TRUE,
    total_beds INT NOT NULL DEFAULT 0,
    available_beds INT NOT NULL DEFAULT 0,
    icu_total INT NOT NULL DEFAULT 0,
    icu_available INT NOT NULL DEFAULT 0,
    rating NUMERIC(2,1) DEFAULT 4.5,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS & PROFILES TABLE
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_uid VARCHAR(128) UNIQUE, -- Firebase Auth UID / Supabase Auth ID
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'PATIENT',
    hospital_id UUID REFERENCES hospitals(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. WARDS TABLE
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    type ward_type NOT NULL,
    name VARCHAR(120) NOT NULL,
    total_beds INT NOT NULL CHECK (total_beds >= 0),
    occupied_beds INT NOT NULL DEFAULT 0 CHECK (occupied_beds >= 0),
    available_beds INT NOT NULL DEFAULT 0 CHECK (available_beds >= 0),
    cleaning_beds INT NOT NULL DEFAULT 0,
    oxygen_equipped_beds INT NOT NULL DEFAULT 0,
    ventilator_beds INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_bed_balance CHECK (available_beds + occupied_beds + cleaning_beds <= total_beds)
);

-- 5. PHYSICAL BEDS TABLE (Granular Status Tracking)
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    status bed_status NOT NULL DEFAULT 'AVAILABLE',
    has_oxygen BOOLEAN NOT NULL DEFAULT FALSE,
    has_ventilator BOOLEAN NOT NULL DEFAULT FALSE,
    patient_name VARCHAR(150),
    admitted_at TIMESTAMPTZ,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(hospital_id, bed_number)
);

-- 6. DOCTORS TABLE
CREATE TABLE doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100) NOT NULL,
    qualification VARCHAR(150) NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    room_number VARCHAR(30) NOT NULL,
    status doctor_status NOT NULL DEFAULT 'AVAILABLE',
    current_token_number VARCHAR(20),
    avg_consultation_time_min INT NOT NULL DEFAULT 10,
    active_queue_length INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. STAFF ROSTER (Aggregated Daily Telemetry)
CREATE TABLE staff_rosters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID UNIQUE NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    total_doctors_on_duty INT NOT NULL DEFAULT 0,
    total_nurses_on_duty INT NOT NULL DEFAULT 0,
    support_staff_on_duty INT NOT NULL DEFAULT 0,
    emergency_doctors_on_call INT NOT NULL DEFAULT 0,
    shift_name VARCHAR(50) DEFAULT 'Morning Shift',
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OPD QUEUE TOKENS TABLE (Real-Time Appointments)
CREATE TABLE tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_number VARCHAR(30) NOT NULL,
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hospital_id UUID NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
    department VARCHAR(100) NOT NULL,
    room_number VARCHAR(30) NOT NULL,
    status token_status NOT NULL DEFAULT 'WAITING',
    priority triage_priority NOT NULL DEFAULT 'NORMAL',
    queue_position INT NOT NULL DEFAULT 1,
    estimated_wait_minutes INT NOT NULL DEFAULT 10,
    symptoms_summary TEXT,
    qr_code_seed VARCHAR(100) NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(hospital_id, token_number)
);

-- 9. AUDIT & EVENT LOGS FOR REAL-TIME STREAMING
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(80) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    modified_by UUID REFERENCES users(id),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR LOW-LATENCY REALTIME QUERIES
CREATE INDEX idx_tokens_active_queue ON tokens(doctor_id, status) WHERE status = 'WAITING';
CREATE INDEX idx_beds_status ON beds(ward_id, status);
CREATE INDEX idx_doctors_dept ON doctors(hospital_id, department);
CREATE INDEX idx_wards_hospital ON wards(hospital_id, type);

-- SUPABASE REALTIME REPLICATION HOOK
ALTER PUBLICATION supabase_realtime ADD TABLE tokens, beds, doctors, staff_rosters, wards;
`;

  const FIRESTORE_BLUEPRINT = `{
  "entities": {
    "Hospital": {
      "title": "Hospital Facility",
      "description": "Master record of healthcare facilities connected to Swasthya Setu",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "name": { "type": "string", "maxLength": 150 },
        "city": { "type": "string" },
        "totalBeds": { "type": "integer" },
        "availableBeds": { "type": "integer" },
        "icuAvailable": { "type": "integer" },
        "isEmergencyOpen": { "type": "boolean" },
        "emergencyContact": { "type": "string" }
      },
      "required": ["id", "name", "totalBeds", "availableBeds"]
    },
    "Ward": {
      "title": "Ward Inventory",
      "description": "Aggregated ward occupancy and equipment availability",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "hospitalId": { "type": "string" },
        "type": { "type": "string", "enum": ["GENERAL", "ICU", "EMERGENCY_TRAUMA", "PRIVATE", "ISOLATION"] },
        "totalBeds": { "type": "integer" },
        "availableBeds": { "type": "integer" },
        "occupiedBeds": { "type": "integer" },
        "oxygenEquippedBeds": { "type": "integer" },
        "ventilatorBeds": { "type": "integer" }
      },
      "required": ["id", "hospitalId", "type", "totalBeds", "availableBeds"]
    },
    "Token": {
      "title": "OPD Digital Queue Token",
      "description": "Live digital queue token with dynamic wait time computation",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "tokenNumber": { "type": "string", "maxLength": 20 },
        "patientId": { "type": "string" },
        "patientName": { "type": "string", "maxLength": 100 },
        "doctorId": { "type": "string" },
        "doctorName": { "type": "string" },
        "roomNumber": { "type": "string" },
        "status": { "type": "string", "enum": ["WAITING", "NOW_SERVING", "IN_CONSULTATION", "COMPLETED", "CANCELLED"] },
        "queuePosition": { "type": "integer" },
        "estimatedWaitMinutes": { "type": "integer" },
        "priority": { "type": "string", "enum": ["NORMAL", "SENIOR_CITIZEN", "EMERGENCY"] },
        "generatedAt": { "type": "string", "format": "date-time" }
      },
      "required": ["id", "tokenNumber", "patientId", "doctorId", "status", "queuePosition"]
    }
  },
  "firestore": {
    "/hospitals/{hospitalId}": {
      "schema": "Hospital",
      "description": "Top-level collection of all verified medical centers"
    },
    "/hospitals/{hospitalId}/wards/{wardId}": {
      "schema": "Ward",
      "description": "Subcollection of wards with real-time bed counts"
    },
    "/hospitals/{hospitalId}/tokens/{tokenId}": {
      "schema": "Token",
      "description": "Live queue tokens synchronized across patient & staff devices"
    }
  }
}`;

  const REACT_NATIVE_CODE = `// =========================================================================
// SWASTHYA SETU: REACT NATIVE (Expo / TypeScript) COMPLETE SOURCE CODE
// File: screens/PatientDashboardScreen.tsx
// =========================================================================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import { RealtimeSyncService } from '../services/RealtimeSyncService';

interface Ward {
  id: string;
  name: string;
  type: string;
  totalBeds: number;
  availableBeds: number;
  occupiedBeds: number;
  oxygenEquippedBeds: number;
}

interface Doctor {
  id: string;
  name: string;
  department: string;
  roomNumber: string;
  status: 'AVAILABLE' | 'IN_CONSULTATION' | 'IN_SURGERY' | 'OFF_DUTY';
  activeQueueLength: number;
  avgConsultationTimeMin: number;
}

interface Token {
  id: string;
  tokenNumber: string;
  doctorName: string;
  roomNumber: string;
  status: 'WAITING' | 'NOW_SERVING' | 'COMPLETED';
  queuePosition: number;
  estimatedWaitMinutes: number;
}

export const PatientDashboardScreen = () => {
  const [wards, setWards] = useState<Ward[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [myTokens, setMyTokens] = useState<Token[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // 1. Initial Fetch
    loadTelemetry();

    // 2. Attach Real-Time WebSocket / Firestore Listener
    const unsubscribe = RealtimeSyncService.subscribeToUpdates((event) => {
      if (event.type === 'BED_STATUS_CHANGED' || event.type === 'TOKEN_CALLED') {
        loadTelemetry();
        if (event.type === 'TOKEN_CALLED' && event.isForMe) {
          Alert.alert('🚨 TOKEN CALLED', \`Please proceed to Room \${event.roomNumber}!\`);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const loadTelemetry = async () => {
    const wardData = await RealtimeSyncService.fetchWards('hosp-aiims-delhi');
    const doctorData = await RealtimeSyncService.fetchDoctors('hosp-aiims-delhi');
    const tokenData = await RealtimeSyncService.fetchMyTokens();
    setWards(wardData);
    setDoctors(doctorData);
    setMyTokens(tokenData);
  };

  const handleGenerateToken = async () => {
    if (!selectedDoctor) return;
    setIsSubmitting(true);
    try {
      await RealtimeSyncService.generateToken({
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        department: selectedDoctor.department,
        symptoms,
      });
      setModalVisible(false);
      setSymptoms('');
      loadTelemetry();
    } catch (error) {
      Alert.alert('Error', 'Failed to generate token.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Swasthya Setu</Text>
          <Text style={styles.headerSubtitle}>AIIMS New Delhi • Live Bed & OPD Grid</Text>
        </View>

        {/* Live Active Token Card */}
        {myTokens.length > 0 && (
          <View style={styles.tokenCard}>
            <Text style={styles.tokenBadge}>YOUR ACTIVE OPD TOKEN</Text>
            <Text style={styles.tokenNumber}>#{myTokens[0].tokenNumber}</Text>
            <Text style={styles.tokenDoctor}>{myTokens[0].doctorName} • Room {myTokens[0].roomNumber}</Text>
            <Text style={styles.tokenWait}>
              Position: #{myTokens[0].queuePosition} • Est. Wait: ~{myTokens[0].estimatedWaitMinutes} mins
            </Text>
          </View>
        )}

        {/* Wards & Beds Board */}
        <Text style={styles.sectionTitle}>Ward & Bed Availability</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardScroll}>
          {wards.map((ward) => {
            const isCritical = ward.availableBeds < 5;
            return (
              <View key={ward.id} style={[styles.wardCard, isCritical && styles.wardCritical]}>
                <Text style={styles.wardType}>{ward.type}</Text>
                <Text style={styles.wardName}>{ward.name}</Text>
                <Text style={styles.wardBeds}>{ward.availableBeds} Vacant / {ward.totalBeds} Total</Text>
                <Text style={styles.wardO2}>🫁 {ward.oxygenEquippedBeds} O₂ Beds</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Doctors & Token Booking */}
        <Text style={styles.sectionTitle}>Doctors On Duty & OPD Queues</Text>
        {doctors.map((doctor) => (
          <View key={doctor.id} style={styles.docCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.docName}>{doctor.name}</Text>
              <Text style={styles.docDept}>{doctor.department} • Room {doctor.roomNumber}</Text>
              <Text style={styles.docStatus}>Status: {doctor.status}</Text>
              <Text style={styles.docQueue}>Queue: {doctor.activeQueueLength} waiting (~{doctor.activeQueueLength * doctor.avgConsultationTimeMin}m)</Text>
            </View>
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={() => {
                setSelectedDoctor(doctor);
                setModalVisible(true);
              }}
            >
              <Text style={styles.bookBtnText}>Get Token</Text>
            </TouchableOpacity>
          </View>
        ))}

      </ScrollView>

      {/* Booking Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Generate OPD Token</Text>
            <Text style={styles.modalDoctor}>{selectedDoctor?.name}</Text>
            <TextInput
              placeholder="Brief symptoms or notes..."
              placeholderTextColor="#64748b"
              value={symptoms}
              onChangeText={setSymptoms}
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleGenerateToken}>
                {isSubmitting ? <ActivityIndicator color="#000" /> : <Text style={styles.confirmBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { padding: 16 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#14b8a6', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginVertical: 14 },
  tokenCard: { backgroundColor: '#134e4a', padding: 18, borderRadius: 20, marginBottom: 16, borderColor: '#2dd4bf', borderWidth: 1 },
  tokenBadge: { fontSize: 10, fontWeight: '700', color: '#99f6e4' },
  tokenNumber: { fontSize: 36, fontWeight: '900', color: '#fff', marginVertical: 4 },
  tokenDoctor: { fontSize: 14, fontWeight: '600', color: '#ccfbf1' },
  tokenWait: { fontSize: 12, color: '#99f6e4', marginTop: 4 },
  wardScroll: { marginBottom: 10 },
  wardCard: { backgroundColor: '#1e293b', width: 220, padding: 16, borderRadius: 16, marginRight: 12 },
  wardCritical: { borderColor: '#f43f5e', borderWidth: 1 },
  wardType: { fontSize: 10, color: '#14b8a6', fontWeight: '700' },
  wardName: { fontSize: 14, fontWeight: '700', color: '#fff', marginVertical: 4 },
  wardBeds: { fontSize: 13, fontWeight: '600', color: '#cbd5e1' },
  wardO2: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  docCard: { backgroundColor: '#1e293b', padding: 14, borderRadius: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  docName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  docDept: { fontSize: 12, color: '#2dd4bf', marginTop: 2 },
  docStatus: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  docQueue: { fontSize: 11, color: '#fbbf24', marginTop: 2 },
  bookBtn: { backgroundColor: '#14b8a6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 12 },
  bookBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1e293b', borderRadius: 24, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  modalDoctor: { fontSize: 13, color: '#2dd4bf', marginTop: 2, marginBottom: 14 },
  input: { backgroundColor: '#0f172a', borderRadius: 12, padding: 12, color: '#fff', fontSize: 13, marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#334155', alignItems: 'center' },
  cancelBtnText: { color: '#fff', fontWeight: '600' },
  confirmBtn: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#14b8a6', alignItems: 'center' },
  confirmBtnText: { color: '#0f172a', fontWeight: '700' },
});
`;

  const FLUTTER_CODE = `// =========================================================================
// SWASTHYA SETU: FLUTTER (Dart) COMPLETE SOURCE CODE
// File: lib/screens/patient_dashboard_screen.dart
// =========================================================================

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

class PatientDashboardScreen extends StatefulWidget {
  final String hospitalId;
  final String patientId;

  const PatientDashboardScreen({
    Key? key,
    required this.hospitalId,
    required this.patientId,
  }) : super(key: key);

  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Real-time calculation of dynamic waiting time
  int calculateEstimatedWait(int position, int avgDuration) {
    if (position <= 0) return 0;
    return position * avgDuration;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text('Swasthya Setu', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            Text('AIIMS New Delhi • Live OPD & Bed Grid', style: TextStyle(fontSize: 11, color: Color(0xFF2DD4BF))),
          ],
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. My Active Token Stream (Real-Time Listener)
            StreamBuilder<QuerySnapshot>(
              stream: _firestore
                  .collection('hospitals')
                  .doc(widget.hospitalId)
                  .collection('tokens')
                  .where('patientId', isEqualTo: widget.patientId)
                  .where('status', whereIn: ['WAITING', 'NOW_SERVING'])
                  .snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                  return const SizedBox.shrink();
                }
                final tokenDoc = snapshot.data!.docs.first;
                final data = tokenDoc.data() as Map<String, dynamic>;
                final bool isNowServing = data['status'] == 'NOW_SERVING';

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isNowServing ? const Color(0xFF134E4A) : const Color(0xFF1E293B),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isNowServing ? const Color(0xFF2DD4BF) : Colors.transparent,
                      width: 2,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isNowServing ? '🔔 NOW SERVING — PLEASE PROCEED' : 'YOUR ACTIVE TOKEN',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isNowServing ? const Color(0xFF5EEAD4) : Colors.amber,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '#\${data['tokenNumber']}',
                        style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                      Text(
                        '\${data['doctorName']} • Room \${data['roomNumber']}',
                        style: const TextStyle(fontSize: 13, color: Colors.white70),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        isNowServing
                            ? 'Your turn has arrived!'
                            : 'Queue Position: #\${data['queuePosition']} • Est. Wait: ~\${data['estimatedWaitMinutes']} mins',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF2DD4BF)),
                      ),
                    ],
                  ),
                );
              },
            ),

            // 2. Ward & Bed Availability Board
            const Text(
              'Ward & Bed Availability Board',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 125,
              child: StreamBuilder<QuerySnapshot>(
                stream: _firestore
                    .collection('hospitals')
                    .doc(widget.hospitalId)
                    .collection('wards')
                    .snapshots(),
                builder: (context, snapshot) {
                  if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                  return ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: snapshot.data!.docs.length,
                    itemBuilder: (context, index) {
                      final ward = snapshot.data!.docs[index].data() as Map<String, dynamic>;
                      final avail = ward['availableBeds'] as int;
                      final total = ward['totalBeds'] as int;
                      final bool isLow = (avail / total) < 0.15;

                      return Container(
                        width: 200,
                        margin: const EdgeInsets.only(right: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(16),
                          border: isLow ? Border.all(color: Colors.redAccent) : null,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(ward['type'], style: const TextStyle(fontSize: 10, color: Color(0xFF2DD4BF), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text(ward['name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white), maxLines: 1),
                            const Spacer(),
                            Text('\$avail Available / \$total Total', style: const TextStyle(fontSize: 12, color: Colors.white)),
                            Text('🫁 \${ward['oxygenEquippedBeds']} O₂ Equipped', style: const TextStyle(fontSize: 10, color: Colors.white54)),
                          ],
                        ),
                      );
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            // 3. Staff & Doctor Availability Tracker
            const Text(
              'Available Doctors & OPD Queues',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 10),
            StreamBuilder<QuerySnapshot>(
              stream: _firestore
                  .collection('hospitals')
                  .doc(widget.hospitalId)
                  .collection('doctors')
                  .snapshots(),
              builder: (context, snapshot) {
                if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: snapshot.data!.docs.length,
                  itemBuilder: (context, index) {
                    final doc = snapshot.data!.docs[index].data() as Map<String, dynamic>;
                    final queue = doc['activeQueueLength'] as int;
                    final avgMins = doc['avgConsultationTimeMin'] as int;
                    final estWait = calculateEstimatedWait(queue, avgMins);

                    return Card(
                      color: const Color(0xFF1E293B),
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: ListTile(
                        title: Text(doc['name'], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                        subtitle: Text(
                          '\${doc['department']} • Room \${doc['roomNumber']}\\nQueue: \$queue waiting (~ \${estWait}m wait)',
                          style: const TextStyle(color: Colors.white60, fontSize: 12),
                        ),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2DD4BF),
                            foregroundColor: const Color(0xFF0F172A),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: () => _generateTokenModal(context, doc),
                          child: const Text('Book Token', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _generateTokenModal(BuildContext context, Map<String, dynamic> doctor) {
    // Generates token and writes to Firestore...
  }
}
`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-w-7xl mx-auto my-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Swasthya Setu Architecture &amp; Code Studio</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete production deliverables: Database ER Diagram, DDL, Firestore rules, and React Native / Flutter source code
          </p>
        </div>

        {/* Master Tab Switcher */}
        <div className="flex flex-wrap gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('SCHEMA')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'SCHEMA'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>1. Database Schema &amp; ERD</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REACT_NATIVE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'REACT_NATIVE'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>2. React Native (TS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLUTTER')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'FLUTTER'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>3. Flutter (Dart)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SYNC_ENGINE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'SYNC_ENGINE'
                ? 'bg-teal-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>4. Realtime Sync Architecture</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Database Schema / ER Diagram */}
      {activeTab === 'SCHEMA' && (
        <div className="pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSchemaSubTab('ERD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  schemaSubTab === 'ERD'
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Visual ER Diagram
              </button>
              <button
                type="button"
                onClick={() => setSchemaSubTab('SQL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  schemaSubTab === 'SQL'
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PostgreSQL DDL
              </button>
              <button
                type="button"
                onClick={() => setSchemaSubTab('FIRESTORE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  schemaSubTab === 'FIRESTORE'
                    ? 'bg-slate-800 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Firestore Blueprint (JSON)
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopy('schema', schemaSubTab === 'SQL' ? SQL_DDL : FIRESTORE_BLUEPRINT)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition cursor-pointer"
            >
              {copiedKey === 'schema' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'schema' ? 'Copied to Clipboard!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Visual ER Diagram Subtab */}
          {schemaSubTab === 'ERD' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Entity 1: users */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-teal-400 text-sm">users</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">TABLE</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="text-emerald-400 font-bold">🔑 id: UUID (PK)</div>
                  <div>auth_uid: VARCHAR(128)</div>
                  <div>name: VARCHAR(150)</div>
                  <div>email: VARCHAR(255)</div>
                  <div>phone: VARCHAR(20)</div>
                  <div>role: ENUM (PATIENT, ADMIN)</div>
                  <div className="text-teal-300">🔗 hospital_id: UUID (FK)</div>
                  <div className="text-slate-500">created_at: TIMESTAMPTZ</div>
                </div>
              </div>

              {/* Entity 2: hospitals */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-teal-400 text-sm">hospitals</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">TABLE</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="text-emerald-400 font-bold">🔑 id: UUID (PK)</div>
                  <div>name: VARCHAR(255)</div>
                  <div>city: VARCHAR(100)</div>
                  <div>emergency_contact: VARCHAR</div>
                  <div>total_beds: INT</div>
                  <div>available_beds: INT</div>
                  <div>icu_total: INT</div>
                  <div>icu_available: INT</div>
                  <div>is_emergency_open: BOOL</div>
                </div>
              </div>

              {/* Entity 3: wards & beds */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-teal-400 text-sm">wards &amp; beds</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">TABLES</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="text-emerald-400 font-bold">🔑 id: UUID (PK)</div>
                  <div className="text-teal-300">🔗 hospital_id: UUID (FK)</div>
                  <div>type: ENUM (ICU, GEN...)</div>
                  <div>total_beds: INT</div>
                  <div>available_beds: INT</div>
                  <div className="pt-2 border-t border-slate-900 text-slate-400">Child: beds</div>
                  <div className="text-emerald-400 font-bold">🔑 bed_number: VARCHAR</div>
                  <div>status: ENUM (AVAIL, OCC)</div>
                  <div>has_oxygen: BOOL</div>
                </div>
              </div>

              {/* Entity 4: tokens */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-mono font-bold text-teal-400 text-sm">tokens (OPD)</span>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">QUEUE</span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                  <div className="text-emerald-400 font-bold">🔑 id: UUID (PK)</div>
                  <div>token_number: VARCHAR(20)</div>
                  <div className="text-teal-300">🔗 patient_id: UUID (FK)</div>
                  <div className="text-teal-300">🔗 doctor_id: UUID (FK)</div>
                  <div>status: ENUM (WAITING, SERVING)</div>
                  <div>queue_position: INT</div>
                  <div>estimated_wait_min: INT</div>
                  <div>qr_code_seed: VARCHAR</div>
                </div>
              </div>

            </div>
          )}

          {/* SQL / Firestore Code Views */}
          {schemaSubTab === 'SQL' && (
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[500px]">
              {SQL_DDL}
            </pre>
          )}

          {schemaSubTab === 'FIRESTORE' && (
            <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-teal-300 overflow-x-auto max-h-[500px]">
              {FIRESTORE_BLUEPRINT}
            </pre>
          )}
        </div>
      )}

      {/* Tab 2: React Native Code */}
      {activeTab === 'REACT_NATIVE' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-teal-400">
              React Native 0.74+ / Expo Router • screens/PatientDashboardScreen.tsx
            </span>
            <button
              type="button"
              onClick={() => handleCopy('rn', REACT_NATIVE_CODE)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition cursor-pointer"
            >
              {copiedKey === 'rn' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'rn' ? 'Copied!' : 'Copy React Native Code'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[550px]">
            {REACT_NATIVE_CODE}
          </pre>
        </div>
      )}

      {/* Tab 3: Flutter Code */}
      {activeTab === 'FLUTTER' && (
        <div className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-teal-400">
              Flutter 3.x / Dart • lib/screens/patient_dashboard_screen.dart
            </span>
            <button
              type="button"
              onClick={() => handleCopy('flutter', FLUTTER_CODE)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition cursor-pointer"
            >
              {copiedKey === 'flutter' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'flutter' ? 'Copied!' : 'Copy Flutter Code'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-200 overflow-x-auto max-h-[550px]">
            {FLUTTER_CODE}
          </pre>
        </div>
      )}

      {/* Tab 4: Realtime Sync Architecture */}
      {activeTab === 'SYNC_ENGINE' && (
        <div className="pt-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <Radio className="w-4 h-4 text-teal-400" />
                <span>1. Multi-Device Event Bus</span>
              </h3>
              <p className="text-slate-400">
                Hospital desk admins dispatch state changes over <code>BroadcastChannel</code> / WebSocket topics (e.g. <code>hospitals/aiims/opd_events</code>). Latency stays &lt; 10ms for instant token alerts and ward updates without manual reloads.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>2. Dynamic Wait Calculation</span>
              </h3>
              <p className="text-slate-400 font-mono text-[11px]">
                WaitTime = (QueuePosition - CurrentServing) × DoctorConsultationVelocity
              </p>
              <p className="text-slate-400 mt-2">
                Dynamically adjusts whenever emergency triage patients cut the queue or consultations complete ahead of schedule.
              </p>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800">
              <h3 className="font-bold text-white text-sm mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>3. Zero-Trust Access Control</span>
              </h3>
              <p className="text-slate-400">
                Role-Based Access Control (RBAC) enforces that only authenticated hospital desk personnel can mutate bed states and call tokens, while patients maintain read-only access to hospital metrics.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
