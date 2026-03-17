const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env');
let content = '';

if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, 'utf8');
}

// Clean up weird spaced formatting if it exists
if (content.includes('A D M I N _ U S E R _ I D S')) {
  // Try to recover from UTF-16 weirdness or just regex it
  content = content.replace(/[ \0]/g, ''); 
}

// Ensure it ends with a newline
if (content && !content.endsWith('\n')) content += '\n';

const segment = crypto.randomBytes(8).toString('hex');
const session = crypto.randomBytes(32).toString('hex');
const csrf = crypto.randomBytes(32).toString('hex');

const newEnvVars = [
  `ADMIN_SECRET_URL_SEGMENT=${segment}`,
  `ADMIN_SESSION_SECRET=${session}`,
  `CSRF_SECRET=${csrf}`,
  `ALLOWED_ADMIN_IPS=127.0.0.1`,
  `SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVICE_ROLE_KEY`
];

// Append only if they don't exist
newEnvVars.forEach(v => {
  const key = v.split('=')[0];
  if (!content.includes(key + '=')) {
    content += v + '\n';
  }
});

fs.writeFileSync(envPath, content);
console.log('SEGMENT=' + segment);
console.log('.env updated successfully.');
