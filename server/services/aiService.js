/**
 * AI Service
 * Integration with Google Gemini API for intelligent project analysis and suggestions
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-pro' });

/**
 * Analyze project chat messages to extract insights
 * @param {Array} messages - Array of chat messages
 * @param {Object} projectInfo - Project information
 * @returns {Promise<Object>} Analysis results
 */
export const analyzeChatMessages = async (messages, projectInfo) => {
  try {
    // Prepare message context
    const chatContext = messages
      .slice(-50) // Last 50 messages
      .map(m => `${m.sender?.name || 'User'}: ${m.message}`)
      .join('\n');

    const prompt = `
You are an AI project management assistant analyzing team communications.

Project: ${projectInfo.title}
Description: ${projectInfo.description}
Status: ${projectInfo.status}
Deadline: ${projectInfo.deadline}

Recent Chat Messages:
${chatContext}

Based on the chat history, provide a JSON response with:
1. topics: Array of 3-5 key discussion topics
2. blockers: Array of identified blockers or concerns
3. nextSteps: Array of suggested next steps or action items
4. insights: String with team collaboration insights

Return only valid JSON, no markdown or additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean response and parse JSON
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(jsonText);

    return {
      success: true,
      analysis: analysis,
      tokensUsed: text.length // Approximate token count
    };

  } catch (error) {
    console.error('Chat analysis error:', error);
    return {
      success: false,
      error: error.message,
      fallback: {
        topics: ['Unable to analyze at this time'],
        blockers: [],
        nextSteps: ['Continue project work as planned'],
        insights: 'AI analysis temporarily unavailable'
      }
    };
  }
};

/**
 * Detect project risks based on data
 * @param {Object} project - Project data with tasks and timeline
 * @returns {Promise<Object>} Risk analysis
 */
export const detectProjectRisks = async (project) => {
  try {
    const now = new Date();
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    const taskStats = {
      total: project.stats.totalTasks,
      completed: project.stats.completedTasks,
      pending: project.stats.pendingTasks,
      inProgress: project.stats.inProgressTasks,
      progress: project.progress
    };

    const prompt = `
Analyze this project for potential risks and provide a JSON response:

Project: ${project.title}
Status: ${project.status}
Progress: ${project.progress}%
Days Remaining: ${daysRemaining}
Total Tasks: ${taskStats.total}
Completed Tasks: ${taskStats.completed}
Pending Tasks: ${taskStats.pending}
In Progress Tasks: ${taskStats.inProgress}

Provide JSON with:
1. riskLevel: "low", "medium", or "high"
2. riskFactors: Array of 3-5 specific risk factors
3. recommendations: Array of recommendations to mitigate risks
4. completionLikelihood: String describing predicted completion likelihood

Return only valid JSON, no markdown or additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean response and parse JSON
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const riskAnalysis = JSON.parse(jsonText);

    return {
      success: true,
      risks: riskAnalysis,
      tokensUsed: text.length
    };

  } catch (error) {
    console.error('Risk detection error:', error);
    
    // Fallback risk assessment based on simple rules
    const now = new Date();
    const deadline = new Date(project.deadline);
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    let riskLevel = 'low';
    const riskFactors = [];
    
    if (daysRemaining < 7 && project.progress < 70) {
      riskLevel = 'high';
      riskFactors.push('Less than a week remaining with low progress');
    } else if (daysRemaining < 14 && project.progress < 50) {
      riskLevel = 'medium';
      riskFactors.push('Limited time with moderate progress');
    }
    
    if (project.stats.pendingTasks > project.stats.inProgressTasks * 2) {
      riskFactors.push('High number of pending tasks');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }
    
    return {
      success: false,
      error: error.message,
      fallback: {
        riskLevel,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risks detected'],
        recommendations: ['Monitor progress regularly', 'Increase team communication'],
        completionLikelihood: project.progress > 50 ? 'Good' : 'Moderate'
      }
    };
  }
};

/**
 * Analyze team member participation
 * @param {Object} projectData - Project with tasks and chat data
 * @returns {Promise<Object>} Participation analysis
 */
export const analyzeParticipation = async (projectData) => {
  try {
    const { project, tasks, messages } = projectData;
    
    // Calculate basic participation metrics
    const memberStats = {};
    
    project.members.forEach(member => {
      const userId = member.user._id || member.user;
      memberStats[userId] = {
        name: member.user.name || 'Unknown',
        tasksAssigned: 0,
        tasksCompleted: 0,
        messagesCount: 0,
        participationScore: 0
      };
    });
    
    // Count task assignments and completions
    tasks.forEach(task => {
      const assigneeId = task.assignedTo._id || task.assignedTo;
      if (memberStats[assigneeId]) {
        memberStats[assigneeId].tasksAssigned++;
        if (task.status === 'completed') {
          memberStats[assigneeId].tasksCompleted++;
        }
      }
    });
    
    // Count messages
    messages.forEach(msg => {
      const senderId = msg.sender._id || msg.sender;
      if (memberStats[senderId]) {
        memberStats[senderId].messagesCount++;
      }
    });
    
    // Calculate participation scores
    Object.keys(memberStats).forEach(userId => {
      const stats = memberStats[userId];
      const completionRate = stats.tasksAssigned > 0 
        ? (stats.tasksCompleted / stats.tasksAssigned) * 100 
        : 0;
      
      // Score: 40% task completion, 30% tasks assigned, 30% communication
      stats.participationScore = Math.round(
        (completionRate * 0.4) +
        (Math.min(stats.tasksAssigned * 10, 30)) +
        (Math.min(stats.messagesCount * 2, 30))
      );
    });

    const prompt = `
Analyze team participation for project: ${project.title}

Member Statistics:
${Object.values(memberStats).map(s => 
  `${s.name}: ${s.tasksCompleted}/${s.tasksAssigned} tasks, ${s.messagesCount} messages, Score: ${s.participationScore}`
).join('\n')}

Provide JSON response with:
1. rating: Number from 1-10 for overall team collaboration
2. observations: Array of key observations about participation
3. suggestions: Array of suggestions to improve engagement
4. topContributors: Array of names of top contributors

Return only valid JSON, no markdown or additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean response and parse JSON
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const analysis = JSON.parse(jsonText);

    return {
      success: true,
      memberStats: memberStats,
      aiAnalysis: analysis,
      tokensUsed: text.length
    };

  } catch (error) {
    console.error('Participation analysis error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate workflow improvement suggestions
 * @param {Object} projectData - Comprehensive project data
 * @returns {Promise<Object>} Suggestions
 */
export const generateSuggestions = async (projectData) => {
  try {
    const { project, tasks } = projectData;
    
    const overdueTasks = tasks.filter(t => 
      new Date(t.deadline) < new Date() && t.status !== 'completed'
    ).length;
    
    const highPriorityTasks = tasks.filter(t => 
      t.priority === 'high' || t.priority === 'urgent'
    ).length;

    const prompt = `
Generate workflow improvement suggestions for: ${project.title}

Current Status:
- Progress: ${project.progress}%
- Total Tasks: ${project.stats.totalTasks}
- Overdue Tasks: ${overdueTasks}
- High Priority Tasks: ${highPriorityTasks}
- Project Status: ${project.status}

Provide JSON response with:
1. priorityActions: Array of 3-5 specific priority actions
2. processImprovements: Array of process improvements
3. timeManagement: Array of time management tips
4. communication: Array of communication strategies

Return only valid JSON, no markdown or additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean response and parse JSON
    const jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const suggestions = JSON.parse(jsonText);

    return {
      success: true,
      suggestions: suggestions,
      tokensUsed: text.length
    };

  } catch (error) {
    console.error('Suggestions generation error:', error);
    return {
      success: false,
      error: error.message,
      fallback: {
        priorityActions: [
          'Focus on high-priority tasks first',
          'Review overdue items and reassign if needed',
          'Schedule daily standup meetings'
        ],
        processImprovements: [
          'Implement task reviews before deadline',
          'Use task dependencies to manage workflow'
        ],
        timeManagement: [
          'Break large tasks into subtasks',
          'Set realistic deadlines with buffer time'
        ],
        communication: [
          'Maintain regular team updates',
          'Use project chat for quick questions'
        ]
      }
    };
  }
};

/**
 * Predict project completion date
 * @param {Object} project - Project with historical data
 * @returns {Promise<Object>} Prediction
 */
export const predictCompletion = async (project) => {
  try {
    const now = new Date();
    const startDate = new Date(project.startDate);
    const deadline = new Date(project.deadline);
    
    const daysElapsed = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const progressRate = daysElapsed > 0 ? project.progress / daysElapsed : 0;
    
    const remainingProgress = 100 - project.progress;
    const estimatedDaysNeeded = progressRate > 0 ? remainingProgress / progressRate : 999;
    
    const predictedDate = new Date(now.getTime() + (estimatedDaysNeeded * 24 * 60 * 60 * 1000));
    
    const willMeetDeadline = predictedDate <= deadline;
    const variance = Math.ceil((predictedDate - deadline) / (1000 * 60 * 60 * 24));

    return {
      success: true,
      prediction: {
        predictedCompletionDate: predictedDate.toISOString().split('T')[0],
        willMeetDeadline: willMeetDeadline,
        daysVariance: variance,
        confidence: progressRate > 0 ? 'Medium' : 'Low',
        currentProgressRate: progressRate.toFixed(2),
        recommendation: willMeetDeadline 
          ? 'On track to meet deadline' 
          : 'Need to accelerate progress to meet deadline'
      }
    };

  } catch (error) {
    console.error('Completion prediction error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Generate smart reminders based on project status
 * @param {Object} project - Project data
 * @param {Array} tasks - Project tasks
 * @returns {Promise<Array>} Array of reminders
 */
export const generateReminders = async (project, tasks) => {
  try {
    const reminders = [];
    const now = new Date();

    // Check project deadline
    const deadline = new Date(project.deadline);
    const daysToDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysToDeadline <= 7 && daysToDeadline > 0 && project.progress < 80) {
      reminders.push({
        type: 'project-deadline',
        priority: 'high',
        message: `Project "${project.title}" deadline is in ${daysToDeadline} days. Current progress: ${project.progress}%`,
        actionRequired: 'Review progress and prioritize remaining tasks'
      });
    }

    // Check overdue tasks
    const overdueTasks = tasks.filter(t => 
      new Date(t.deadline) < now && t.status !== 'completed'
    );
    
    if (overdueTasks.length > 0) {
      reminders.push({
        type: 'overdue-tasks',
        priority: 'urgent',
        message: `${overdueTasks.length} task(s) are overdue`,
        actionRequired: 'Address overdue tasks immediately',
        tasks: overdueTasks.map(t => t.title)
      });
    }

    // Check upcoming task deadlines
    const upcomingTasks = tasks.filter(t => {
      const taskDeadline = new Date(t.deadline);
      const daysAway = Math.ceil((taskDeadline - now) / (1000 * 60 * 60 * 24));
      return daysAway <= 2 && daysAway >= 0 && t.status !== 'completed';
    });

    if (upcomingTasks.length > 0) {
      reminders.push({
        type: 'upcoming-deadlines',
        priority: 'medium',
        message: `${upcomingTasks.length} task(s) due within 48 hours`,
        tasks: upcomingTasks.map(t => ({ title: t.title, deadline: t.deadline }))
      });
    }

    // Check pending reviews
    const pendingReviews = tasks.filter(t => t.status === 'in-review');
    
    if (pendingReviews.length > 0) {
      reminders.push({
        type: 'pending-reviews',
        priority: 'medium',
        message: `${pendingReviews.length} task(s) waiting for review`,
        actionRequired: 'Review and provide feedback on submitted tasks'
      });
    }

    return {
      success: true,
      reminders: reminders,
      count: reminders.length
    };

  } catch (error) {
    console.error('Reminders generation error:', error);
    return {
      success: false,
      error: error.message,
      reminders: []
    };
  }
};

export default {
  analyzeChatMessages,
  detectProjectRisks,
  analyzeParticipation,
  generateSuggestions,
  predictCompletion,
  generateReminders
};
