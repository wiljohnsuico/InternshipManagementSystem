const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3500,
  path: '/index.html',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  console.log(`REDIRECT LOCATION: ${res.headers.location}`);
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.end(); 