const http = require('http');

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: "operational",
      hardware: "Mocked AMD MI300X (Local Dev)",
      source: "mock_backend"
    }));
  } else if (req.url === '/translate' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      
      const mockAuditLog = {
        readiness_score: 80,
        ptx_risks: ["Line 42: Inline PTX detected"],
        wavefront_optimizations: ["Consider using 64-lane wavefronts for MI300X"],
        manual_intervention_required: false,
        estimated_mi300x_ms: 12.5
      };

      res.end(JSON.stringify({
        rocm_code: "// MOCKED ROCM CODE\n#include <hip/hip_runtime.h>\n\n__hip_global__ void test() {\n    // Translated\n}",
        audit_log: JSON.stringify(mockAuditLog)
      }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(8000, '0.0.0.0', () => {
  console.log('Mock backend listening on http://localhost:8000');
});
