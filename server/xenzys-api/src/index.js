// Environment variables from wrangler.toml
const B2_ACCOUNT_ID = '005fe4bae51e8cd0000000001';
const B2_APPLICATION_KEY = ''; // Will be set as secret
const B2_API_URL = 'https://api005.backblazeb2.com';
const B2_DOWNLOAD_URL = 'https://f005.backblazeb2.com';
const BUCKET_NAME = 'xenzys';
const BUCKET_ID = 'bfce840beaae75919ec80c1d';
const PROXY_URL = 'https://b2-proxy.sutirthasoor7.workers.dev';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to parse multipart form data
async function parseFormData(request) {
  const formData = await request.formData();
  const file = formData.get('video');
  const title = formData.get('title') || 'Untitled';
  const description = formData.get('description') || '';
  const category = formData.get('category') || 'video';
  
  return { file, title, description, category };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ===== TEST ENDPOINT =====
    if (path === '/api/test' && request.method === 'GET') {
      return new Response(JSON.stringify({ 
        message: 'Xenzys API running on Cloudflare Workers!',
        proxy: PROXY_URL,
        database: 'D1 connected',
        b2: 'configured'
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // ===== GET VIDEOS =====
    if (path === '/api/videos' && request.method === 'GET') {
      const type = url.searchParams.get('type');
      
      try {
        let query = 'SELECT * FROM videos';
        const params = [];
        
        if (type === 'video' || type === 'short') {
          query += ' WHERE category = ?';
          params.push(type);
        }
        
        query += ' ORDER BY uploadedAt DESC';
        
        const { results } = await env.xenzys_db.prepare(query).bind(...params).all();
        
        // Parse comments JSON for each video
        results.forEach(v => {
          if (v.comments) {
            try {
              v.comments = JSON.parse(v.comments);
            } catch {
              v.comments = [];
            }
          }
        });
        
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ===== UPLOAD VIDEO (DIRECT B2 API) =====
    if (path === '/api/upload' && request.method === 'POST') {
      try {
        console.log('📤 Upload started');
        const formData = await request.formData();
        const file = formData.get('video');
        const title = formData.get('title') || 'Untitled';
        const description = formData.get('description') || '';
        const category = formData.get('category') || 'video';
        
        if (!file) {
          return new Response(JSON.stringify({ error: 'No video file' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }

        // Generate filename
        const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
        const fileBuffer = await file.arrayBuffer();

        // Step 1: Get B2 authorization
        console.log('🔑 Getting B2 authorization...');
        const authString = btoa(`${B2_ACCOUNT_ID}:${env.B2_APPLICATION_KEY}`);
        const authResponse = await fetch(`${B2_API_URL}/b2api/v3/b2_authorize_account`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${authString}`,
          },
        });

        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          throw new Error(`B2 auth failed: ${authResponse.status} - ${errorText}`);
        }

        const authData = await authResponse.json();
        const apiUrl = authData.apiInfo.storageApi.apiUrl;
        const authToken = authData.authorizationToken;
        
        // Step 2: Get upload URL using bucket ID
        console.log('📡 Getting upload URL...');
        const uploadUrlResponse = await fetch(`${apiUrl}/b2api/v3/b2_get_upload_url`, {
          method: 'POST',
          headers: {
            'Authorization': authToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bucketId: BUCKET_ID,
          }),
        });

        if (!uploadUrlResponse.ok) {
          const errorText = await uploadUrlResponse.text();
          throw new Error(`Failed to get upload URL: ${uploadUrlResponse.status} - ${errorText}`);
        }

        const uploadData = await uploadUrlResponse.json();
        const uploadUrl = uploadData.uploadUrl;
        const uploadAuthToken = uploadData.authorizationToken;

        // Step 3: Upload the file
        console.log('⬆️ Uploading file to B2...');
        const uploadResponse = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': uploadAuthToken,
            'X-Bz-File-Name': encodeURIComponent(filename),
            'Content-Type': 'b2/x-auto',
            'X-Bz-Content-Sha1': 'do_not_verify',
          },
          body: fileBuffer,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          throw new Error(`B2 upload failed: ${uploadResponse.status} - ${errorText}`);
        }

        const uploadResult = await uploadResponse.json();
        console.log('✅ B2 upload successful:', uploadResult.fileId);

        // Generate video URL through proxy
        const videoUrl = `${PROXY_URL}/${filename}`;
        const thumbnail = `https://via.placeholder.com/320x180/ff0000/ffffff?text=${title.substring(0,10)}`;

        // Save to D1
        const id = Date.now().toString();
        const uploadedAt = new Date().toISOString();

        await env.xenzys_db.prepare(
          `INSERT INTO videos (id, title, description, category, filename, videoUrl, thumbnail, uploadedAt, comments)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          id, title, description, category, filename, videoUrl, thumbnail, uploadedAt, '[]'
        ).run();

        const videoData = {
          id,
          title,
          description,
          category,
          filename,
          videoUrl,
          thumbnail,
          views: 0,
          likes: 0,
          dislikes: 0,
          comments: [],
          uploadedAt,
        };

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Upload successful',
          video: videoData 
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (error) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ 
          error: 'B2 upload failed', 
          details: error.message 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ===== LIKE VIDEO =====
    if (path.match(/^\/api\/videos\/.+\/like$/) && request.method === 'POST') {
      const id = path.split('/')[3];
      try {
        await env.xenzys_db.prepare('UPDATE videos SET likes = likes + 1 WHERE id = ?').bind(id).run();
        const { results } = await env.xenzys_db.prepare('SELECT likes FROM videos WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ likes: results[0]?.likes || 0 }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ===== VIEW VIDEO =====
    if (path.match(/^\/api\/videos\/.+\/view$/) && request.method === 'POST') {
      const id = path.split('/')[3];
      try {
        await env.xenzys_db.prepare('UPDATE videos SET views = views + 1 WHERE id = ?').bind(id).run();
        const { results } = await env.xenzys_db.prepare('SELECT views FROM videos WHERE id = ?').bind(id).all();
        return new Response(JSON.stringify({ views: results[0]?.views || 0 }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // ===== ADD COMMENT =====
    if (path.match(/^\/api\/videos\/.+\/comment$/) && request.method === 'POST') {
      const id = path.split('/')[3];
      try {
        const { text, username } = await request.json();
        
        const { results } = await env.xenzys_db.prepare('SELECT comments FROM videos WHERE id = ?').bind(id).all();
        let comments = [];
        try {
          comments = JSON.parse(results[0]?.comments || '[]');
        } catch {
          comments = [];
        }

        const newComment = {
          id: Date.now().toString(),
          text,
          username: username || 'Anonymous',
          timestamp: new Date().toISOString(),
          likes: 0
        };
        comments.push(newComment);

        await env.xenzys_db.prepare('UPDATE videos SET comments = ? WHERE id = ?')
          .bind(JSON.stringify(comments), id).run();

        return new Response(JSON.stringify({ comments }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    // 404 for unknown routes
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};"// Version 2.0.0 - $(date)" 
