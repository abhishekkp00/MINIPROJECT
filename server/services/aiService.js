/**
 * AI Service using Google Gemini API
 * Provides AI-powered insights for project management
 * Enhanced version with caching, cost tracking, and comprehensive error handling
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import NodeCache from 'node-cache';

// Initialize cache (TTL: 1 hour, check period: 2 minutes)
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

// Track API usage and costs
let apiCallCount = 0;
let totalTokensUsed = 0;

// Initialize Gemini client
let genAI = null;
let model = null;

/**
 * Initialize the Gemini AI client
 */
const initializeGemini = () => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables. AI features will be disabled.');
      return false;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('✅ Gemini AI initialized successfully (model: gemini-2.5-flash)');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Gemini AI:', error.message);
    return false;
  }
};

// Initialize on module load
initializeGemini();

/**
 * Check if AI service is available
 */
const isAIAvailable = () => {
  return genAI !== null && model !== null;
};

/**
 * Generate cache key from parameters
 */
const generateCacheKey = (functionName, params) => {
  return `${functionName}_${JSON.stringify(params)}`;
};

/**
 * Log API usage
 */
const logAPIUsage = (functionName, tokensUsed = 0, cached = false) => {
  if (!cached) {
    apiCallCount++;
    totalTokensUsed += tokensUsed;
  }
  
  console.log(`📊 AI Usage - Function: ${functionName}, Cached: ${cached}, Total Calls: ${apiCallCount}, Total Tokens: ${totalTokensUsed}`);
};

/**
 * Get API usage statistics
 */
export const getAPIStats = () => {
  return {
    totalCalls: apiCallCount,
    totalTokens: totalTokensUsed,
    estimatedCost: (totalTokensUsed / 1000000) * 0.075, // Gemini 2.0 Flash pricing
    cacheStats: cache.getStats(),
  };
};

/**
 * Clear cache
 */
export const clearCache = () => {
  cache.flushAll();
  console.log('🗑️ AI cache cleared');
};

/**
 * Analyze chat messages to extract key topics and suggest next steps
 * @param {Array} messages - Array of message objects
 * @param {String} projectType - Type of project (web, mobile, data, etc.)
 * @returns {Object} Analysis with topics and suggestions
 */
export const analyzeChatMessages = async (messages, projectType = 'general') => {
  const functionName = 'analyzeChatMessages';
  
  try {
    // Check if AI is available
    if (!isAIAvailable()) {
      throw new Error('AI service not available. Please check GEMINI_API_KEY.');
    }

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array provided');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(functionName, { 
      messageCount: messages.length,
      lastMessageId: messages[messages.length - 1]._id 
    });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logAPIUsage(functionName, 0, true);
      return cached;
    }

    // Prepare messages for analysis (limit to last 50 to save tokens)
    const recentMessages = messages.slice(-50).map(msg => ({
      sender: msg.sender?.name || 'Unknown',
      text: msg.text,
      timestamp: msg.createdAt
    }));

    const prompt = `You are an AI assistant analyzing project chat messages for a ${projectType} project.

Chat Messages:
${JSON.stringify(recentMessages, null, 2)}

Please analyze these messages and provide:
1. **Key Topics**: List the main discussion topics (max 5)
2. **Action Items**: Extract any tasks or action items mentioned
3. **Next Steps**: Suggest 3-5 logical next steps based on the conversation
4. **Blockers**: Identify any mentioned blockers or issues
5. **Decisions Made**: List any decisions that were made

Format your response as a JSON object with these keys: topics, actionItems, nextSteps, blockers, decisions

Respond ONLY with valid JSON, no additional text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let analysis;
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analysis = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    // Calculate tokens used (approximate)
    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
    logAPIUsage(functionName, tokensUsed, false);

    // Cache the result
    cache.set(cacheKey, analysis);

    return analysis;
  } catch (error) {
    console.error(`❌ Error in ${functionName}:`, error.message);
    throw new Error(`AI Analysis failed: ${error.message}`);
  }
};

/**
 * Generate realistic deadline suggestion for a task
 * @param {Object} taskData - Task information (title, description, priority, etc.)
 * @param {Array} chatHistory - Recent chat messages for context
 * @returns {Object} Deadline suggestion with reasoning
 */
export const generateDeadlineSuggestion = async (taskData, chatHistory = []) => {
  const functionName = 'generateDeadlineSuggestion';
  
  try {
    if (!isAIAvailable()) {
      throw new Error('AI service not available. Please check GEMINI_API_KEY.');
    }

    if (!taskData || !taskData.title) {
      throw new Error('Invalid task data provided');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(functionName, {
      taskTitle: taskData.title,
      priority: taskData.priority
    });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logAPIUsage(functionName, 0, true);
      return cached;
    }

    // Prepare context
    const recentChat = chatHistory.slice(-20).map(msg => msg.text).join('\n');
    
    const prompt = `You are a project management AI assistant. Suggest a realistic deadline for the following task.

Task Details:
- Title: ${taskData.title}
- Description: ${taskData.description || 'No description'}
- Priority: ${taskData.priority || 'medium'}
- Assigned To: ${taskData.assignedTo?.name || 'Unassigned'}
- Current Workload: ${taskData.currentWorkload || 'Unknown'}

Recent Team Discussion:
${recentChat || 'No recent chat history'}

Current Date: ${new Date().toISOString()}

Provide:
1. **Suggested Deadline**: A specific date (YYYY-MM-DD format)
2. **Duration**: Estimated days needed
3. **Reasoning**: Why this deadline makes sense (2-3 sentences)
4. **Risk Factors**: Any potential delays to consider
5. **Confidence**: Low, Medium, or High confidence in this estimate

Respond ONLY with valid JSON in this format:
{
  "suggestedDeadline": "YYYY-MM-DD",
  "durationDays": number,
  "reasoning": "string",
  "riskFactors": ["string"],
  "confidence": "Low|Medium|High"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let suggestion;
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      suggestion = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
    logAPIUsage(functionName, tokensUsed, false);

    cache.set(cacheKey, suggestion);

    return suggestion;
  } catch (error) {
    console.error(`❌ Error in ${functionName}:`, error.message);
    throw new Error(`Deadline suggestion failed: ${error.message}`);
  }
};

/**
 * Analyze member participation in chat
 * @param {Array} messages - Array of message objects with sender info
 * @returns {Object} Member analytics with activity scores
 */
export const analyzeMemberParticipation = async (messages) => {
  const functionName = 'analyzeMemberParticipation';
  
  try {
    if (!isAIAvailable()) {
      throw new Error('AI service not available. Please check GEMINI_API_KEY.');
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array provided');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(functionName, {
      messageCount: messages.length,
      timeRange: `${messages[0]?.createdAt}_${messages[messages.length - 1]?.createdAt}`
    });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logAPIUsage(functionName, 0, true);
      return cached;
    }

    // Calculate basic stats
    const memberStats = {};
    messages.forEach(msg => {
      const senderId = msg.sender?.id || msg.sender?._id;
      const senderName = msg.sender?.name || 'Unknown';
      
      if (!memberStats[senderId]) {
        memberStats[senderId] = {
          id: senderId,
          name: senderName,
          messageCount: 0,
          totalWords: 0,
          firstMessage: msg.createdAt,
          lastMessage: msg.createdAt,
          reactions: 0
        };
      }
      
      memberStats[senderId].messageCount++;
      memberStats[senderId].totalWords += (msg.text?.split(' ').length || 0);
      memberStats[senderId].lastMessage = msg.createdAt;
      memberStats[senderId].reactions += (msg.reactions?.length || 0);
    });

    // Convert to array
    const membersArray = Object.values(memberStats);

    const prompt = `You are an AI analyzing team member participation in a project chat.

Member Statistics:
${JSON.stringify(membersArray, null, 2)}

Total Messages: ${messages.length}
Time Period: ${messages[0]?.createdAt} to ${messages[messages.length - 1]?.createdAt}

Analyze the participation and provide:
1. **Activity Scores**: Rate each member's activity (0-100 scale)
2. **Inactive Members**: List members who are below average participation
3. **Top Contributors**: Top 3 most active members
4. **Engagement Quality**: Assess if conversations are balanced
5. **Recommendations**: Suggest how to improve team engagement

Respond ONLY with valid JSON:
{
  "memberScores": [{ "id": "string", "name": "string", "score": number, "level": "High|Medium|Low" }],
  "inactiveMembers": [{ "id": "string", "name": "string", "reason": "string" }],
  "topContributors": ["name1", "name2", "name3"],
  "engagementQuality": "string",
  "recommendations": ["string"]
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let analytics;
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      analytics = JSON.parse(cleanedText);
      
      // Add raw stats to response
      analytics.rawStats = membersArray;
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
    logAPIUsage(functionName, tokensUsed, false);

    cache.set(cacheKey, analytics);

    return analytics;
  } catch (error) {
    console.error(`❌ Error in ${functionName}:`, error.message);
    throw new Error(`Member participation analysis failed: ${error.message}`);
  }
};

/**
 * Generate a comprehensive project summary
 * @param {Object} projectData - Project information
 * @param {Array} messages - Chat messages
 * @returns {Object} Project summary with highlights
 */
export const generateProjectSummary = async (projectData, messages = []) => {
  const functionName = 'generateProjectSummary';
  
  try {
    if (!isAIAvailable()) {
      throw new Error('AI service not available. Please check GEMINI_API_KEY.');
    }

    if (!projectData || !projectData.name) {
      throw new Error('Invalid project data provided');
    }

    // Generate cache key
    const cacheKey = generateCacheKey(functionName, {
      projectId: projectData._id,
      lastUpdate: projectData.updatedAt || new Date().toISOString()
    });

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      logAPIUsage(functionName, 0, true);
      return cached;
    }

    // Prepare chat context
    const recentMessages = messages.slice(-30).map(msg => ({
      sender: msg.sender?.name || 'Unknown',
      text: msg.text,
      timestamp: msg.createdAt
    }));

    const prompt = `You are an AI assistant creating a project summary.

Project Information:
- Name: ${projectData.name}
- Description: ${projectData.description || 'No description'}
- Status: ${projectData.status || 'Unknown'}
- Priority: ${projectData.priority || 'Unknown'}
- Start Date: ${projectData.startDate || 'Not set'}
- Deadline: ${projectData.deadline || 'Not set'}
- Owner: ${projectData.owner?.name || 'Unknown'}
- Members: ${projectData.memberCount || projectData.members?.length || 0}
- Tasks: Total ${projectData.taskStats?.total || 0}, Completed ${projectData.taskStats?.completed || 0}

Recent Team Communication:
${JSON.stringify(recentMessages, null, 2)}

Create a comprehensive summary including:
1. **Executive Summary**: 2-3 sentence overview
2. **Key Decisions**: Important decisions made (list)
3. **Completed Items**: What has been accomplished (list)
4. **In Progress**: Current work items (list)
5. **Upcoming Milestones**: What's next (list)
6. **Risks & Concerns**: Any issues identified (list)
7. **Team Sentiment**: Overall team morale assessment

Respond ONLY with valid JSON:
{
  "executiveSummary": "string",
  "keyDecisions": ["string"],
  "completedItems": ["string"],
  "inProgress": ["string"],
  "upcomingMilestones": ["string"],
  "risksAndConcerns": ["string"],
  "teamSentiment": "Positive|Neutral|Concerned",
  "generatedAt": "${new Date().toISOString()}"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let summary;
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      summary = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', text);
      throw new Error('Failed to parse AI response as JSON');
    }

    const tokensUsed = Math.ceil((prompt.length + text.length) / 4);
    logAPIUsage(functionName, tokensUsed, false);

    cache.set(cacheKey, summary);

    return summary;
  } catch (error) {
    console.error(`❌ Error in ${functionName}:`, error.message);
    throw new Error(`Project summary generation failed: ${error.message}`);
  }
};

/**
 * Test function to verify AI service is working
 */
export const testAIService = async () => {
  try {
    if (!isAIAvailable()) {
      throw new Error('AI service not available');
    }

    const result = await model.generateContent('Respond with "Hello, AI is working!" and nothing else.');
    const response = await result.response;
    const text = response.text();

    console.log('✅ AI Test Response:', text);
    return { success: true, message: text };
  } catch (error) {
    console.error('❌ AI Test Failed:', error.message);
    return { success: false, error: error.message };
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
  // New functions with enhanced features
  analyzeChatMessages,
  generateDeadlineSuggestion,
  analyzeMemberParticipation,
  generateProjectSummary,
  testAIService,
  
  // Existing functions
  detectProjectRisks,
  analyzeParticipation,
  generateSuggestions,
  predictCompletion,
  generateReminders,
  
  // Utility functions
  getAPIStats,
  clearCache,
  isAIAvailable
};
