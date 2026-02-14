import mongoose from 'mongoose';

const healthSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    deviceType: {
      type: String,
      trim: true,
      default: '',
    },
    firmwareVersion: {
      type: String,
      trim: true,
      default: '',
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    capturedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    metrics: {
      temperatureC: { type: Number, min: 20, max: 45 },
      pulseRateBpm: { type: Number, min: 20, max: 250 },
      respirationRateBpm: { type: Number, min: 5, max: 80 },
      spo2Percent: { type: Number, min: 50, max: 100 },
      bloodPressure: {
        systolic: { type: Number, min: 50, max: 250 },
        diastolic: { type: Number, min: 30, max: 150 },
        unit: { type: String, default: 'mmHg' },
      },
      glucoseMgDl: { type: Number, min: 20, max: 600 },
    },
    activity: {
      posture: { type: String, default: '' },
      steps: { type: Number, min: 0 },
    },
    battery: {
      levelPercent: { type: Number, min: 0, max: 100 },
      charging: { type: Boolean, default: false },
    },
    signal: {
      rssi: { type: Number, min: -120, max: 0 },
      networkType: { type: String, default: '' },
    },
    location: {
      lat: { type: Number, min: -90, max: 90 },
      lng: { type: Number, min: -180, max: 180 },
      accuracyMeters: { type: Number, min: 0 },
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

healthSchema.index({ deviceId: 1, capturedAt: -1 });
healthSchema.index({ patientId: 1, capturedAt: -1 });

export default mongoose.model('HealthData', healthSchema);
