import FtpDeploy from 'ftp-deploy';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Try to load FTP config from file, or use environment variables
let ftpConfig;
try {
  if (existsSync(resolve(__dirname, 'ftp-config.js'))) {
    const configModule = await import('./ftp-config.js');
    ftpConfig = configModule.ftpConfig;
  } else {
    // Use environment variables as fallback
    ftpConfig = {
      user: process.env.FTP_USER || process.env.FTP_USERNAME,
      password: process.env.FTP_PASSWORD,
      host: process.env.FTP_HOST || 'ftp.data-q.org',
      port: parseInt(process.env.FTP_PORT || '21'),
      remoteRoot: process.env.FTP_REMOTE_ROOT || 'app/demo',
      include: ["*", "**/*", ".htaccess", ".htaccess"],
      exclude: [".git", ".gitignore", "node_modules", ".DS_Store"],
      deleteRemote: false,
      forcePasv: true,
    };
  }
} catch (error) {
  console.error('Failed to load FTP config:', error.message);
  process.exit(1);
}

const ftp = new FtpDeploy();

// Build the demo
console.log('🔨 Building demo for production...');
try {
  execSync('npm run demo:build', { 
    encoding: 'utf-8', 
    cwd: projectRoot, 
    stdio: 'inherit' 
  });
  console.log('✅ Demo build completed!\n');
} catch (buildError) {
  console.error('❌ Build failed:');
  console.error(buildError.message || buildError);
  process.exit(1);
}

// Validate FTP config
if (!ftpConfig.user || !ftpConfig.password || ftpConfig.user.includes('your-ftp')) {
  console.error('❌ FTP credentials not configured!');
  console.error('Please set FTP_USER and FTP_PASSWORD environment variables, or create demo/ftp-config.js');
  console.error('');
  console.error('To set environment variables:');
  console.error('  Windows PowerShell: $env:FTP_USER="username"; $env:FTP_PASSWORD="password"');
  console.error('  Windows CMD: set FTP_USER=username && set FTP_PASSWORD=password');
  console.error('  Linux/Mac: export FTP_USER=username && export FTP_PASSWORD=password');
  process.exit(1);
}

const config = {
  ...ftpConfig,
  localRoot: resolve(__dirname, 'dist'),
  remoteRoot: ftpConfig.remoteRoot,
};

console.log('🚀 Starting FTP deployment to data-q.org...');
console.log(`📁 Local: ${config.localRoot}`);
console.log(`🌐 Remote: ${config.remoteRoot} on ${config.host}`);
console.log(`👤 User: ${config.user}`);
console.log('');

// Debug: List files that will be uploaded
try {
  const files = readdirSync(config.localRoot, { recursive: true });
  console.log('📋 Files to upload:');
  files.forEach(file => {
    const fullPath = join(config.localRoot, file);
    const stats = statSync(fullPath);
    if (stats.isFile()) {
      console.log(`   - ${file} (${stats.size} bytes)`);
      // Show first few lines of index.html for debugging
      if (file === 'index.html') {
        const content = readFileSync(fullPath, 'utf-8');
        const preview = content.substring(0, 200).replace(/\n/g, ' ');
        console.log(`     Preview: ${preview}...`);
      }
    }
  });
  console.log('');
} catch (err) {
  console.log(`⚠️  Could not list files: ${err.message}`);
  console.log('');
}

ftp
  .on('uploading', (data) => {
    console.log(`📤 Uploading: ${data.filename} (${data.totalFiles} total files)`);
  })
  .on('uploaded', (data) => {
    console.log(`✅ Uploaded: ${data.filename}`);
  })
  .on('log', (data) => {
    console.log(`ℹ️  [FTP] ${data.type}: ${data.message}`);
  })
  .deploy(config)
  .then((res) => {
    console.log('');
    console.log('✅ FTP deployment completed successfully!');
    console.log(`📊 Total files processed: ${res.length}`);
    console.log(`📁 Files uploaded:`);
    res.forEach(file => {
      console.log(`   - ${file}`);
    });
    console.log('');
    console.log('🔍 FTP Connection Details:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   User: ${config.user}`);
    console.log(`   Remote Root: ${config.remoteRoot}`);
    console.log(`   Local Root: ${config.localRoot}`);
    console.log('');
    console.log(`🌐 Your demo should be live at: https://data-q.org/app/demo/`);
    console.log(`🔍 Verify in file manager: Look for folder "${config.remoteRoot}" on ${config.host}`);
    console.log(`🔍 Files should be at: ${config.remoteRoot}/index.html`);
    console.log('');
    console.log('⚠️  If files are not visible in file manager:');
    console.log('   1. Check if the remote path is correct');
    console.log('   2. Try changing remoteRoot to just "demo" or "public_html/app/demo"');
    console.log('   3. Verify FTP user has write permissions to that directory');
    console.log('');
    
    // Deploy to GitHub
    console.log('📦 Deploying to GitHub...');
    try {
      // Check if there are any changes to commit
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf-8', cwd: projectRoot });
      
      if (gitStatus.trim()) {
        // Stage all changes
        console.log('📝 Staging changes...');
        execSync('git add .', { encoding: 'utf-8', cwd: projectRoot, stdio: 'inherit' });
        
        // Create commit message with timestamp
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const commitMessage = `Deploy demo: ${timestamp} - Auto-deployment to data-q.org/app/demo/`;
        
        // Commit changes
        console.log('💾 Committing changes...');
        execSync(`git commit -m "${commitMessage}"`, { encoding: 'utf-8', cwd: projectRoot, stdio: 'inherit' });
        
        // Push to GitHub
        console.log('🚀 Pushing to GitHub...');
        execSync('git push', { encoding: 'utf-8', cwd: projectRoot, stdio: 'inherit' });
        
        console.log('');
        console.log('✅ GitHub deployment completed successfully!');
      } else {
        console.log('ℹ️  No changes to commit. Repository is up to date.');
      }
    } catch (gitError) {
      console.error('');
      console.error('⚠️  GitHub deployment failed (FTP deployment was successful):');
      console.error(gitError.message || gitError);
      console.error('');
      console.error('💡 You can manually push changes with:');
      console.error('   git add .');
      console.error('   git commit -m "Your message"');
      console.error('   git push');
    }
    
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Visit https://data-q.org/app/demo/ to verify');
    console.log('   2. Test authentication features');
    console.log('   3. Check browser console for any errors');
  })
  .catch((err) => {
    console.error('');
    console.error('❌ Deployment failed:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  });
