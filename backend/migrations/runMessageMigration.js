// Simple script to run the message migration
import { execSync } from 'child_process';

console.log('Running message migration...');
try {
  execSync('node messageMigration.js', { stdio: 'inherit' });
  console.log('Message migration completed successfully!');
} catch (error) {
  console.error('Error running message migration:', error);
} 