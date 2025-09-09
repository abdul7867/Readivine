#!/usr/bin/env node

/**
 * Comprehensive Authentication Test Runner
 * 
 * This script runs all authentication-related tests and provides
 * detailed reporting on the authentication system's health.
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const TEST_CATEGORIES = {
  'Authentication Flow': 'src/test/auth/authFlow.test.js',
  'Route Protection': 'src/test/auth/routeProtection.test.js',
  'API Configuration': 'src/test/auth/apiConfiguration.test.js',
  'Redirect Loop Prevention': 'src/test/redirectLoopPrevention.test.js',
  'Integration Tests': 'src/test/integration/redirectLoopIntegration.test.js'
};

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class TestRunner {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  logHeader(message) {
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log(` ${message}`, 'bright');
    this.log('='.repeat(60), 'cyan');
  }

  logSubHeader(message) {
    this.log(`\n${'-'.repeat(40)}`, 'blue');
    this.log(` ${message}`, 'blue');
    this.log('-'.repeat(40), 'blue');
  }

  async runTest(category, testFile) {
    this.logSubHeader(`Running ${category} Tests`);
    
    try {
      const startTime = Date.now();
      
      // Run the test with vitest
      const command = `npx vitest run ${testFile} --reporter=json --reporter=verbose`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const duration = Date.now() - startTime;
      
      // Parse JSON output (vitest outputs JSON to stderr when using json reporter)
      let jsonOutput;
      try {
        const lines = output.split('\n');
        const jsonLine = lines.find(line => line.trim().startsWith('{'));
        if (jsonLine) {
          jsonOutput = JSON.parse(jsonLine);
        }
      } catch (parseError) {
        // Fallback if JSON parsing fails
        jsonOutput = { success: true, numTotalTests: 0, numPassedTests: 0 };
      }
      
      this.results[category] = {
        status: 'passed',
        duration,
        tests: jsonOutput.numTotalTests || 0,
        passed: jsonOutput.numPassedTests || 0,
        failed: (jsonOutput.numTotalTests || 0) - (jsonOutput.numPassedTests || 0),
        output: output
      };
      
      this.log(`✅ ${category}: ${this.results[category].passed}/${this.results[category].tests} tests passed (${duration}ms)`, 'green');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results[category] = {
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout || error.message
      };
      
      this.log(`❌ ${category}: Tests failed (${duration}ms)`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
    }
  }

  async runAllTests() {
    this.logHeader('Authentication System Test Suite');
    this.log('Running comprehensive tests for authentication and routing...', 'cyan');
    
    for (const [category, testFile] of Object.entries(TEST_CATEGORIES)) {
      await this.runTest(category, testFile);
    }
    
    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    
    this.logHeader('Test Results Summary');
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let passedCategories = 0;
    let failedCategories = 0;
    
    for (const [category, result] of Object.entries(this.results)) {
      if (result.status === 'passed') {
        totalTests += result.tests;
        totalPassed += result.passed;
        totalFailed += result.failed;
        passedCategories++;
        
        this.log(`✅ ${category}: ${result.passed}/${result.tests} tests (${result.duration}ms)`, 'green');
      } else {
        failedCategories++;
        this.log(`❌ ${category}: Failed (${result.duration}ms)`, 'red');
      }
    }
    
    this.log('\n' + '='.repeat(60), 'cyan');
    this.log(`Total Categories: ${passedCategories + failedCategories}`, 'bright');
    this.log(`Passed Categories: ${passedCategories}`, passedCategories > 0 ? 'green' : 'red');
    this.log(`Failed Categories: ${failedCategories}`, failedCategories > 0 ? 'red' : 'green');
    this.log(`Total Tests: ${totalTests}`, 'bright');
    this.log(`Passed Tests: ${totalPassed}`, totalPassed > 0 ? 'green' : 'red');
    this.log(`Failed Tests: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
    this.log(`Total Duration: ${totalDuration}ms`, 'bright');
    this.log('='.repeat(60), 'cyan');
    
    // Overall status
    if (failedCategories === 0 && totalFailed === 0) {
      this.log('\n🎉 All authentication tests passed! Your auth system is working correctly.', 'green');
    } else {
      this.log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    }
    
    // Generate detailed report file
    this.generateDetailedReport(totalDuration, totalTests, totalPassed, totalFailed);
    
    // Exit with appropriate code
    process.exit(failedCategories > 0 || totalFailed > 0 ? 1 : 0);
  }

  generateDetailedReport(totalDuration, totalTests, totalPassed, totalFailed) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration,
        totalTests,
        totalPassed,
        totalFailed,
        categories: Object.keys(this.results).length,
        passedCategories: Object.values(this.results).filter(r => r.status === 'passed').length,
        failedCategories: Object.values(this.results).filter(r => r.status === 'failed').length
      },
      results: this.results,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = join(process.cwd(), 'auth-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`\n📄 Detailed report saved to: ${reportPath}`, 'blue');
  }

  generateRecommendations() {
    const recommendations = [];
    
    for (const [category, result] of Object.entries(this.results)) {
      if (result.status === 'failed') {
        switch (category) {
          case 'Authentication Flow':
            recommendations.push({
              category,
              issue: 'Authentication flow tests failed',
              suggestion: 'Check AuthContext implementation, API endpoints, and error handling'
            });
            break;
          case 'Route Protection':
            recommendations.push({
              category,
              issue: 'Route protection tests failed',
              suggestion: 'Review ProtectedRoute and PublicRoute components, check redirect logic'
            });
            break;
          case 'API Configuration':
            recommendations.push({
              category,
              issue: 'API configuration tests failed',
              suggestion: 'Verify environment variables, API base URL configuration, and axios setup'
            });
            break;
          case 'Redirect Loop Prevention':
            recommendations.push({
              category,
              issue: 'Redirect loop prevention tests failed',
              suggestion: 'Check circuit breaker implementation and redirect validation logic'
            });
            break;
          default:
            recommendations.push({
              category,
              issue: `${category} tests failed`,
              suggestion: 'Review the specific test failures and fix the underlying issues'
            });
        }
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'General',
        issue: 'All tests passed',
        suggestion: 'Your authentication system is working correctly. Consider adding more edge case tests.'
      });
    }
    
    return recommendations;
  }
}

// Health check function
async function checkTestEnvironment() {
  console.log('🔍 Checking test environment...');
  
  const checks = [
    {
      name: 'Node.js version',
      check: () => process.version,
      expected: 'v16+ or v18+'
    },
    {
      name: 'Vitest availability',
      check: () => {
        try {
          execSync('npx vitest --version', { stdio: 'pipe' });
          return 'Available';
        } catch {
          return 'Not available';
        }
      },
      expected: 'Available'
    },
    {
      name: 'Test files exist',
      check: () => {
        const missing = [];
        for (const [category, file] of Object.entries(TEST_CATEGORIES)) {
          try {
            readFileSync(file);
          } catch {
            missing.push(file);
          }
        }
        return missing.length === 0 ? 'All present' : `Missing: ${missing.join(', ')}`;
      },
      expected: 'All present'
    }
  ];
  
  let allGood = true;
  for (const check of checks) {
    const result = check.check();
    const status = result.includes('Not available') || result.includes('Missing') ? '❌' : '✅';
    console.log(`${status} ${check.name}: ${result}`);
    if (status === '❌') allGood = false;
  }
  
  if (!allGood) {
    console.log('\n⚠️  Environment check failed. Please fix the issues above before running tests.');
    process.exit(1);
  }
  
  console.log('✅ Environment check passed!\n');
}

// Main execution
async function main() {
  try {
    await checkTestEnvironment();
    
    const runner = new TestRunner();
    await runner.runAllTests();
    
  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { TestRunner, checkTestEnvironment };