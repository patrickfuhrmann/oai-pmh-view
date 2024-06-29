const https = require('https');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const morgan = require('morgan');

const app = express();

app.use((req, res, next) => {
  console.log(`--> ${req.method} ${req.url}`);
  next();
});
app.use(morgan('combined')); // or 'tiny', 'short', 'dev' for different logging formats


const WEB_PORT      = process.env.WEB_PORT   ? process.env.WEB_PORT   : 8300
const OAI_HOST      = process.env.OAI_HOST   ? process.env.OAI_HOST   : 'localhost';
const OAI_PORT      = process.env.OAI_PORT   ? process.env.OAI_PORT   : 3000 ; 
const OAI_PREFIX    = process.env.OAI_PREFIX ? process.env.OAI_PREFIX : '/scicat/oai' ;

let identifierURL = `http://${OAI_HOST}:${OAI_PORT}${OAI_PREFIX}`

if( process.argv.length < 4 ){
   console.log("Usage : ... <serverName> <prefix>")
   process.exit(1) 
}

identifierURL = process.argv[2] ;
prefixURL     = process.argv[3] ;

// Proxy configuration
// app.use('/api/identifiers', createProxyMiddleware({ target: identifierURL , changeOrigin: true }));


const proxyConfig = {
  target: identifierURL , // target server URL (can be HTTPS)
  changeOrigin: true,     // needed for virtual hosted sites
  secure: true,          // if you want to ignore self-signed SSL certificates
  logger: console ,
  logLevel: 'debug',      // optional: to help with debugging
  onProxyReq: (proxyReq, req, res) => {
    const fullUrl = `${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`;
    console.log(`Proxying request from ${req.originalUrl} to ${fullUrl}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    const targetUrl = `${proxyRes.req.protocol}//${proxyRes.req.host}${proxyRes.req.path}`;
    console.log(`Proxied request from ${req.originalUrl} to ${targetUrl}`);
  },
  pathRewrite: {
    '^/': prefixURL, // rewrite the path
  },
//  agent: new https.Agent({
//    secureProtocol: 'TLSv1_2_method', // force TLS 1.2
//  }),
};

app.use('/api/identifiers', createProxyMiddleware( proxyConfig ));

// Serve static files
app.use(express.static('public'));

app.listen(WEB_PORT, () => {
    console.log(`Server running at http://localhost:${WEB_PORT}`);
    console.log(`Server connecting to ${identifierURL} ${prefixURL}`);
});

