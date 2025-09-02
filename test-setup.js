const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function setupTestEnvironment() {
  console.log('🚀 Setting up test environment...');
  
  try {
    // Install dependencies
    console.log('📦 Installing dependencies...');
    await execAsync('npm install');
    
    // Set up test database
    console.log('💾 Setting up test database...');
    await execAsync('npx prisma migrate deploy');
    
    // Start the backend server
    console.log('⚡ Starting backend server...');
    const backendProcess = exec('npm run start:test');
    
    // Wait for server to start (adjust time as needed)
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run Cypress tests
    console.log('🔍 Running Cypress tests...');
    const { stdout, stderr } = await execAsync('npx cypress run --headless');
    console.log(stdout);
    
    // Clean up
    console.log('🧹 Cleaning up...');
    backendProcess.kill();
    process.exit(0);
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

setupTestEnvironment();
