/**
 * Deployment Logger for Firebase Deployments
 *
 * This script logs deployment information to a file for tracking purposes.
 * It is intended to be run after a successful deployment.
 *
 * Usage:
 *   node log-deployment.js <target> <hosting-version-id> <functions-version-id>
 *
 * Example:
 *   node log-deployment.js production 123456789 987654321
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const target = process.argv[2];
const hostingVersionId = process.argv[3];
const functionsVersionId = process.argv[4];

if (!target || !hostingVersionId || !functionsVersionId) {
  console.error('Error: target, hostingVersionId, and functionsVersionId must be specified');
  console.log('Usage: node log-deployment.js <target> <hosting-version-id> <functions-version-id>');
  process.exit(1);
}

// Log directory for deployments
const logDir = path.join(__dirname, '../../deployment-logs');

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// File to track deployments
const deploymentLogFile = path.join(logDir, `${target}-deployments.json`);

// Generate version tag
const generateVersionTag = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  return `v${year}.${month}.${day}-${hours}${minutes}`;
};

// Get deployment history
let deploymentHistory = [];
if (fs.existsSync(deploymentLogFile)) {
  try {
    deploymentHistory = JSON.parse(fs.readFileSync(deploymentLogFile, 'utf8'));
  } catch (error) {
    console.error('Error reading deployment history:', error);
    // Continue with empty history
    deploymentHistory = [];
  }
}

// Create new deployment entry
const deploymentEntry = {
  version: generateVersionTag(),
  timestamp: new Date().toISOString(),
  target,
  hostingVersionId,
  functionsVersionId,
  gitCommit: process.env.GITHUB_SHA || 'unknown',
  gitRef: process.env.GITHUB_REF || 'unknown',
  deployedBy: process.env.GITHUB_ACTOR || 'unknown',
};

// Add to deployment history (at the beginning)
deploymentHistory.unshift(deploymentEntry);

// Keep only the last 20 entries
if (deploymentHistory.length > 20) {
  deploymentHistory = deploymentHistory.slice(0, 20);
}

// Save updated deployment history
fs.writeFileSync(deploymentLogFile, JSON.stringify(deploymentHistory, null, 2));

console.log(`Deployment logged successfully: ${deploymentEntry.version} (${target})`);
