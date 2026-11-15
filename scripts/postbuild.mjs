// Stamps the build so a deploy check can tell which version is live.
import fs from 'node:fs';
fs.writeFileSync('out/version.txt', `${new Date().toISOString()}\n`);
console.log('postbuild: wrote out/version.txt');
