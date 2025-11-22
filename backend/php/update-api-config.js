import FtpDeploy from 'ftp-deploy';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

// Load FTP config from demo/ftp-config.js
let ftpConfig;
try {
  const configPath = resolve(projectRoot, 'demo/ftp-config.js');
  if (existsSync(configPath)) {
    const configModule = await import('file:///' + configPath.replace(/\\/g, '/'));
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

console.log('📤 Deploying config.php to data-q.org API...');
console.log(`🌐 Host: ${ftpConfig.host}`);
console.log(`👤 User: ${ftpConfig.user}`);
console.log('');

// Create a temporary directory with just the config file
const tempDir = resolve(__dirname, 'temp-config');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}
const configContent = readFileSync(configPhpPath, 'utf-8');
writeFileSync(resolve(tempDir, 'config.php'), configContent);

const ftp = new FtpDeploy();

// Try different possible API paths - the API is likely at public_html/api
const possiblePaths = [
  'public_html/api',
  'api',
  'public_html',
  '.'
];

let deployed = false;

for (const remotePath of possiblePaths) {
  try {
    const config = {
      user: ftpConfig.user,
      password: ftpConfig.password,
      host: ftpConfig.host,
      port: ftpConfig.port || 21,
      localRoot: tempDir,
      remoteRoot: remotePath,
      include: ['config.php'],
      exclude: [],
      deleteRemote: false,
      forcePasv: true,
    };

    console.log(`🔄 Trying remote path: ${remotePath}...`);

    await new Promise((resolve, reject) => {
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
          deployed = true;
          resolve();
        })
        .catch((err) => {
          // Try next path
          reject(err);
        });
    });

    console.log('');
    console.log(`✅ Config file uploaded successfully to: ${remotePath}/config.php`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Verify the file exists at the API location');
    console.log('   2. Test email sending by creating a new account');
    console.log('   3. Check error logs if emails still don\'t arrive');
    break;
  } catch (err) {
    // Continue to next path
    console.log(`   ⚠️  Failed: ${err.message}`);
    continue;
  }
}

if (!deployed) {
  console.error('');
  console.error('❌ Failed to deploy config.php to any of the attempted paths.');
  console.error('');
  console.error('💡 The config.php file is ready at: backend/php/config.php');
  console.error('   You may need to manually upload it to your API directory via FTP.');
  console.error('   The API is likely at: public_html/api/config.php');
  process.exit(1);
}

