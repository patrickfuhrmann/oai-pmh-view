const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

const WEB_PORT      = process.env.WEB_PORT   ? process.env.WEB_PORT   : 8300
const OAI_HOST      = process.env.OAI_HOST   ? process.env.OAI_HOST   : 'localhost';
const OAI_PORT      = process.env.OAI_PORT   ? process.env.OAI_PORT   : 3000 ; 
const OAI_PREFIX    = process.env.OAI_PREFIX ? process.env.OAI_PREFIX : '/scicat/oai' ;

const identifierURL = `http://${OAI_HOST}:${OAI_PORT}${OAI_PREFIX}`

// Proxy configuration
app.use('/api/identifiers', createProxyMiddleware({ target: identifierURL , changeOrigin: true }));

// Serve static files
app.use(express.static('public'));

app.listen(WEB_PORT, () => {
    console.log(`Server running at http://localhost:${WEB_PORT}`);
    console.log(`Server connecting to ${identifierURL}`);
});

