const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 3100);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.txt': 'text/plain; charset=utf-8'
};

const corsHeaders = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Methods':'GET,OPTIONS',
  'Access-Control-Allow-Headers':'Content-Type',
  'Access-Control-Max-Age':'86400'
};

function sendText(response, statusCode, text){
  response.writeHead(statusCode, {
    'Content-Type':'text/plain; charset=utf-8',
    'X-Content-Type-Options':'nosniff',
    ...corsHeaders
  });
  response.end(text);
}

function resolveRequest(urlPath){
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]).replace(/^\/+/, '');
  const route = cleanPath || 'index';
  const candidates = [
    path.join(root, route),
    path.join(root, `${route}.html`),
    path.join(root, route, 'index.html')
  ];

  return candidates.find(candidate => {
    const relative = path.relative(root, candidate);
    return relative && !relative.startsWith('..') && fs.existsSync(candidate) && fs.statSync(candidate).isFile();
  });
}

const server = http.createServer((request, response) => {
  if(request.method === 'OPTIONS'){
    response.writeHead(204, corsHeaders);
    response.end();
    return;
  }

  const filePath = resolveRequest(request.url || '/');

  if(!filePath){
    sendText(response, 404, 'Pagina nao encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    'Content-Type': mimeTypes[ext] || 'application/octet-stream',
    'X-Content-Type-Options':'nosniff',
    ...corsHeaders
  });
  fs.createReadStream(filePath).pipe(response);
});

if(require.main === module){
  server.listen(port, () => {
    console.log(`Bem Esportivo local: http://localhost:${port}`);
  });
}

module.exports = {
  server
};
