import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Environment variables from wrangler.toml
const B2_ACCOUNT_ID = '00551b461b72c8e000000002';
const B2_APPLICATION_KEY = ''; // Will be set as secret
const B2_ENDPOINT = 's3.us-east-005.backblazeb2.com';
const BUCKET_NAME = 'xenzys';

// Create B2 client
const b2Client = new S3Client({
  region: 'us-east-005',
  endpoint: `https://${B2_ENDPOINT}`,
  credentials: {
    accessKeyId: B2_ACCOUNT_ID,
    secretAccessKey: B2_APPLICATION_KEY,
  },
});

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.slice(1);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // Only allow GET requests
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }
    
    // List files (optional - for debugging)
    if (path === '' || path === 'list') {
      try {
        const command = new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          MaxKeys: 20,
        });
        
        const response = await b2Client.send(command);
        const files = response.Contents?.map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        })) || [];
        
        return Response.json({ files }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        return new Response(`Error: ${error.message}`, { 
          status: 500,
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }
    }
    
    // Serve a specific file
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
      });
      
      const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 3600 });
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      
      return new Response(blob, {
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'video/mp4',
          'Cache-Control': 'public, max-age=31536000',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      return new Response('File not found', { 
        status: 404,
        headers: { 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};