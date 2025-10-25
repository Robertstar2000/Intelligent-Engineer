const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Get all handler files
const handlersDir = path.join(__dirname, 'src/handlers');
const handlers = fs.readdirSync(handlersDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join(handlersDir, file));

// Bundle each handler
handlers.forEach(async (handler) => {
  const name = path.basename(handler, '.ts');
  console.log(`Bundling ${name}...`);
  
  await esbuild.build({
    entryPoints: [handler],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: `dist/handlers/${name}.js`,
    external: ['aws-sdk'],
    format: 'cjs',
    sourcemap: true,
  });
});

console.log('All handlers bundled!');
