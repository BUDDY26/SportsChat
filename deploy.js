const fs = require('fs-extra');
const { exec } = require('child_process');
const path = require('path');

// Define paths
const frontendPath = path.join(__dirname, 'sportschat-frontend');
const backendPath = path.join(__dirname, 'sportschat-backend');
const buildPath = path.join(backendPath, 'build');

// Execute command as a Promise
function execCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} in ${cwd}`);
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) console.log(`stderr: ${stderr}`);
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function deploy() {
  try {
    // Step 1: Build the frontend
    console.log('Installing frontend dependencies...');
    await execCommand('npm install', frontendPath);
    
    console.log('Building frontend...');
    await execCommand('npm run build', frontendPath);
    
    // Step 2: Copy built files to backend/build
    console.log('Copying build files to backend...');
    await fs.ensureDir(buildPath);
    await fs.copy(
      path.join(frontendPath, 'build'), 
      buildPath
    );
    
    // Step 3: Install backend dependencies
    console.log('Installing backend dependencies...');
    await execCommand('npm install', backendPath);
    
    console.log('Deployment preparation completed successfully!');
    console.log(`The built frontend is now available in ${buildPath}`);
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

deploy();