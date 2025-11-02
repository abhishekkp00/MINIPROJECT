/**
 * Authentication Controller
 * Handles user registration, login, OAuth, and token management
 */

import User from '../models/User.js';
import { generateToken, generateRefreshToken, setTokenCookie } from '../middleware/auth.js';
import { catchAsync, AppError } from '../middleware/errorHandler.js';
import { sendWelcomeEmail } from '../services/emailService.js';

/**
 * @desc    Register new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, role, department, rollNumber } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('Email already registered', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    role: role || 'student',
    department,
    rollNumber
  });

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Save refresh token to user
  user.refreshToken = refreshToken;
  await user.save();

  // Set cookie
  setTokenCookie(res, token);

  // Send welcome email (async, don't wait)
  sendWelcomeEmail(user).catch(err => 
    console.error('Welcome email error:', err)
  );

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.getPublicProfile(),
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password
  const user = await User.findByCredentials(email, password);

  // Generate tokens
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update user
  user.refreshToken = refreshToken;
  user.lastActive = new Date();
  user.isOnline = true;
  await user.save();

  // Set cookie
  setTokenCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.getPublicProfile(),
      token,
      refreshToken
    }
  });
});

/**
 * @desc    Get current user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id)
    .populate('projects', 'title status progress deadline')
    .populate('mentoringProjects', 'title status progress');

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { user }
  });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logout = catchAsync(async (req, res, next) => {
  // Update user status
  await User.findByIdAndUpdate(req.user._id, {
    isOnline: false,
    refreshToken: null
  });

  // Clear cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
export const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return next(new AppError('Refresh token required', 400));
  }

  // Verify refresh token
  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  // Find user
  const user = await User.findOne({
    _id: decoded.id,
    refreshToken: refreshToken
  });

  if (!user) {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Generate new access token
  const newToken = generateToken(user._id);
  setTokenCookie(res, newToken);

  res.status(200).json({
    success: true,
    data: { token: newToken }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, bio, skills, department, avatar } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      name,
      bio,
      skills,
      department,
      avatar
    },
    {
      new: true,
      runValidators: true
    }
  );

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: user.getPublicProfile() }
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/password
 * @access  Private
 */
export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new AppError('Please provide current and new password', 400));
  }

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return next(new AppError('Current password is incorrect', 401));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

export default {
  register,
  login,
  getMe,
  logout,
  refreshToken,
  updateProfile,
  changePassword
};
