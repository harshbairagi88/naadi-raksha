import mongoose from 'mongoose';
import config from '../config/config.js';
import HealthData from '../models/health.model.js';

const toNumber = value => {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const toDate = value => {
  if (!value) return undefined;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
};

const cleanupObject = obj => {
  Object.keys(obj).forEach(key => {
    if (obj[key] === undefined) {
      delete obj[key];
    }
  });
  return obj;
};

const buildMetrics = payload => {
  const rawBloodPressure = payload?.bloodPressure ?? {};
  const bloodPressure = cleanupObject({
    systolic: toNumber(rawBloodPressure.systolic),
    diastolic: toNumber(rawBloodPressure.diastolic),
    unit: rawBloodPressure.unit || 'mmHg',
  });

  if (Object.keys(bloodPressure).length <= 1) {
    delete bloodPressure.unit;
  }

  const metrics = cleanupObject({
    temperatureC: toNumber(payload?.temperatureC ?? payload?.temperature),
    pulseRateBpm: toNumber(payload?.pulseRateBpm ?? payload?.pulseRate),
    respirationRateBpm: toNumber(payload?.respirationRateBpm),
    spo2Percent: toNumber(payload?.spo2Percent ?? payload?.spo2),
    glucoseMgDl: toNumber(payload?.glucoseMgDl ?? payload?.glucose),
    bloodPressure: Object.keys(bloodPressure).length ? bloodPressure : undefined,
  });

  return metrics;
};

const buildHealthPayload = body => {
  const metrics = buildMetrics(body);

  const payload = cleanupObject({
    deviceId: typeof body?.deviceId === 'string' ? body.deviceId.trim() : body?.deviceId,
    deviceType: body?.deviceType,
    firmwareVersion: body?.firmwareVersion,
    patientId: body?.patientId,
    capturedAt: toDate(body?.capturedAt ?? body?.timestamp ?? body?.time),
    receivedAt: toDate(body?.receivedAt),
    metrics: Object.keys(metrics).length ? metrics : undefined,
    activity: body?.activity,
    battery: body?.battery,
    signal: body?.signal,
    location: body?.location,
    payload: body?.payload ?? body,
  });

  return payload;
};

export const receiveHealthData = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const healthPayload = buildHealthPayload(req.body);

    if (!healthPayload.deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    if (
      healthPayload.patientId &&
      !mongoose.isValidObjectId(healthPayload.patientId)
    ) {
      return res.status(400).json({ message: 'patientId is invalid' });
    }

    const data = await HealthData.create(healthPayload);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: config.IS_PROD ? 'Failed to store health data' : error.message });
  }
};

export const getLatestDeviceHealthData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const data = await HealthData.findOne({ deviceId })
      .sort({ capturedAt: -1 })
      .lean();

    if (!data) {
      return res.status(404).json({ message: 'No health data found' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: config.IS_PROD ? 'Failed to fetch health data' : error.message });
  }
};

export const getDeviceHealthData = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res.status(400).json({ message: 'deviceId is required' });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const query = { deviceId };
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    if (from || to) {
      query.capturedAt = {};
      if (from && !Number.isNaN(from.getTime())) {
        query.capturedAt.$gte = from;
      }
      if (to && !Number.isNaN(to.getTime())) {
        query.capturedAt.$lte = to;
      }
      if (!Object.keys(query.capturedAt).length) {
        delete query.capturedAt;
      }
    }

    const data = await HealthData.find(query)
      .sort({ capturedAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: config.IS_PROD ? 'Failed to fetch health data' : error.message });
  }
};

export const getPatientHealthData = async (req, res) => {
  try {
    const { patientId } = req.params;
    if (!patientId) {
      return res.status(400).json({ message: 'patientId is required' });
    }

    if (!mongoose.isValidObjectId(patientId)) {
      return res.status(400).json({ message: 'patientId is invalid' });
    }

    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const query = { patientId };
    const from = req.query.from ? new Date(req.query.from) : null;
    const to = req.query.to ? new Date(req.query.to) : null;

    if (from || to) {
      query.capturedAt = {};
      if (from && !Number.isNaN(from.getTime())) {
        query.capturedAt.$gte = from;
      }
      if (to && !Number.isNaN(to.getTime())) {
        query.capturedAt.$lte = to;
      }
      if (!Object.keys(query.capturedAt).length) {
        delete query.capturedAt;
      }
    }

    const data = await HealthData.find(query)
      .sort({ capturedAt: -1 })
      .limit(limit)
      .lean();

    return res.json({ success: true, count: data.length, data });
  } catch (error) {
    return res
      .status(500)
      .json({ message: config.IS_PROD ? 'Failed to fetch health data' : error.message });
  }
};
