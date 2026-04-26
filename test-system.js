const Database = require('better-sqlite3');
const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000/api/v1${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('=== Database Tests ===');
  try {
    const db = new Database('campus_lost_found.db');
    const total = db.prepare('SELECT COUNT(*) as c FROM item_posts WHERE status=2').get().c;
    console.log(`✓ Posts: ${total} published posts`);
    const cats = db.prepare('SELECT COUNT(*) as c FROM item_categories').get().c;
    console.log(`✓ Categories: ${cats} items`);
    const admin = db.prepare("SELECT id FROM users WHERE openid='admin_openid'").get();
    console.log(`✓ Admin: ${admin ? 'exists' : 'MISSING'}`);
    const cfgs = db.prepare('SELECT COUNT(*) as c FROM system_configs').get().c;
    console.log(`✓ Configs: ${cfgs} items`);
    db.close();
  } catch(e) {
    console.log(`✗ DB Error: ${e.message}`);
  }

  console.log('\n=== API Tests ===');
  try {
    const posts = await get('/posts?status=2');
    console.log(`✓ Posts API: code=${posts.code}, items=${posts.data?.list?.length || 0}`);
  } catch(e) { console.log(`✗ Posts API: ${e.message}`); }

  try {
    const cats = await get('/posts/categories');
    console.log(`✓ Categories API: code=${cats.code}, items=${cats.data?.length || 0}`);
  } catch(e) { console.log(`✗ Categories API: ${e.message}`); }

  try {
    const ann = await get('/announcements');
    console.log(`✓ Announcements API: code=${ann.code}, items=${ann.data?.length || 0}`);
  } catch(e) { console.log(`✗ Announcements API: ${e.message}`); }

  console.log('\n=== Frontend Build Check ===');
  try {
    const fs = require('fs');
    const path = require('path');
    const dist = path.join(__dirname, 'dist');
    if (fs.existsSync(dist)) {
      const files = fs.readdirSync(dist).length;
      console.log(`✓ Build output: ${files} files`);
    } else {
      console.log('✗ dist folder missing - run npm run build');
    }
  } catch(e) { console.log(`✗ Build check: ${e.message}`); }

  console.log('\n=== All Tests Complete ===');
}

runTests();
