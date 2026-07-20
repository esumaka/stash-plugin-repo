const fs = require('fs');
const path = require('path');

// =================== CONFIG ===================
const pluginsDir = 'D:/Stash/plugins';
// ==============================================

const projectName = path.basename(__dirname);
const destDir = path.join(pluginsDir, projectName);
const srcDir = path.resolve(__dirname, '../../plugins', projectName);

try {
    if (!fs.existsSync(pluginsDir)) {
        console.error('❌ Destination base directory does not exist: ' + pluginsDir);
        console.error('   Please check the `pluginsDir` configuration.');
        process.exit(1);
    }

    if (fs.existsSync(destDir)) {
        fs.rmSync(destDir, { recursive: true, force: true });
        console.log('✅ Successfully deleted old project folder: ' + destDir);
    }

    fs.cpSync(srcDir, destDir, { recursive: true });
    console.log('✅ Deploy successful! New files moved to: ' + destDir);

} catch (err) {
    console.error('❌ Deploy failed, error:', err.message);
    process.exit(1);
}