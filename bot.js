require('dotenv').config();
const Mastodon = require('mastodon-api');

// Authorize

const M = new Mastodon({
    client_key: process.env.CLIENT_KEY,
    client_secret: process.env.CLIENT_SECRET,
    access_token: process.env.ACCESS_TOKEN,
    timeout_ms: 60 * 1000,
    api_url: 'https://pkm.social/api/v1/',
  })

console.log('I am a bot!');