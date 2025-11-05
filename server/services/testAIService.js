/**
 * Test script for AI Service functions
 * Tests all 4 core functions with sample data
 */

// Load environment variables FIRST before any imports
import dotenv from 'dotenv';
dotenv.config();

// Now import aiService after env vars are loaded
import aiService from './aiService.js';

// Sample data for testing
const sampleMessages = [
  {
    _id: '1',
    sender: { id: 'user1', name: 'Alice Johnson' },
    text: 'We need to discuss the authentication module implementation',
    createdAt: new Date('2025-11-01T10:00:00Z')
  },
  {
    _id: '2',
    sender: { id: 'user2', name: 'Bob Smith' },
    text: 'I think we should use JWT tokens for session management',
    createdAt: new Date('2025-11-01T10:05:00Z')
  },
  {
    _id: '3',
    sender: { id: 'user1', name: 'Alice Johnson' },
    text: 'Agreed. But we have a blocker - the database schema needs to be finalized first',
    createdAt: new Date('2025-11-01T10:10:00Z')
  },
  {
    _id: '4',
    sender: { id: 'user3', name: 'Charlie Brown' },
    text: 'I can work on the database schema. Will have it ready by tomorrow.',
    createdAt: new Date('2025-11-01T10:15:00Z')
  },
  {
    _id: '5',
    sender: { id: 'user2', name: 'Bob Smith' },
    text: 'Great! Once that\'s done, I\'ll start implementing the JWT authentication',
    createdAt: new Date('2025-11-01T10:20:00Z')
  },
  {
    _id: '6',
    sender: { id: 'user1', name: 'Alice Johnson' },
    text: 'Perfect. Let\'s also make sure we add proper error handling',
    createdAt: new Date('2025-11-01T10:25:00Z')
  }
];

const sampleTask = {
  title: 'Implement User Authentication with JWT',
  description: 'Create secure authentication system using JSON Web Tokens with refresh token mechanism',
  priority: 'high',
  assignedTo: { name: 'Bob Smith' },
  currentWorkload: '3 other tasks in progress'
};

const sampleProject = {
  _id: 'project123',
  name: 'E-Commerce Platform',
  description: 'Building a modern e-commerce platform with React and Node.js',
  status: 'active',
  priority: 'high',
  startDate: '2025-10-15',
  deadline: '2025-12-31',
  owner: { name: 'Alice Johnson' },
  memberCount: 5,
  taskStats: {
    total: 24,
    completed: 12,
    inProgress: 8,
    pending: 4
  },
  updatedAt: new Date().toISOString()
};

console.log('🧪 Starting AI Service Tests...\n');
console.log('='
.repeat(60));

// Test 1: analyzeChatMessages
async function testAnalyzeChatMessages() {
  console.log('\n📝 Test 1: Analyzing Chat Messages');
  console.log('-'.repeat(60));
  
  try {
    const result = await aiService.analyzeChatMessages(sampleMessages, 'web development');
    
    console.log('✅ Success!');
    console.log('Topics:', result.topics);
    console.log('Action Items:', result.actionItems);
    console.log('Next Steps:', result.nextSteps);
    console.log('Blockers:', result.blockers);
    console.log('Decisions:', result.decisions);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Test 2: generateDeadlineSuggestion
async function testGenerateDeadlineSuggestion() {
  console.log('\n📅 Test 2: Generating Deadline Suggestion');
  console.log('-'.repeat(60));
  
  try {
    const result = await aiService.generateDeadlineSuggestion(sampleTask, sampleMessages);
    
    console.log('✅ Success!');
    console.log('Suggested Deadline:', result.suggestedDeadline);
    console.log('Duration (days):', result.durationDays);
    console.log('Reasoning:', result.reasoning);
    console.log('Risk Factors:', result.riskFactors);
    console.log('Confidence:', result.confidence);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Test 3: analyzeMemberParticipation
async function testAnalyzeMemberParticipation() {
  console.log('\n👥 Test 3: Analyzing Member Participation');
  console.log('-'.repeat(60));
  
  try {
    const result = await aiService.analyzeMemberParticipation(sampleMessages);
    
    console.log('✅ Success!');
    console.log('Member Scores:', result.memberScores);
    console.log('Inactive Members:', result.inactiveMembers);
    console.log('Top Contributors:', result.topContributors);
    console.log('Engagement Quality:', result.engagementQuality);
    console.log('Recommendations:', result.recommendations);
    console.log('Raw Stats:', result.rawStats);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Test 4: generateProjectSummary
async function testGenerateProjectSummary() {
  console.log('\n📊 Test 4: Generating Project Summary');
  console.log('-'.repeat(60));
  
  try {
    const result = await aiService.generateProjectSummary(sampleProject, sampleMessages);
    
    console.log('✅ Success!');
    console.log('Executive Summary:', result.executiveSummary);
    console.log('Key Decisions:', result.keyDecisions);
    console.log('Completed Items:', result.completedItems);
    console.log('In Progress:', result.inProgress);
    console.log('Upcoming Milestones:', result.upcomingMilestones);
    console.log('Risks & Concerns:', result.risksAndConcerns);
    console.log('Team Sentiment:', result.teamSentiment);
    console.log('Generated At:', result.generatedAt);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Test 5: Test AI Service availability
async function testAIAvailability() {
  console.log('\n🔌 Test 5: AI Service Availability');
  console.log('-'.repeat(60));
  
  try {
    const result = await aiService.testAIService();
    
    if (result.success) {
      console.log('✅ AI Service is available');
      console.log('Response:', result.message);
      return true;
    } else {
      console.error('❌ AI Service unavailable:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

// Test 6: API Usage Statistics
function testAPIStats() {
  console.log('\n📊 Test 6: API Usage Statistics');
  console.log('-'.repeat(60));
  
  const stats = aiService.getAPIStats();
  
  console.log('Total API Calls:', stats.totalCalls);
  console.log('Total Tokens Used:', stats.totalTokens);
  console.log('Estimated Cost: $' + stats.estimatedCost.toFixed(4));
  console.log('Cache Stats:', stats.cacheStats);
}

// Run all tests
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  console.log('\n🚀 Running All Tests...');
  console.log('='
.repeat(60));

  // First check if AI is available
  const isAvailable = await testAIAvailability();
  
  if (!isAvailable) {
    console.log('\n⚠️ AI Service is not available. Make sure GEMINI_API_KEY is set in .env');
    console.log('Some tests will be skipped.');
  }

  // Test 1
  results.total++;
  if (await testAnalyzeChatMessages()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Wait a bit to avoid rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2
  results.total++;
  if (await testGenerateDeadlineSuggestion()) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3
  results.total++;
  if (await testAnalyzeMemberParticipation()) {
    results.passed++;
  } else {
    results.failed++;
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 4
  results.total++;
  if (await testGenerateProjectSummary()) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test API Stats
  testAPIStats();

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 Test Summary');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(60));

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('\n💥 Fatal error running tests:', error);
  process.exit(1);
});
