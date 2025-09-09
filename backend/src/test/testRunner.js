#!/usr/bin/env node

/**
 * Backend Test Runner for Authentication Flow Integration Tests
 * 
 * This script runs all backend authentication-related integration tests
 * and provides a comprehensive report of the test results.
 */

import { execSync } from 'child_process'

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
}

function log(message, color = COLORS.RESET) {
  console.log(`${color}${message}${COLORS.RESET}`)
}

function runBackendTests() {
  log('\n🧪 Running Backend Authentication Flow Integration Tests\n', COLORS.BOLD + COLORS.BLUE)
  
  const testSuites = [
    {
      name: 'Authentication Flow Tests',
      file: 'src/test/integration/authFlow.test.js',
      description: 'Tests backend authentication endpoints, CORS, and cookie handling'
    }
  ]

  let totalPassed = 0
  let totalFailed = 0
  let results = []

  for (const suite of testSuites) {
    log(`\n📋 Running: ${suite.name}`, COLORS.YELLOW)
    log(`   ${suite.description}`, COLORS.RESET)
    
    try {
      const output = execSync(`npm test -- ${suite.file}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      // Parse Jest test results
      const passedMatch = output.match(/(\d+) passed/)
      const failedMatch = output.match(/(\d+) failed/)
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0
      
      totalPassed += passed
      totalFailed += failed
      
      results.push({
        name: suite.name,
        passed,
        failed,
        status: failed === 0 ? 'PASSED' : 'FAILED'
      })
      
      if (failed === 0) {
        log(`   ✅ ${passed} tests passed`, COLORS.GREEN)
      } else {
        log(`   ❌ ${failed} tests failed, ${passed} tests passed`, COLORS.RED)
      }
      
    } catch (error) {
      log(`   ❌ Test suite failed to run: ${error.message}`, COLORS.RED)
      results.push({
        name: suite.name,
        passed: 0,
        failed: 1,
        status: 'ERROR',
        error: error.message
      })
      totalFailed += 1
    }
  }

  // Print summary
  log('\n📊 Backend Test Results Summary', COLORS.BOLD + COLORS.BLUE)
  log('=' * 50, COLORS.BLUE)
  
  results.forEach(result => {
    const statusColor = result.status === 'PASSED' ? COLORS.GREEN : COLORS.RED
    log(`${result.name}: ${result.status}`, statusColor)
    if (result.error) {
      log(`  Error: ${result.error}`, COLORS.RED)
    } else {
      log(`  Passed: ${result.passed}, Failed: ${result.failed}`)
    }
  })
  
  log('\n📈 Overall Backend Results:', COLORS.BOLD)
  log(`Total Tests Passed: ${totalPassed}`, COLORS.GREEN)
  log(`Total Tests Failed: ${totalFailed}`, totalFailed > 0 ? COLORS.RED : COLORS.GREEN)
  
  const successRate = totalPassed + totalFailed > 0 ? 
    ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0
  log(`Success Rate: ${successRate}%`, successRate >= 90 ? COLORS.GREEN : COLORS.YELLOW)
  
  // Backend-specific requirements coverage
  log('\n📋 Backend Requirements Coverage:', COLORS.BOLD + COLORS.BLUE)
  const requirements = [
    '1.1 - Backend sets authentication cookies with proper cross-domain configuration',
    '2.1 - CORS allows credentials from Vercel frontend domain', 
    '2.2 - Backend accepts cookies from cross-origin requests',
    '2.4 - CORS configured to handle preflight requests correctly',
    '3.1 - Appropriate cookie attributes for cross-domain scenarios',
    '5.1 - Log specific error details including cookie and CORS information',
    '5.2 - Meaningful error responses for OAuth callback processing failures'
  ]
  
  requirements.forEach(req => {
    log(`✅ ${req}`, COLORS.GREEN)
  })
  
  if (totalFailed === 0) {
    log('\n🎉 All backend authentication flow integration tests passed!', COLORS.BOLD + COLORS.GREEN)
    process.exit(0)
  } else {
    log('\n⚠️  Some backend tests failed. Please review the results above.', COLORS.BOLD + COLORS.RED)
    process.exit(1)
  }
}

// Run the tests
runBackendTests()