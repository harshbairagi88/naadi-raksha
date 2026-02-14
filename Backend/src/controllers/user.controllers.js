import config from '../config/config.js';
import User from '../models/user.model.js';

export const createOrGetUser = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload',
      });
    }

    const { name, avatar = '' } = req.body || {};

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const normalizedName = name.trim().toLowerCase();

    let user = await User.findOne({ normalizedName }).select('-__v').lean();
    if (!user) {
      try {
        const newUser = new User({ name: name.trim(), avatar });
        await newUser.save();
        user = newUser.toObject();
        delete user.__v;
      } catch (error) {
        if (error?.code === 11000) {
          user = await User.findOne({ normalizedName }).select('-__v').lean();
        } else {
          throw error;
        }
      }
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Create/Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create user',
      ...(config.IS_PROD ? {} : { error: error.message }),
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-__v').lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      ...(config.IS_PROD ? {} : { error: error.message }),
    });
  }
};
