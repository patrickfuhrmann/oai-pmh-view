const https   = require('https');
const http    = require('http');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path   = require('path');
const morgan = require('morgan');
const fs     = require('fs');

// Paths to your SSL certificate files
// 
const defaultCertPath = '/etc/letsencrypt/live/zam12168.zam.kfa-juelich.de/fullchain.pem';
const defaultKeyPath  = '/etc/letsencrypt/live/zam12168.zam.kfa-juelich.de/privkey.pem';
//
const WEB_PORT   = process.env.WEB_PORT   ? process.env.WEB_PORT   : 80
const HTTPS_PORT = process.env.HTTPS_PORT ? process.env.HTTPS_PORT : 443;
const SITES_CONF = process.env.SITES_CONF ? process.env.SITES_CONF : 'view.json'
const CERT_PATH  = process.env.CERT_PATH  ? process.env.CERT_PATH  : defaultCertPath ;
const KEY_PATH   = process.env.KEY_PATH   ? process.env.KEY_PATH   : defaultKeyPath ;
const doRedirect = process.env.SECURE     ? ( process.env.SECURE == 'true'  ) : false ;
const HTTPS_REDIRECT = process.env.HTTPS_REDIRECT ?  process.env.HTTPS_REDIRECT : 'none' ;

const certPath = CERT_PATH ;
const keyPath  = KEY_PATH

var configs   = [] ;
var endpoints = [] ;

const app = express();
var httpsServer ;

if( doRedirect )runSimpleHttpRedirect() ;
//
//  ---------   read the command file -------------
//
//-----------------------------------------------
function getConfigFromFile( filePath ){
//-----------------------------------------------

  const data     = fs.readFileSync(filePath, 'utf8');
  const jsonData = JSON.parse(data);
  console.log('JSON data:', jsonData);
  return jsonData ;

}
//
//  ---------   read the command line -------------
//
//-----------------------------------------------
function getConfigFromArgs() {
//-----------------------------------------------

   const args = process.argv.slice(2);

   const resultArray = [];

   args.forEach(args => {

     const [key, server, prefix , description] = args.split('#');
  
     const dictionary = {
       key: key,
       server: server,
       prefix: prefix,
       description: description 	
     };

     resultArray.push(dictionary);

   });
   return resultArray ;
}
//
//-----------------------------------------------
function runSimpleHttpRedirect() {
//-----------------------------------------------
   const httpApp = express();

   httpApp.use((req, res, next) => {
      if (req.secure) {
          next(); // Request is already secure, proceed normally
      } else {
          res.redirect(
            HTTPS_REDIRECT == 'none' ?
            `https://${req.headers.host}${req.url}` :
            HTTPS_REDIRECT
         );
      }
   });

   const httpServer = http.createServer(httpApp);

   httpServer.listen(WEB_PORT, () => {
      console.log(`Server running at http://localhost:${WEB_PORT}`);
   });
}
//-----------------------------------------------
const getEndpointHandler = (req, res) => {
//-----------------------------------------------
  res.json(endpoints);
};
// ------------------------------------------------
function initRoutes( resultArray ) {
// ------------------------------------------------

   app.use((req, res, next) => {
     console.log(`--> ${req.method} ${req.url}`);
     next();
   });

   app.use(express.json());

   app.use(morgan('combined')); // or 'tiny', 'short', 'dev' for different logging formats

   resultArray.forEach( ex => {     

      const proxyConfig = {
        target: ex.server ,     // target server URL (can be HTTPS)
        changeOrigin: true,     // needed for virtual hosted sites
        secure: true,           // if you want to ignore self-signed SSL certificates
        logger: console ,
        logLevel: 'debug',      // optional: to help with debugging
        pathRewrite: { '^/': ex.prefix,  },
      };
      ex.proxy = proxyConfig;
      console.log(`Registering : /api/${ex.key}`);
      app.use(`/api/${ex.key}`, createProxyMiddleware( proxyConfig ));

   });

   if( resultArray.length > 0 )app.use('/api/identifiers', createProxyMiddleware( resultArray[0].proxy ));

   app.use(express.static('public'));

   app.get('/endpoints', getEndpointHandler);

   app.get('/reboot', (req, res) => {
       console.log("Rebooting in one second")
       setTimeout(
          () => { 
             console.log("Rebooting now")
             httpsServer.close()
             setTimeout( andGo , 10000 )
          } , 
          1000
       )
       res.json(endpoints);
   });

   app.put('/update-endpoints', (req, res) => {
     const data = req.body;
     console.log('Received data:', data);
     res.status(200).json({ message: 'Data received successfully', receivedData: data });
     configs = data ;
     endpoints = JSON.parse(JSON.stringify(configs));
   });

}

// ------------------------------------------------
function andGo(){
// ------------------------------------------------
   console.log("Starting: andGo!");
   //
   try{
      configs = getConfigFromFile( SITES_CONF )
   }catch( error ){
      configs = []
   }
   endpoints = JSON.parse(JSON.stringify(configs));

   const options =
       doRedirect ?
      {
             cert: fs.readFileSync(certPath),
             key:  fs.readFileSync(keyPath)
           } : {} ;

   httpsServer = https.createServer(options, app);

   initRoutes( configs );
   //
   // Start the HTTPS server
   //  
   httpsServer.listen(HTTPS_PORT, () => {
       console.log(`HTTPS Server running on port ${HTTPS_PORT}`);
       configs.forEach( ex => {
         console.log(`Server connecting to ${ex.key} ${ex.server} ${ex.prefix}`);
      })
   });
}

// ------------------------------------------------

andGo()


