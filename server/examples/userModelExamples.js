/**
 * User Model Usage Examples
 * Practical examples of using the User schema in your application
 */

import User from '../models/User.js';

// ============================================
// EXAMPLE 1: USER REGISTRATION
// ============================================

export async function registerUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Create new user (password will be hashed automatically)
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student'
    });

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    // Send response (password excluded automatically)
    res.status(201).json({
      message: 'User registered successfully',
      token,
      refreshToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 2: USER LOGIN
// ============================================

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    // Find and validate user credentials
    const user = await User.findByCredentials(email, password);

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    // Update user activity
    user.refreshToken = refreshToken;
    user.lastActive = Date.now();
    user.isOnline = true;
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      refreshToken,
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
}

// ============================================
// EXAMPLE 3: GET USER PROFILE
// ============================================

export async function getUserProfile(req, res) {
  try {
    const userId = req.user.id; // From auth middleware

    const user = await User.findById(userId)
      .populate('projects', 'name description status')
      .populate('mentoringProjects', 'name description');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user.getPublicProfile(),
      projectCount: user.projectCount,
      projects: user.projects,
      mentoringProjects: user.mentoringProjects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 4: UPDATE USER PROFILE
// ============================================

export async function updateUserProfile(req, res) {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Fields that can be updated
    const allowedUpdates = ['name', 'bio', 'avatar', 'skills', 'department', 'rollNumber', 'notifications'];
    const isValidOperation = Object.keys(updates).every(update =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Apply updates
    Object.keys(updates).forEach(update => {
      user[update] = updates[update];
    });

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: user.getPublicProfile()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 5: CHANGE PASSWORD
// ============================================

export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Find user with password field
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 6: SEARCH USERS BY ROLE
// ============================================

export async function getUsersByRole(req, res) {
  try {
    const { role } = req.params;

    if (!['student', 'team-lead', 'mentor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const users = await User.find({ role, isActive: true })
      .select('name email avatar bio skills department')
      .limit(50);

    res.json({
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 7: GET ALL MENTORS
// ============================================

export async function getAllMentors(req, res) {
  try {
    const mentors = await User.find({ 
      role: 'mentor', 
      isActive: true 
    })
      .select('name email avatar bio skills')
      .populate('mentoringProjects', 'name')
      .sort({ name: 1 });

    res.json({
      count: mentors.length,
      mentors: mentors.map(mentor => ({
        ...mentor.getPublicProfile(),
        mentoringCount: mentor.mentoringProjects.length,
        mentoringProjects: mentor.mentoringProjects
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 8: UPDATE USER ONLINE STATUS
// ============================================

export async function updateOnlineStatus(req, res) {
  try {
    const userId = req.user.id;
    const { isOnline } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline,
        lastActive: Date.now()
      },
      { new: true }
    );

    res.json({
      message: 'Status updated',
      isOnline: user.isOnline,
      lastActive: user.lastActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 9: GET TEAM MEMBERS FOR A PROJECT
// ============================================

export async function getProjectTeamMembers(req, res) {
  try {
    const { projectId } = req.params;

    const members = await User.find({
      projects: projectId,
      isActive: true
    })
      .select('name email avatar role isOnline lastActive')
      .sort({ role: 1, name: 1 });

    // Group by role
    const grouped = {
      mentors: members.filter(m => m.role === 'mentor'),
      teamLeads: members.filter(m => m.role === 'team-lead'),
      students: members.filter(m => m.role === 'student')
    };

    res.json({
      total: members.length,
      ...grouped
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 10: BULK CREATE USERS (FOR TESTING)
// ============================================

export async function bulkCreateUsers(users) {
  try {
    const createdUsers = [];

    for (const userData of users) {
      const user = await User.create(userData);
      createdUsers.push(user.getPublicProfile());
    }

    return {
      success: true,
      count: createdUsers.length,
      users: createdUsers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================
// EXAMPLE 11: REFRESH AUTH TOKEN
// ============================================

export async function refreshAuthToken(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new tokens
    const newToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 12: LOGOUT USER
// ============================================

export async function logoutUser(req, res) {
  try {
    const userId = req.user.id;

    await User.findByIdAndUpdate(userId, {
      refreshToken: null,
      isOnline: false,
      lastActive: Date.now()
    });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 13: SEARCH USERS BY SKILL
// ============================================

export async function searchUsersBySkill(req, res) {
  try {
    const { skill } = req.query;

    if (!skill) {
      return res.status(400).json({ error: 'Skill parameter required' });
    }

    const users = await User.find({
      skills: { $regex: skill, $options: 'i' },
      isActive: true
    })
      .select('name email avatar role skills')
      .limit(20);

    res.json({
      count: users.length,
      users: users.map(user => user.getPublicProfile())
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXAMPLE 14: GET USER STATISTICS
// ============================================

export async function getUserStatistics(req, res) {
  try {
    const stats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          onlineCount: {
            $sum: { $cond: ['$isOnline', 1, 0] }
          }
        }
      }
    ]);

    const totalUsers = await User.countDocuments({ isActive: true });
    const totalOnline = await User.countDocuments({ isActive: true, isOnline: true });

    res.json({
      totalUsers,
      totalOnline,
      byRole: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  changePassword,
  getUsersByRole,
  getAllMentors,
  updateOnlineStatus,
  getProjectTeamMembers,
  bulkCreateUsers,
  refreshAuthToken,
  logoutUser,
  searchUsersBySkill,
  getUserStatistics
};
