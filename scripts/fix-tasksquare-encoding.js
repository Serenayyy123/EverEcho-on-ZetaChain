const fs = require('fs');
const path = require('path');

console.log('Fixing TaskSquare 3D files encoding...');

const files = [
  'frontend/src/components/tasksquare/TaskCard3D.tsx',
  'frontend/src/components/tasksquare/TaskCarousel3D.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  
  // Read file content
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    console.log(`✅ Removed BOM from ${file}`);
  }
  
  // Write back with clean UTF-8
  fs.writeFileSync(fullPath, content, { encoding: 'utf8' });
  console.log(`✅ Fixed ${file}`);
});

console.log('✅ All files fixed!');
