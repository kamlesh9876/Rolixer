const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config({ path: '.env.test' });

console.log('🚀 Starting test environment setup...');

// Check if Node.js is installed
try {
  const nodeVersion = execSync('node --version').toString().trim();
  console.log(`✅ Node.js version: ${nodeVersion}`);
} catch (error) {
  console.error('❌ Node.js is not installed or not in PATH');
  process.exit(1);
}

// Check if npm is installed
try {
  const npmVersion = execSync('npm --version').toString().trim();
  console.log(`✅ npm version: ${npmVersion}`);
} catch (error) {
  console.error('❌ npm is not installed or not in PATH');
  process.exit(1);
}

// Install dependencies
console.log('\n🔧 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies');
  process.exit(1);
}

// Run database migrations
console.log('\n🔄 Running database migrations...');
try {
  execSync('npx prisma migrate dev --name test_setup', { stdio: 'inherit' });
  console.log('✅ Database migrations completed');
} catch (error) {
  console.error('❌ Failed to run database migrations');
  process.exit(1);
}

// Start the application in test mode
console.log('\n🚀 Starting the application in test mode...');
const startApp = () => {
  return exec('npm run start:test', { stdio: 'inherit' });
};

// Function to run Cypress tests
const runTests = () => {
  console.log('\n🔍 Running Cypress tests...');
  try {
    execSync('npx cypress run --browser chrome --headless', { stdio: 'inherit' });
    console.log('✅ Tests completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Tests failed');
    process.exit(1);
  }
};

// Start the application and run tests
const appProcess = startApp();

// Wait for the application to be ready
setTimeout(() => {
  runTests();
}, 10000); // Wait 10 seconds for the app to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Stopping test environment...');
  if (appProcess) {
    appProcess.kill();
  }
  process.exit(0);
});
