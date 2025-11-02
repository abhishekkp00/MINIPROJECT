/**
 * Authentication Middleware
 * JWT verification and role-based access control
 */

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect routes - Verify JWT token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const protect = async (req, res, next) => {
  let token;

  try {
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Extract token from "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (alternative method)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route. Please login.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database (excluding password)
    const user = await User.findById(decoded.id)
      .select('-password -refreshToken')
      .lean();

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user exists (should be set by protect middleware)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

/**
 * Check project membership
 * Verify if user is a member of the project
 */
export const checkProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user._id;

    const Project = (await import('../models/Project.js')).default;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is creator, team lead, mentor, or member
    const isMember = 
      project.createdBy.toString() === userId.toString() ||
      project.teamLead.toString() === userId.toString() ||
      (project.mentor && project.mentor.toString() === userId.toString()) ||
      project.members.some(m => m.user.toString() === userId.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this project'
      });
    }

    // Attach project to request
    req.project = project;
    next();

  } catch (error) {
    console.error('Check project member error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking project membership',
      error: error.message
    });
  }
};

/**
 * Check if user is project lead or mentor
 */
export const checkProjectLeadOrMentor = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    const userId = req.user._id;

    const Project = (await import('../models/Project.js')).default;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is team lead or mentor
    const isLeadOrMentor = 
      project.teamLead.toString() === userId.toString() ||
      (project.mentor && project.mentor.toString() === userId.toString());

    if (!isLeadOrMentor) {
      return res.status(403).json({
        success: false,
        message: 'Only project lead or mentor can perform this action'
      });
    }

    req.project = project;
    next();

  } catch (error) {
    console.error('Check project lead/mentor error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking project permissions',
      error: error.message
    });
  }
};

/**
 * Optional authentication
 * Attach user if token is valid, but don't require it
 */
export const optionalAuth = async (req, res, next) => {
  let token;

  try {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean();
      
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Generate JWT token
 * @param {string} id - User ID
 * @returns {string} JWT token
 */
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

/**
 * Generate refresh token
 * @param {string} id - User ID
 * @returns {string} Refresh token
 */
export const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  });
};

/**
 * Set token cookie
 * @param {Object} res - Express response object
 * @param {string} token - JWT token
 */
export const setTokenCookie = (res, token) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('token', token, options);
};

export default {
  protect,
  authorize,
  checkProjectMember,
  checkProjectLeadOrMentor,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  setTokenCookie
};
