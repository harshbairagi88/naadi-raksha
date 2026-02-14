import express from 'express';
import {
  receiveHealthData,
  getDeviceHealthData,
  getLatestDeviceHealthData,
  getPatientHealthData,
} from '../controllers/health.controllers.js';

const router = express.Router();

router.post('/device/health', receiveHealthData);
router.get('/device/:deviceId/latest', getLatestDeviceHealthData);
router.get('/device/:deviceId', getDeviceHealthData);
router.get('/patient/:patientId', getPatientHealthData);

export default router;
