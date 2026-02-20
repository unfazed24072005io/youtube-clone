import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables (will be set in wrangler.toml or as secrets)
const B2_ACCOUNT_ID = '00551b461b72c8e000000002';
const B2_APPLICATION_KEY = ''; // Will be set as secret
const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const BUCKET_NAME = 'xenzys';

// Create B2 client (S3-compatible!)
const b2Client = new S3Client({
  region: 'us-east-005',
  endpoint: `https://${B2_ENDPOINT}`,
  credentials: {
    accessKeyId: B2_ACCOUNT_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1); // Remove leading slash

    // Handle OPTIONS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Route: /list - List files in bucket (useful for debugging)
    if (path === 'list') {
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          MaxKeys: 50,
        });
        
        const response = await b2Client.send(command);
        const files = response.Contents?.map(obj => ({
          filename: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          url: `https://${url.hostname}/${obj.Key}`,
        })) || [];
        
        return new Response(JSON.stringify({ 
          bucket: BUCKET_NAME,
          total: files.length,
          files 
        }, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'Failed to list files',
          details: error.message 
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Route: /[filename] - Serve a specific file
    if (path && !path.includes('/')) {
      try {
        // Generate a signed URL valid for 1 hour
        const command = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: path,
        });
        
        const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 3600 });
        
        // Fetch the file from B2 using signed URL
        const response = await fetch(signedUrl);
        
        if (!response.ok) {
          throw new Error(`B2 returned ${response.status}`);
        }
        
        // Get the file content
        const blob = await response.blob();
        
        // Determine content type
        const contentType = response.headers.get('Content-Type') || 
                           getContentType(path) || 
                           'application/octet-stream';
        
        // Return file with proper headers
        return new Response(blob, {
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
            'Access-Control-Allow-Origin': '*',
            'Content-Disposition': 'inline', // Play in browser, don't download
          },
        });
      } catch (error) {
        return new Response(JSON.stringify({ 
          error: 'File not found',
          path: path,
          details: error.message 
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Root path - show welcome message
    return new Response(`
      <html>
        <head><title>Xenzys B2 Proxy</title></head>
        <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
          <h1>🎬 Xenzys B2 Proxy Worker</h1>
          <p>This worker serves videos from your private Backblaze B2 bucket.</p>
          
          <h2>Usage:</h2>
          <ul>
            <li><code>GET /filename.mp4</code> - Play a video</li>
            <li><code>GET /list</code> - List all files in bucket</li>
          </ul>
          
          <h2>Your Frontend:</h2>
          <p><a href="https://4e584c5a.xenzys.pages.dev" target="_blank">https://4e584c5a.xenzys.pages.dev</a></p>
          
          <h2>Status:</h2>
          <ul>
            <li>✅ B2 Bucket: <strong>xenzys</strong></li>
            <li>✅ Region: <strong>us-east-005</strong></li>
            <li>✅ Proxy Worker: <strong>Active</strong></li>
            <li>⏳ Main API: <strong>Pending (xenzys-api)</strong></li>
          </ul>
        </body>
      </html>
    `, {
      headers: {
        'Content-Type': 'text/html',
        ...corsHeaders,
      },
    });
  },
};

// Helper function to determine content type from filename
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'webm': 'video/webm',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
  };
  return types[ext] || null;
}