#!/usr/bin/env node

const semver = require('semver');
const currentVersion = process.version;
const requiredVersion = '18.0.0';

console.log('🔍 Checking Node.js version compatibility...\n');
console.log(`Current Node.js version: ${currentVersion}`);
console.log(`Required Node.js version: >=${requiredVersion}`);

if (semver.gte(currentVersion, requiredVersion)) {
  console.log('✅ Node.js version is compatible!');
  process.exit(0);
} else {
  console.log('❌ Node.js version is incompatible!');
  console.log('\n🚨 COMPATIBILITY ISSUES:');
  console.log('- Jest v30 requires Node.js ≥18');
  console.log('- Many security packages require Node.js ≥16');
  console.log('- Frontend vulnerabilities persist with old Node.js');
  
  console.log('\n📋 UPGRADE INSTRUCTIONS:');
  console.log('1. Install Node.js 18+ from https://nodejs.org/');
  console.log('2. Or use nvm: nvm install 18 && nvm use 18');
  console.log('3. Or use Docker containers with Node.js 18+');
  
  console.log('\n🐳 DOCKER ALTERNATIVE:');
  console.log('Use Docker containers for development:');
  console.log('  docker-compose --profile dev up');
  
  process.exit(1);
}