/**
 * Rollback Script for Firebase Deployments
 *
 * This script is used to rollback Firebase hosting and functions deployments
 * to a previous version.
 *
 * Usage:
 *   node rollback.js <version> [target]
 *
 * Example:
 *   node rollback.js v2023.05.10-1234 production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const version = process.argv[2];
const target = process.argv[3] || 'production';

if (!version) {
  console.error('Error: Version must be specified');
  console.log('Usage: node rollback.js <version> [target]');
  process.exit(1);
}

// Log directory for deployments
const logDir = path.join(__dirname, '../../deployment-logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// File to track last successful deployment
const deploymentLogFile = path.join(logDir, `${target}-deployments.json`);

// Log file for this rollback
const rollbackLogFile = path.join(logDir, `rollback-${version}-${new Date().toISOString().replace(/:/g, '-')}.log`);

// Get deployment history
let deploymentHistory = [];
if (fs.existsSync(deploymentLogFile)) {
  try {
    deploymentHistory = JSON.parse(fs.readFileSync(deploymentLogFile, 'utf8'));
  } catch (error) {
    console.error('Error reading deployment history:', error);
    process.exit(1);
  }
}

// Find the specified version
const deploymentEntry = deploymentHistory.find(entry => entry.version === version);

if (!deploymentEntry) {
  console.error(`Error: Version ${version} not found in deployment history`);
  console.log('Available versions:');
  deploymentHistory.forEach(entry => {
    console.log(`  ${entry.version} - ${entry.timestamp}`);
  });
  process.exit(1);
}

console.log(`Rolling back to version ${version} (${deploymentEntry.timestamp}) for target ${target}`);

// Log start of rollback
fs.writeFileSync(
  rollbackLogFile,
  `Rollback to version ${version} (${deploymentEntry.timestamp}) for target ${target}\n`,
  { flag: 'a' }
);

try {
  // Rollback Firebase Hosting
  console.log('Rolling back Firebase Hosting...');
  const hostingRollbackOutput = execSync(
    `firebase hosting:clone ${deploymentEntry.hostingVersionId} ${target} --project db888-67827`,
    { encoding: 'utf8' }
  );
  console.log(hostingRollbackOutput);
  
  fs.writeFileSync(
    rollbackLogFile,
    `\n--- Hosting Rollback ---\n${hostingRollbackOutput}\n`,
    { flag: 'a' }
  );
  
  // Rollback Firebase Functions
  console.log('Rolling back Firebase Functions...');
  const functionsRollbackOutput = execSync(
    `firebase functions:rollback ${deploymentEntry.functionsVersionId} --project db888-67827 --force`,
    { encoding: 'utf8' }
  );
  console.log(functionsRollbackOutput);
  
  fs.writeFileSync(
    rollbackLogFile,
    `\n--- Functions Rollback ---\n${functionsRollbackOutput}\n`,
    { flag: 'a' }
  );
  
  console.log(`Successfully rolled back to version ${version}`);
  
  // Add to deployment history
  const rollbackEntry = {
    version: `rollback-to-${version}`,
    timestamp: new Date().toISOString(),
    hostingVersionId: deploymentEntry.hostingVersionId,
    functionsVersionId: deploymentEntry.functionsVersionId,
    isRollback: true,
    rolledBackTo: version,
  };
  
  deploymentHistory.unshift(rollbackEntry);
  
  // Save updated deployment history
  fs.writeFileSync(deploymentLogFile, JSON.stringify(deploymentHistory, null, 2));
  
  fs.writeFileSync(
    rollbackLogFile,
    `\n--- Success ---\nSuccessfully rolled back to version ${version}`,
    { flag: 'a' }
  );
} catch (error) {
  console.error('Error during rollback:', error.message);
  
  fs.writeFileSync(
    rollbackLogFile,
    `\n--- Error ---\n${error.message}\n${error.stack}`,
    { flag: 'a' }
  );
  
  process.exit(1);
}
