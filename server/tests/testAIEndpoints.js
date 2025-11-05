/**
 * Test AI Endpoints
 * Tests all AI routes with proper authentication
 */

import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';

// Test credentials - UPDATE THESE with actual test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Test project ID - UPDATE THIS with actual project ID
const TEST_PROJECT_ID = '6729a1b2c3d4e5f678901234';
const TEST_TASK_ID = '6729a1b2c3d4e5f678901235';

let authToken = '';

/**
 * Helper function to make authenticated API requests
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

/**
 * Test 1: Login and get auth token
 */
async function testLogin() {
  console.log('\n📝 Test 1: User Login');
  console.log('─'.repeat(50));

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_USER)
    });

    const data = await response.json();

    if (response.ok && data.token) {
      authToken = data.token;
      console.log('✅ Login successful');
      console.log(`   User: ${data.user.name}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Login failed:', data.error || data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return false;
  }
}

/**
 * Test 2: Test AI service availability
 */
async function testAIAvailability() {
  console.log('\n🤖 Test 2: AI Service Availability');
  console.log('─'.repeat(50));

  const result = await apiRequest('/api/ai/test', 'GET');

  if (result.ok) {
    console.log('✅ AI Service is available');
    console.log(`   Status: ${result.data.available ? 'Online' : 'Offline'}`);
    console.log(`   Message: ${result.data.message}`);
  } else {
    console.log('❌ AI Service test failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 3: Get AI usage statistics
 */
async function testAIStats() {
  console.log('\n📊 Test 3: AI Usage Statistics');
  console.log('─'.repeat(50));

  const result = await apiRequest('/api/ai/stats', 'GET');

  if (result.ok) {
    console.log('✅ Stats retrieved successfully');
    console.log(`   Total Calls: ${result.data.stats.totalCalls}`);
    console.log(`   Total Tokens: ${result.data.stats.totalTokens}`);
    console.log(`   Estimated Cost: ${result.data.stats.estimatedCost}`);
    console.log(`   Cache Hits: ${result.data.stats.cacheHits}`);
    console.log(`   Cache Misses: ${result.data.stats.cacheMisses}`);
  } else {
    console.log('❌ Failed to get stats');
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 4: Analyze project chat
 */
async function testAnalyzeChat() {
  console.log('\n💬 Test 4: Analyze Project Chat');
  console.log('─'.repeat(50));

  const result = await apiRequest(`/api/ai/analyze-chat/${TEST_PROJECT_ID}`, 'POST');

  if (result.ok) {
    console.log('✅ Chat analysis successful');
    console.log(`   Project: ${result.data.analysis.projectName}`);
    console.log(`   Messages Analyzed: ${result.data.analysis.messageCount}`);
    console.log(`   Key Topics: ${result.data.analysis.keyTopics.length}`);
    console.log(`   Action Items: ${result.data.analysis.actionItems.length}`);
    console.log(`   Next Steps: ${result.data.analysis.nextSteps.length}`);
    console.log(`   Blockers: ${result.data.analysis.blockers.length}`);
    
    if (result.data.analysis.keyTopics.length > 0) {
      console.log('\n   📌 Topics:');
      result.data.analysis.keyTopics.forEach((topic, i) => {
        console.log(`      ${i + 1}. ${topic}`);
      });
    }
  } else {
    console.log('❌ Chat analysis failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 5: Suggest deadline for task
 */
async function testSuggestDeadline() {
  console.log('\n📅 Test 5: Suggest Task Deadline');
  console.log('─'.repeat(50));

  const result = await apiRequest(`/api/ai/suggest-deadline/${TEST_TASK_ID}`, 'POST', {
    currentWorkload: 'Medium - 3 other tasks in progress'
  });

  if (result.ok) {
    console.log('✅ Deadline suggestion successful');
    console.log(`   Task: ${result.data.suggestion.taskTitle}`);
    console.log(`   Suggested Deadline: ${result.data.suggestion.suggestedDeadline}`);
    console.log(`   Duration: ${result.data.suggestion.durationDays} days`);
    console.log(`   Confidence: ${result.data.suggestion.confidence}`);
    console.log(`   Reasoning: ${result.data.suggestion.reasoning.substring(0, 100)}...`);
  } else {
    console.log('❌ Deadline suggestion failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 6: Analyze member participation
 */
async function testParticipationAnalysis() {
  console.log('\n👥 Test 6: Analyze Member Participation');
  console.log('─'.repeat(50));

  const result = await apiRequest(`/api/ai/analyze-participation/${TEST_PROJECT_ID}`, 'POST');

  if (result.ok) {
    console.log('✅ Participation analysis successful');
    console.log(`   Project: ${result.data.analytics.projectName}`);
    console.log(`   Total Messages: ${result.data.analytics.totalMessages}`);
    console.log(`   Members Analyzed: ${result.data.analytics.memberScores.length}`);
    console.log(`   Inactive Members: ${result.data.analytics.inactiveMembers.length}`);
    
    if (result.data.analytics.memberScores.length > 0) {
      console.log('\n   📊 Top Contributors:');
      result.data.analytics.memberScores.slice(0, 3).forEach((member, i) => {
        console.log(`      ${i + 1}. ${member.name} - Score: ${member.score} (${member.level})`);
      });
    }
  } else {
    console.log('❌ Participation analysis failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 7: Generate project summary
 */
async function testProjectSummary() {
  console.log('\n📊 Test 7: Generate Project Summary');
  console.log('─'.repeat(50));

  const result = await apiRequest(`/api/ai/generate-summary/${TEST_PROJECT_ID}`, 'POST');

  if (result.ok) {
    console.log('✅ Project summary generated');
    console.log(`   Project: ${result.data.summary.projectName}`);
    console.log(`   Team Sentiment: ${result.data.summary.teamSentiment}`);
    console.log(`   Key Decisions: ${result.data.summary.keyDecisions.length}`);
    console.log(`   Completed Items: ${result.data.summary.completedItems.length}`);
    console.log(`   Upcoming Milestones: ${result.data.summary.upcomingMilestones.length}`);
    
    console.log('\n   📝 Executive Summary:');
    console.log(`      ${result.data.summary.executiveSummary.substring(0, 150)}...`);
  } else {
    console.log('❌ Project summary failed');
    console.log(`   Status: ${result.status}`);
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Test 8: Clear AI cache
 */
async function testClearCache() {
  console.log('\n🗑️  Test 8: Clear AI Cache');
  console.log('─'.repeat(50));

  const result = await apiRequest('/api/ai/clear-cache', 'POST');

  if (result.ok) {
    console.log('✅ Cache cleared successfully');
    console.log(`   Message: ${result.data.message}`);
  } else {
    console.log('❌ Failed to clear cache');
    console.log(`   Error: ${result.data.error || 'Unknown error'}`);
  }

  return result.ok;
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║       AI ENDPOINTS TEST SUITE                  ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n🌐 API URL: ${API_URL}`);
  console.log(`📧 Test User: ${TEST_USER.email}`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Login (required for all other tests)
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n❌ Login failed. Cannot proceed with other tests.');
    console.log('\n💡 Tips:');
    console.log('   1. Update TEST_USER credentials in this script');
    console.log('   2. Make sure MongoDB is connected');
    console.log('   3. Register a test user first using POST /api/auth/register');
    return;
  }

  // Run all AI endpoint tests
  const tests = [
    { name: 'AI Availability', fn: testAIAvailability },
    { name: 'AI Stats', fn: testAIStats },
    { name: 'Analyze Chat', fn: testAnalyzeChat },
    { name: 'Suggest Deadline', fn: testSuggestDeadline },
    { name: 'Participation Analysis', fn: testParticipationAnalysis },
    { name: 'Project Summary', fn: testProjectSummary },
    { name: 'Clear Cache', fn: testClearCache }
  ];

  for (const test of tests) {
    const success = await test.fn();
    results.total++;
    if (success) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Print summary
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║            TEST SUMMARY                        ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n📊 Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('\n');

  if (results.failed > 0) {
    console.log('💡 Note: Some tests may fail if:');
    console.log('   - MongoDB is not connected');
    console.log('   - Test project/task IDs don\'t exist');
    console.log('   - User is not a member of the test project');
    console.log('   - GEMINI_API_KEY is not set');
    console.log('\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ Test suite error:', error.message);
  process.exit(1);
});
