const https   = require('https');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path   = require('path');
const morgan = require('morgan');
const fs     = require('fs');


const WEB_PORT      = process.env.WEB_PORT   ? process.env.WEB_PORT   : 8300
const WEB_CONF      = process.env.WEB_CONF   ? process.env.WEB_CONF   : 'view.json'

var configs ;

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

     const [key, server, prefix] = args.split('#');
  
     const dictionary = {
       key: key,
       server: server,
       prefix: prefix
     };

     resultArray.push(dictionary);

   });
   return resultArray ;
}
//-----------------------------------------------
const getEndpointHandler = (req, res) => {
//-----------------------------------------------
  res.json(endpoints);
};

configs = getConfigFromArgs()

try{
   if( configs.length == 0 )configs = getConfigFromFile( WEB_CONF )
}catch( error ){
   configs = [] 
}

var endpoints = JSON.parse(JSON.stringify(configs));
//
//
const app = express();

var configs ;

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
        target: ex.server , // target server URL (can be HTTPS)
        changeOrigin: true,     // needed for virtual hosted sites
        secure: true,           // if you want to ignore self-signed SSL certificates
        logger: console ,
        logLevel: 'debug',      // optional: to help with debugging
        pathRewrite: { '^/': ex.prefix,  },
      };
      ex.proxy = proxyConfig;
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
             server.close()
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
   console.log("STARTING");
   initRoutes( configs );

   server = app.listen(WEB_PORT, () => {
      console.log(`Server running at http://localhost:${WEB_PORT}`);
      configs.forEach( ex => {
         console.log(`Server connecting to ${ex.key} ${ex.server} ${ex.prefix}`);
      })
   });

}

// ------------------------------------------------

andGo()


