import mongoose from 'mongoose';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const maskMongoUri = uri => {
  if (!uri) return '';
  return uri.replace(/\/\/([^:/]+):([^@]+)@/g, '//****:****@');
};

mongoose.set('strictQuery', true);

const connectToDb = async () => {
  try {
    const mongoURI = config.MONGODB_URI;
    await mongoose.connect(mongoURI, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected => ${maskMongoUri(mongoURI)}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('error', error => {
  logger.error('MongoDB runtime error:', error.message);
});

export default connectToDb;
