const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());

// Homepage with instructions
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Web Proxy</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        input {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          border: 2px solid #ddd;
          border-radius: 5px;
          margin: 10px 0;
        }
        button {
          background: #007bff;
          color: white;
          padding: 12px 30px;
          border: none;
          border-radius: 5px;
          font-size: 16px;
          cursor: pointer;
        }
        button:hover { background: #0056b3; }
        .example { 
          color: #666; 
          font-size: 14px; 
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌐 Web Proxy</h1>
        <p>Enter a URL to browse through this proxy:</p>
        <input type="text" id="urlInput" placeholder="https://example.com" />
        <button onclick="goToSite()">Visit Site</button>
        <div class="example">
          Example: https://example.com or http://news.ycombinator.com
        </div>
      </div>
      <script>
        function goToSite() {
          const url = document.getElementById('urlInput').value;
          if (url) {
            const fullUrl = url.startsWith('http') ? url : 'https://' + url;
            window.location.href = '/proxy?url=' + encodeURIComponent(fullUrl);
          }
        }
        document.getElementById('urlInput').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') goToSite();
        });
      </script>
    </body>
    </html>
  `);
});

// Proxy endpoint
app.use('/proxy', (req, res, next) => {
  const targetUrl = req.query.url;
  
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter. Usage: /proxy?url=https://example.com');
  }

  // Validate URL
  try {
    new URL(targetUrl);
  } catch (e) {
    return res.status(400).send('Invalid URL provided');
  }

  // Create proxy middleware dynamically
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: {
      '^/proxy': '', // remove /proxy from path
    },
    onProxyReq: (proxyReq, req, res) => {
      // Remove url query param from forwarded request
      proxyReq.path = proxyReq.path.replace(/[?&]url=[^&]*/, '');
    },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).send('Proxy error: ' + err.message);
    }
  });

  proxy(req, res, next);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
