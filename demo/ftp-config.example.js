// FTP Configuration for data-q.org demo deployment
// Copy this file to ftp-config.js and fill in your credentials
// ftp-config.js is in .gitignore and will not be committed

export const ftpConfig = {
  user: "your-ftp-username@data-q.org",
  password: "your-ftp-password",
  host: "ftp.data-q.org",
  port: 21,
  localRoot: "./demo/dist",
  // Remote path to /app/demo/ directory
  remoteRoot: "app/demo",
  include: ["*", "**/*", ".htaccess"],
  exclude: [".git", ".gitignore", "node_modules", ".DS_Store"],
  deleteRemote: false,
  forcePasv: true,
};

