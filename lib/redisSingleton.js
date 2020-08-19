const path = require('path');
const fs = require('fs');
const settings = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'settings.json'), { encoding: 'utf8' }));
const Redis = require('ioredis');
const redis = new Redis(settings.redisConnection);

module.exports = redis;