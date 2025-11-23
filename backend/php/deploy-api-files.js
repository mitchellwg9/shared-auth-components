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

// Path to TymTrackr API files (which should be the same structure as data-q.org API)
// Use absolute path since TymTrackr is a sibling directory
const tymtrackrApiPath = 'C:\\Users\\wayne\\OneDrive\\Documents\\2_MyStuff\\9_Apps\\TymTrackr\\api';

console.log('📤 Deploying updated API files to data-q.org...');
console.log(`🌐 Host: ${ftpConfig.host}`);
console.log(`👤 User: ${ftpConfig.user}`);
console.log('');

// Create temp directory with updated files
const tempDir = resolve(__dirname, 'temp-api-files');
if (!existsSync(tempDir)) {
  mkdirSync(tempDir, { recursive: true });
}

// Copy config.php from backend/php (data-q.org specific config)
const configPath = resolve(__dirname, 'config-data-q.php');
if (existsSync(configPath)) {
  const configContent = readFileSync(configPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'config.php'), configContent);
  console.log('✅ Prepared config.php (data-q.org database credentials)');
} else {
  console.error('❌ config-data-q.php not found at backend/php/config-data-q.php');
  process.exit(1);
}

// Copy utils/email.php
const emailPath = resolve(tymtrackrApiPath, 'utils/email.php');
if (existsSync(emailPath)) {
  const emailContent = readFileSync(emailPath, 'utf-8');
  const utilsDir = resolve(tempDir, 'utils');
  if (!existsSync(utilsDir)) {
    mkdirSync(utilsDir, { recursive: true });
  }
  writeFileSync(resolve(utilsDir, 'email.php'), emailContent);
  console.log('✅ Prepared utils/email.php');
} else {
  console.error('❌ utils/email.php not found');
  process.exit(1);
}

// Copy routes/auth.php
const authRoutePath = resolve(tymtrackrApiPath, 'routes/auth.php');
if (existsSync(authRoutePath)) {
  const authRouteContent = readFileSync(authRoutePath, 'utf-8');
  const routesDir = resolve(tempDir, 'routes');
  if (!existsSync(routesDir)) {
    mkdirSync(routesDir, { recursive: true });
  }
  writeFileSync(resolve(routesDir, 'auth.php'), authRouteContent);
  console.log('✅ Prepared routes/auth.php');
} else {
  console.error('❌ routes/auth.php not found');
  process.exit(1);
}

// Copy index.php (router)
const indexPath = resolve(tymtrackrApiPath, 'index.php');
if (existsSync(indexPath)) {
  const indexContent = readFileSync(indexPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'index.php'), indexContent);
  console.log('✅ Prepared index.php');
} else {
  console.error('❌ index.php not found');
  process.exit(1);
}

// Copy test-email.php
const testEmailPath = resolve(tymtrackrApiPath, 'test-email.php');
if (existsSync(testEmailPath)) {
  const testEmailContent = readFileSync(testEmailPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'test-email.php'), testEmailContent);
  console.log('✅ Prepared test-email.php');
} else {
  console.error('❌ test-email.php not found');
  process.exit(1);
}

// Copy test-smtp-config.php from backend/php
const testSmtpConfigPath = resolve(__dirname, 'test-smtp-config.php');
if (existsSync(testSmtpConfigPath)) {
  const testSmtpConfigContent = readFileSync(testSmtpConfigPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'test-smtp-config.php'), testSmtpConfigContent);
  console.log('✅ Prepared test-smtp-config.php');
}

// Copy check-email-verification.php from backend/php
const checkEmailVerificationPath = resolve(__dirname, 'check-email-verification.php');
if (existsSync(checkEmailVerificationPath)) {
  const checkEmailVerificationContent = readFileSync(checkEmailVerificationPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'check-email-verification.php'), checkEmailVerificationContent);
  console.log('✅ Prepared check-email-verification.php');
}

// Copy show-logs.php from backend/php
const showLogsPath = resolve(__dirname, 'show-logs.php');
if (existsSync(showLogsPath)) {
  const showLogsContent = readFileSync(showLogsPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'show-logs.php'), showLogsContent);
  console.log('✅ Prepared show-logs.php');
}

// Copy direct-show-logs.php from backend/php (bypasses router)
const directShowLogsPath = resolve(__dirname, 'direct-show-logs.php');
if (existsSync(directShowLogsPath)) {
  const directShowLogsContent = readFileSync(directShowLogsPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'direct-show-logs.php'), directShowLogsContent);
  console.log('✅ Prepared direct-show-logs.php');
}

// Copy test-wayne.php from backend/php (simple test endpoint)
const testWaynePath = resolve(__dirname, 'test-wayne.php');
if (existsSync(testWaynePath)) {
  const testWayneContent = readFileSync(testWaynePath, 'utf-8');
  writeFileSync(resolve(tempDir, 'test-wayne.php'), testWayneContent);
  console.log('✅ Prepared test-wayne.php');
}

// Copy debug-routing.php from backend/php
const debugRoutingPath = resolve(__dirname, 'debug-routing.php');
if (existsSync(debugRoutingPath)) {
  const debugRoutingContent = readFileSync(debugRoutingPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'debug-routing.php'), debugRoutingContent);
  console.log('✅ Prepared debug-routing.php');
}

// Copy 2FA helper and routes
const twoFactorHelperPath = resolve(__dirname, 'twoFactorHelper.php');
if (existsSync(twoFactorHelperPath)) {
  const twoFactorHelperContent = readFileSync(twoFactorHelperPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'twoFactorHelper.php'), twoFactorHelperContent);
  console.log('✅ Prepared twoFactorHelper.php');
}

const twoFactorRoutesPath = resolve(__dirname, 'twoFactorRoutes.php');
if (existsSync(twoFactorRoutesPath)) {
  const twoFactorRoutesContent = readFileSync(twoFactorRoutesPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'twoFactorRoutes.php'), twoFactorRoutesContent);
  console.log('✅ Prepared twoFactorRoutes.php');
}

// Copy ownerRoutes.php
const ownerRoutesPath = resolve(__dirname, 'ownerRoutes.php');
if (existsSync(ownerRoutesPath)) {
  const ownerRoutesContent = readFileSync(ownerRoutesPath, 'utf-8');
  writeFileSync(resolve(tempDir, 'ownerRoutes.php'), ownerRoutesContent);
  console.log('✅ Prepared ownerRoutes.php');
}

const ftp = new FtpDeploy();

// Deploy to public_html/api directory (web-accessible API location)
const config = {
  user: ftpConfig.user,
  password: ftpConfig.password,
  host: ftpConfig.host,
  port: ftpConfig.port || 21,
  localRoot: tempDir,
  remoteRoot: 'public_html/api',
        include: ['**/*', 'twoFactorHelper.php', 'twoFactorRoutes.php'],
  exclude: [],
  deleteRemote: false,
  forcePasv: true,
};

console.log('');
console.log('🔄 Uploading files to public_html/api/ directory...');

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
  .then(async () => {
    console.log('');
    console.log('✅ API files deployed successfully!');
    console.log('');
    console.log('📋 Files uploaded:');
    console.log('   - api/config.php (with SMTP settings)');
    console.log('   - api/utils/email.php (with updated verification URL)');
    console.log('');
    
    // Commit and push to Git
    console.log('📝 Committing changes to Git...');
    const { execSync } = await import('child_process');
    try {
      execSync('git add -A', { cwd: projectRoot, stdio: 'inherit' });
      const timestamp = new Date().toISOString();
      execSync(`git commit -m "Update API files: Fix SMTP authentication and routing - ${timestamp}"`, { cwd: projectRoot, stdio: 'inherit' });
      execSync('git push', { cwd: projectRoot, stdio: 'inherit' });
      console.log('✅ Changes committed and pushed to Git');
    } catch (error) {
      console.warn('⚠️  Git commit/push failed (this is OK if no changes to commit):', error.message);
    }
    
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Test by creating a new account');
    console.log('   2. Check your email inbox (and spam folder)');
    console.log('   3. Check server error logs if emails still don\'t arrive');
  })
  .catch((err) => {
    console.error('');
    console.error('❌ Deployment failed:');
    console.error(err.message || err);
    process.exit(1);
  });

