export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface User {
  id: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isTyping: boolean;
}

export interface HealthBloodPressure {
  systolic?: number;
  diastolic?: number;
  unit?: string;
}

export interface HealthMetrics {
  temperatureC?: number;
  pulseRateBpm?: number;
  respirationRateBpm?: number;
  spo2Percent?: number;
  glucoseMgDl?: number;
  bloodPressure?: HealthBloodPressure;
}

export interface HealthActivity {
  posture?: string;
  steps?: number;
}

export interface HealthBattery {
  levelPercent?: number;
  charging?: boolean;
}

export interface HealthSignal {
  rssi?: number;
  networkType?: string;
}

export interface HealthLocation {
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
}

export interface HealthData {
  id: string;
  deviceId: string;
  deviceType?: string;
  firmwareVersion?: string;
  patientId?: string;
  capturedAt?: string;
  receivedAt?: string;
  metrics?: HealthMetrics;
  activity?: HealthActivity;
  battery?: HealthBattery;
  signal?: HealthSignal;
  location?: HealthLocation;
}
