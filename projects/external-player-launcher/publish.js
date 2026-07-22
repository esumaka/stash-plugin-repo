const fs = require('fs');
const path = require('path');

const projectName = path.basename(__dirname);
const destDir = path.resolve(__dirname, '../../plugins', projectName);
const srcDir = path.resolve(__dirname, 'dist');

try {
    if (!fs.existsSync(srcDir)) {
        console.error('❌ Source directory does not exist: ' + srcDir);
        console.error('   Please run the build first to generate the dist folder.');
        process.exit(1);
    }

    // Force clean and rebuild target plugins directory
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.mkdirSync(destDir, { recursive: true });

    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('✅ Publish successful! New files moved to: ' + destDir);

} catch (err) {
    console.error('❌ Publish failed, error:', err.message);
    process.exit(1);
}