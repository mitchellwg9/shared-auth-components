# Demo Deployment Guide

This guide explains how to deploy the demo application to `https://data-q.org/app/demo/` and push changes to GitHub.

## Initial Setup

1. **Configure FTP credentials:**
   - Copy `ftp-config.example.js` to `ftp-config.js`
   - Edit `ftp-config.js` and fill in your FTP credentials:
     ```javascript
     user: "your-ftp-username@data-q.org",
     password: "your-ftp-password",
     host: "ftp.data-q.org",
     ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Deployment

To deploy the demo to both the website and GitHub:

```bash
npm run deploy
```

This command will:
1. ✅ Build the demo for production (`npm run demo:build`)
2. ✅ Upload files to `https://data-q.org/app/demo/` via FTP
3. ✅ Commit all changes to Git
4. ✅ Push to GitHub repository: `https://github.com/mitchellwg9/shared-auth-components`

## Manual Steps

If you prefer to deploy manually:

### Build Only
```bash
npm run demo:build
```

### FTP Upload Only
After building, manually upload the contents of `demo/dist/` to your FTP server at `app/demo/`

### Git Only
```bash
git add .
git commit -m "Your commit message"
git push
```

## Troubleshooting

- **FTP connection fails**: Check your credentials in `demo/ftp-config.js`
- **Git push fails**: Ensure you have push access to `https://github.com/mitchellwg9/shared-auth-components`
- **Build fails**: Make sure all dependencies are installed with `npm install`

## Security Note

The `demo/ftp-config.js` file is in `.gitignore` and will not be committed to GitHub. Keep your FTP credentials secure!

