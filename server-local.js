//./server-local.js
require('dotenv').config();

//console.log('process.env: ', process.env)
var https = require('https');
var fs = require('fs');
const path = require('path');
const { parse } = require('url');
const next = require('next');
const port = parseInt(process.env.PORT) || 3002;
const dev = true;
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();
const key = process.env.LOCAL_KEY || 'certs/jonmittelbronn.dev-key.pem';
const cert = process.env.LOCAL_CERT || 'certs/jonmittelbronn.dev.pem';

console.log("🚀 ~ file: server-local.js:19 ~ process.env:", JSON.stringify(process.env, 0, 4))

options = {
  key: fs.readFileSync(
    key
  ),
  cert: fs.readFileSync(
   cert
  ),
};

app.prepare().then(() => {
  https
    .createServer(options, (req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    })
    .listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on localhost:${port}`);
    });
});
