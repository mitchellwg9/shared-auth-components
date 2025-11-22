import FtpDeploy from 'ftp-deploy';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Load FTP config
let ftpConfig;
try {
  const configPath = resolve(projectRoot, 'demo/ftp-config.js');
  if (existsSync(configPath)) {
    const configModule = await import('file:///' + configPath.replace(/\\/g, '/'));
    ftpConfig = configModule.ftpConfig;
  } else {
    console.error('❌ FTP config not found');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to load FTP config:', error.message);
  process.exit(1);
}

// Read the test-email.php file
const testEmailPath = resolve(__dirname, 'test-email.php');
if (!existsSync(testEmailPath)) {
  console.error('❌ test-email.php not found');
  process.exit(1);
}

// Create temp directory
const tempDir = resolve(__dirname, 'temp-test');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

const testContent = readFileSync(testEmailPath, 'utf-8');
writeFileSync(resolve(tempDir, 'test-email.php'), testContent);

console.log('📤 Deploying test-email.php to data-q.org API...');
console.log(`🌐 Host: ${ftpConfig.host}`);
console.log(`👤 User: ${ftpConfig.user}`);
console.log('');

const ftp = new FtpDeploy();

const config = {
  user: ftpConfig.user,
  password: ftpConfig.password,
  host: ftpConfig.host,
  port: ftpConfig.port || 21,
  localRoot: tempDir,
  remoteRoot: 'api',
  include: ['test-email.php'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
};

ftp
  .on('uploading', (data) => {
    console.log(`   📤 Uploading: ${data.filename}`);
  })
  .on('uploaded', (data) => {
    console.log(`   ✅ Uploaded: ${data.filename}`);
  })
  .on('log', (data) => {
    // Suppress verbose logs
  })
  .deploy(config)
  .then(() => {
    console.log('');
    console.log('✅ Test file deployed successfully!');
    console.log('');
    console.log('🧪 Test your email configuration:');
    console.log('   Visit: https://data-q.org/api/test-email.php');
    console.log('');
    console.log('   You can:');
    console.log('   1. View current SMTP configuration');
    console.log('   2. Test SMTP connection');
    console.log('   3. Send a test verification email');
  })
  .catch((err) => {
    console.error('');
    console.error('❌ Deployment failed:');
    console.error(err.message || err);
    process.exit(1);
  });

