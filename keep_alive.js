const https = require('https');

// The live Backend URL
const SERVER_URL = 'https://swapsafe-backend.onrender.com/api/health';
const INTERVAL_MINUTES = 14;

console.log(`❤️  Heartbeat Monitor Started`);
console.log(`🎯 Target: ${SERVER_URL}`);
console.log(`⏱️  Interval: Every ${INTERVAL_MINUTES} minutes`);

function ping() {
    console.log(`[${new Date().toLocaleTimeString()}] Pinging server...`);

    https.get(SERVER_URL, (res) => {
        console.log(`   ✅ Status: ${res.statusCode} ${res.statusMessage}`);
    }).on('error', (e) => {
        console.error(`   ❌ Error: ${e.message}`);
    });
}

// Initial ping
ping();

// Ping every 14 minutes (render sleeps after 15)
setInterval(ping, INTERVAL_MINUTES * 60 * 1000);
