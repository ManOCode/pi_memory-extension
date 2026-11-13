import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distPath = path.join(rootDir, 'dist');
const extensionsPath = path.join(rootDir, '.pi', 'extensions');
const linkPath = path.join(extensionsPath, 'memory-extension');

try {
  if (!fs.existsSync(extensionsPath)) {
    console.log(`Creating directory: ${extensionsPath}`);
    fs.mkdirSync(extensionsPath, { recursive: true });
  }

  if (fs.existsSync(linkPath)) {
    console.log(`Removing existing link/file: ${linkPath}`);
    // On Windows, symlinks to directories might need different handling or just unlink
    fs.unlinkSync(linkPath);
  }

  console.log(`Linking ${distPath} -> ${linkPath}`);
  // Use 'junction' on Windows for directories to avoid needing admin privileges
  fs.symlinkSync(distPath, linkPath, 'junction');
  console.log('Successfully linked extension.');
} catch (err) {
  console.error('Error linking extension:', err);
  process.exit(1);
}
