export type Role = 'Administrator' | 'Doctor' | 'Nurse' | 'Patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  status?: 'Active' | 'Blocked';
}

export interface Patient {
  _id?: string;
  patient_id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  symptoms: string[];
  diagnosis: string;
  medications: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  status?: 'Active' | 'Blocked';
  createdAt?: string;
}

export interface NLPAnalysisResult {
  patient_id?: string;
  patient_name?: string;
  age: number;
  gender?: string;
  symptoms: string[];
  diagnosis?: string;
  medications?: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
}

export interface EHRRecord {
  _id?: string;
  patient_id?: string;
  patient_name?: string;
  age: number;
  gender?: string;
  symptoms: string[];
  diagnosis?: string;
  medications?: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  summary: string;
  rawText: string;
  createdAt?: string;
}

export interface Request {
  _id?: string;
  id: string;
  type: 'EHR_EDIT' | 'EHR_DELETE' | 'PATIENT_EDIT' | 'PATIENT_DELETE';
  requesterId: string;
  requesterName: string;
  requesterRole: Role;
  targetId: string; // patient_id or ehr_record_id
  targetName: string;
  data?: any; // new data for edit
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
}

export interface Activity {
  _id?: string;
  patient_id: string;
  action: 'ANALYSIS' | 'EDIT_EHR' | 'DELETE_EHR' | 'EDIT_PATIENT' | 'DELETE_PATIENT' | 'STATUS_CHANGE' | 'IMPORT';
  details: string;
  userId: string;
  userName: string;
  userRole: Role;
  createdAt: string;
}
