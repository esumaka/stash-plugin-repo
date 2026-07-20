const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// ==================== CONFIG ====================
// Config format: source path -> destination folder
// .tsx files are bundled and compiled, other files/directories are copied as-is
const COPY_PATTERNS = {
  'src/main.tsx': '.',
  'src/external-player-launcher.yml': '.',
  'src/*.css': '.',
  'src/assets': '.',
};
// ================================================

const projectName = path.basename(__dirname);
const targetDir = path.resolve(__dirname, '../../plugins', projectName);

async function runBuild() {
  try {
    console.log(`🚀 [${projectName}] Starting build...`);

    // Force clean and rebuild target plugins directory
    fs.rmSync(targetDir, { recursive: true, force: true });
    fs.mkdirSync(targetDir, { recursive: true });

    // Process all configuration items
    for (const [srcPattern, destFolder] of Object.entries(COPY_PATTERNS)) {
      // Process TypeScript/JavaScript entry files
      if (srcPattern.endsWith('.tsx') || srcPattern.endsWith('.ts')) {
        const srcPath = path.join(__dirname, srcPattern);
        const fileName = path.basename(srcPattern, path.extname(srcPattern));
        const destPath = path.join(targetDir, destFolder, `${fileName}.js`);
        
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        
        await esbuild.build({
          entryPoints: [srcPath],
          bundle: true,
          outfile: destPath,
          platform: 'browser',
          format: 'cjs',
          target: ['es2022'],
        //   sourcemap: true,
        });
      } else {
        // Process other files and directories
        const matchedFiles = fs.globSync(srcPattern, { cwd: __dirname });
        
        matchedFiles.forEach(relativeFile => {
          const srcPath = path.join(__dirname, relativeFile);
          const stat = fs.statSync(srcPath);
          
          if (stat.isDirectory()) {
            // Directory: copy entire directory to target folder
            const folderName = path.basename(srcPath);
            const destPath = path.join(targetDir, destFolder, folderName);
            fs.cpSync(srcPath, destPath, { recursive: true, force: true });
          } else {
            // File: copy to target folder
            const destPath = path.join(targetDir, destFolder, path.basename(relativeFile));
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
          }
        });
      }
    }

    console.log(`✅ [${projectName}] Build successful! Output to plugins/${projectName}`);

  } catch (error) {
    console.error(`❌ [${projectName}] Build failed:`, error);
    process.exit(1);
  }
}

runBuild();