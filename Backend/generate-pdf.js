const markdownpdf = require('markdown-pdf');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'documentation', 'BACKEND_DEVELOPMENT_PLAN.md');
const outputPath = path.join(__dirname, 'documentation', 'BACKEND_DEVELOPMENT_PLAN.pdf');

console.log('Converting Markdown to PDF...');
console.log('Input:', inputPath);
console.log('Output:', outputPath);

markdownpdf()
  .from(inputPath)
  .to(outputPath, function () {
    console.log('✅ PDF generated successfully!');
    console.log('📄 File location:', outputPath);
  });
