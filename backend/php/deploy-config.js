import FtpDeploy from 'ftp-deploy';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Try to load FTP config from demo/ftp-config.js
let ftpConfig;
try {
  const configPath = resolve(projectRoot, 'demo/ftp-config.js');
  if (existsSync(configPath)) {
    const configModule = await import(configPath);
    ftpConfig = configModule.ftpConfig;
  } else {
    console.error('❌ FTP config not found at demo/ftp-config.js');
    process.exit(1);
  }
} catch (error) {
  console.error('Failed to load FTP config:', error.message);
  process.exit(1);
}

// Read the config.php file
const configPhpPath = resolve(__dirname, 'config.php');
if (!existsSync(configPhpPath)) {
  console.error('❌ config.php not found at backend/php/config.php');
  console.error('Please create it first by copying config.example.php');
  process.exit(1);
}

const configContent = readFileSync(configPhpPath, 'utf-8');

console.log('📤 Uploading config.php to API directory...');
console.log(`🌐 Host: ${ftpConfig.host}`);
console.log(`📁 Remote: api/config.php`);
console.log('');

// Create a temporary file with the config content
const tempConfigPath = resolve(__dirname, 'config.php.tmp');
writeFileSync(tempConfigPath, configContent);

const ftp = new FtpDeploy();

const config = {
  user: ftpConfig.user,
  password: ftpConfig.password,
  host: ftpConfig.host,
  port: ftpConfig.port || 21,
  localRoot: __dirname,
  remoteRoot: 'api', // Upload to api/ directory on server
  include: ['config.php.tmp'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
};

ftp
  .on('uploading', (data) => {
    console.log(`📤 Uploading: ${data.filename}`);
  })
  .on('uploaded', (data) => {
    console.log(`✅ Uploaded: ${data.filename}`);
  })
  .on('log', (data) => {
    if (data.type === 'log') {
      console.log(`ℹ️  ${data.message}`);
    }
  })
  .deploy(config)
  .then((res) => {
    console.log('');
    console.log('✅ Config file uploaded successfully!');
    console.log('');
    console.log('⚠️  Note: The file was uploaded as config.php.tmp');
    console.log('   You may need to rename it to config.php on the server');
    console.log('   or update the remoteRoot/remote path in this script.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Check if config.php exists at: https://data-q.org/api/config.php');
    console.log('   2. Verify SMTP settings are correct');
    console.log('   3. Test email sending');
  })
  .catch((err) => {
    console.error('');
    console.error('❌ Upload failed:');
    console.error(err.message || err);
    process.exit(1);
  });

