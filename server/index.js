const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads folder
const uploadDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadDir);

// Configure multer for multiple fields
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

// File filter to only allow videos and images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video and image files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Handle multiple fields: video and thumbnail
const cpUpload = upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Store videos in memory
let videos = [];

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Upload endpoint - Handle multiple fields
app.post('/api/upload', cpUpload, (req, res) => {
  try {
    console.log('Upload request received');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const { title, description, category } = req.body;
    const videoFile = req.files?.video?.[0];
    const thumbnailFile = req.files?.thumbnail?.[0];

    if (!videoFile) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoData = {
      id: Date.now().toString(),
      title: title || 'Untitled',
      description: description || '',
      category: category || 'video',
      filename: videoFile.filename,
      videoUrl: `http://localhost:5000/uploads/${videoFile.filename}`,
      thumbnail: thumbnailFile 
        ? `http://localhost:5000/uploads/${thumbnailFile.filename}`
        : `https://via.placeholder.com/320x180/ff0000/ffffff?text=${(title || 'Video').substring(0,10)}`,
      channel: 'Your Channel',
      channelAvatar: 'https://via.placeholder.com/36/ff0000/ffffff?text=YC',
      views: 0,
      likes: 0,
      dislikes: 0,
      comments: [],
      uploadedAt: new Date().toISOString(),
      duration: req.body.duration || '0:00'
    };

    videos.push(videoData);
    console.log('Video saved. Total videos:', videos.length);

    res.json({ 
      success: true, 
      message: 'Upload successful',
      video: videoData 
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// Get videos with optional type filter
app.get('/api/videos', (req, res) => {
  const { type } = req.query;
  let filtered = videos;
  
  if (type === 'video') {
    filtered = videos.filter(v => v.category === 'video');
  } else if (type === 'short') {
    filtered = videos.filter(v => v.category === 'short');
  }
  
  res.json(filtered);
});

// Get single video
app.get('/api/videos/:id', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (video) {
    res.json(video);
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Like video
app.post('/api/videos/:id/like', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (video) {
    video.likes += 1;
    res.json({ likes: video.likes });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Dislike video
app.post('/api/videos/:id/dislike', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (video) {
    video.dislikes += 1;
    res.json({ dislikes: video.dislikes });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Add view
app.post('/api/videos/:id/view', (req, res) => {
  const video = videos.find(v => v.id === req.params.id);
  if (video) {
    video.views += 1;
    res.json({ views: video.views });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Add comment
app.post('/api/videos/:id/comment', (req, res) => {
  const { text, username } = req.body;
  const video = videos.find(v => v.id === req.params.id);
  
  if (video) {
    const comment = {
      id: Date.now().toString(),
      text,
      username: username || 'Anonymous',
      timestamp: new Date().toISOString(),
      likes: 0
    };
    video.comments.push(comment);
    res.json({ comments: video.comments });
  } else {
    res.status(404).json({ error: 'Video not found' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Max 100MB' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: `Unexpected field: ${err.field}` });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Videos will be stored in:', uploadDir);
  console.log('Test endpoint: http://localhost:5000/api/test');
});