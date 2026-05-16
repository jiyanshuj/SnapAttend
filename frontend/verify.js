#!/usr/bin/env node

/**
 * AI Attendance System - Quick Verification Script
 * 
 * This script verifies that both backend and frontend are configured correctly
 * Run: npm run verify (after adding this to package.json scripts)
 * Or: node verify.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = 'http://localhost:5000';
const CHECKS = [];

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

function checkFile(filePath, name) {
    const exists = fs.existsSync(filePath);
    CHECKS.push({ name, exists, type: 'file' });
    const status = exists ? '✓' : '✗';
    const color = exists ? 'green' : 'red';
    log(`  ${status} ${name}`, color);
}

function checkEnv() {
    const envFile = path.join(__dirname, '.env');
    const envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf-8') : '';
    const hasApiUrl = envContent.includes('VITE_API_BASE_URL');
    CHECKS.push({ name: '.env has VITE_API_BASE_URL', exists: hasApiUrl, type: 'env' });
    const status = hasApiUrl ? '✓' : '✗';
    const color = hasApiUrl ? 'green' : 'red';
    log(`  ${status} .env has VITE_API_BASE_URL`, color);
}

async function checkBackendHealth() {
    return new Promise((resolve) => {
        http.get(`${BACKEND_URL}/api/health`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    const isHealthy = json.status === 'ok';
                    CHECKS.push({ name: 'Backend /api/health', exists: isHealthy, type: 'endpoint' });
                    const status = isHealthy ? '✓' : '✗';
                    const color = isHealthy ? 'green' : 'red';
                    log(`  ${status} Backend /api/health responding`, color);
                    resolve(isHealthy);
                } catch (e) {
                    CHECKS.push({ name: 'Backend /api/health', exists: false, type: 'endpoint' });
                    log(`  ✗ Backend returned invalid JSON`, 'red');
                    resolve(false);
                }
            });
        }).on('error', () => {
            CHECKS.push({ name: 'Backend connection', exists: false, type: 'endpoint' });
            log(`  ✗ Cannot connect to backend on ${BACKEND_URL}`, 'red');
            resolve(false);
        });
    });
}

async function runChecks() {
    console.clear();
    log('\n╔═══════════════════════════════════════════════════════════╗', 'blue');
    log('║     AI Attendance System - Verification Script           ║', 'blue');
    log('╚═══════════════════════════════════════════════════════════╝\n', 'blue');

    log('📁 Checking Files...', 'bold');
    checkFile(path.join(__dirname, '.env'), '.env');
    checkFile(path.join(__dirname, 'src/App.jsx'), 'src/App.jsx');
    checkFile(path.join(__dirname, 'src/main.jsx'), 'src/main.jsx');
    checkFile(path.join(__dirname, 'src/index.css'), 'src/index.css');
    checkFile(path.join(__dirname, 'src/components/attendance.jsx'), 'src/components/attendance.jsx');

    log('\n⚙️  Checking Configuration...', 'bold');
    checkEnv();

    log('\n🔗 Checking Backend Connection...', 'bold');
    const backendOk = await checkBackendHealth();

    // Summary
    log('\n╔═══════════════════════════════════════════════════════════╗', 'blue');
    const allPass = CHECKS.every(c => c.exists);
    const status = allPass ? '✓ ALL CHECKS PASSED' : '✗ SOME CHECKS FAILED';
    const color = allPass ? 'green' : 'red';
    log(`║  ${status.padEnd(57)}║`, color);
    log('╚═══════════════════════════════════════════════════════════╝\n', 'blue');

    if (allPass) {
        log('✅ Your application is ready to run!\n', 'green');
        log('Next steps:', 'bold');
        log('  1. Make sure backend is running:', 'yellow');
        log('     python attendance_clean.py', 'yellow');
        log('  2. Start frontend dev server:', 'yellow');
        log('     npm run dev', 'yellow');
        log('  3. Open browser to:', 'yellow');
        log('     http://localhost:5173', 'yellow');
    } else {
        log('⚠️  Please fix the issues above before running the app.\n', 'red');
        if (!backendOk) {
            log('Backend Connection Troubleshooting:', 'bold');
            log('  • Start backend: cd backend && python attendance_clean.py', 'yellow');
            log('  • Check port 5000 is not in use', 'yellow');
            log('  • Verify requirements.txt is installed', 'yellow');
        }
        const filesOk = CHECKS.filter(c => c.type === 'file').every(c => c.exists);
        if (!filesOk) {
            log('\nFile Issues:', 'bold');
            log('  • Ensure all frontend files exist', 'yellow');
            log('  • Check src/components/attendance.jsx is in place', 'yellow');
        }
    }

    log('\n' + '='.repeat(60) + '\n');
}

// Run all checks
runChecks().catch(err => {
    log(`\nError running checks: ${err.message}`, 'red');
    process.exit(1);
});
