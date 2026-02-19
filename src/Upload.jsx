import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Avatar
} from '@mui/material';
import {
  CloudUpload,
  Videocam,
  Description,
  CheckCircle,
  Cancel,
  Add,
  Tag
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';

const steps = ['Select Video', 'Add Details', 'Upload'];

const Upload = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('video');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [thumbnail, setThumbnail] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const selected = acceptedFiles[0];
    if (selected?.type.startsWith('video/')) {
      setFile(selected);
      setError('');
      
      // Get video duration and generate thumbnail
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        if (video.duration < 60) {
          setCategory('short');
          toast.info('This looks like a short! We\'ve set it as a Short.');
        }
        URL.revokeObjectURL(video.src);
      };

      // Generate thumbnail
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          setThumbnail(blob);
        }, 'image/jpeg');
      };

      video.src = URL.createObjectURL(selected);
      
      setActiveStep(1);
      toast.success('Video selected successfully!');
    } else {
      setError('Please select a video file');
      toast.error('Please select a valid video file');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': [] },
    maxFiles: 1
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleUpload = async () => {
    if (!file || !title) {
      toast.error('Please add a title');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('tags', JSON.stringify(tags));
    formData.append('duration', videoDuration);
    if (thumbnail) {
      formData.append('thumbnail', thumbnail, 'thumbnail.jpg');
    }

    try {
      await axios.post('http://localhost:5000/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percent);
          }
        }
      });

      setSuccess(true);
      toast.success('🎉 Video uploaded successfully!');
      
      setTimeout(() => {
        setFile(null);
        setTitle('');
        setDescription('');
        setCategory('video');
        setTags([]);
        setThumbnail(null);
        setProgress(0);
        setSuccess(false);
        setUploading(false);
        setActiveStep(0);
      }, 3000);
    } catch (err) {
      setError('Upload failed. Please try again.');
      toast.error('Upload failed');
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setUploading(false);
    setProgress(0);
    setFile(null);
    setActiveStep(0);
    toast.info('Upload cancelled');
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Paper
            {...getRootProps()}
            sx={{
              p: 8,
              textAlign: 'center',
              bgcolor: '#1a1a1a',
              border: '2px dashed',
              borderColor: isDragActive ? '#ff0000' : '#404040',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: '#ff0000',
                bgcolor: '#252525'
              }
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 80, color: '#ff0000', mb: 2 }} />
            <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
              {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#909090', mb: 3 }}>
              or click to browse
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip label="MP4" sx={{ bgcolor: '#303030', color: 'white' }} />
              <Chip label="MOV" sx={{ bgcolor: '#303030', color: 'white' }} />
              <Chip label="AVI" sx={{ bgcolor: '#303030', color: 'white' }} />
              <Chip label="Up to 100MB" sx={{ bgcolor: '#303030', color: 'white' }} />
            </Box>
          </Paper>
        );

      case 1:
        return (
          <Paper sx={{ p: 4, bgcolor: '#1a1a1a' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Avatar sx={{ bgcolor: '#ff0000', width: 56, height: 56 }}>
                <Videocam />
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: '#909090' }}>
                  Selected video
                </Typography>
                <Typography sx={{ color: 'white', fontWeight: 500 }}>
                  {file?.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                  <Chip
                    label={`${(file?.size / (1024 * 1024)).toFixed(2)} MB`}
                    size="small"
                    sx={{ bgcolor: '#303030', color: 'white' }}
                  />
                  <Chip
                    label={formatDuration(videoDuration)}
                    size="small"
                    sx={{ bgcolor: '#303030', color: 'white' }}
                  />
                </Box>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Title"
              variant="outlined"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#404040' },
                  '&:hover fieldset': { borderColor: '#ff0000' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' }
                },
                '& .MuiInputLabel-root': { color: '#909090' }
              }}
            />

            <TextField
              fullWidth
              label="Description"
              variant="outlined"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  '& fieldset': { borderColor: '#404040' },
                  '&:hover fieldset': { borderColor: '#ff0000' },
                  '&.Mui-focused fieldset': { borderColor: '#ff0000' }
                },
                '& .MuiInputLabel-root': { color: '#909090' }
              }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant={category === 'video' ? 'contained' : 'outlined'}
                onClick={() => setCategory('video')}
                sx={{
                  bgcolor: category === 'video' ? '#ff0000' : 'transparent',
                  color: 'white',
                  borderColor: '#404040',
                  '&:hover': {
                    bgcolor: category === 'video' ? '#cc0000' : '#303030'
                  }
                }}
              >
                Regular Video
              </Button>
              <Button
                variant={category === 'short' ? 'contained' : 'outlined'}
                onClick={() => setCategory('short')}
                sx={{
                  bgcolor: category === 'short' ? '#ff0000' : 'transparent',
                  color: 'white',
                  borderColor: '#404040',
                  '&:hover': {
                    bgcolor: category === 'short' ? '#cc0000' : '#303030'
                  }
                }}
              >
                Short (Vertical)
              </Button>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ color: 'white', mb: 1 }}>Tags</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{ bgcolor: '#303030', color: 'white' }}
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': { borderColor: '#404040' }
                    }
                  }}
                />
                <IconButton
                  onClick={handleAddTag}
                  sx={{ bgcolor: '#ff0000', color: 'white', '&:hover': { bgcolor: '#cc0000' } }}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
                sx={{ color: 'white', borderColor: '#404040' }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!title}
                sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
              >
                Next
              </Button>
            </Box>
          </Paper>
        );

      case 2:
        return (
          <Paper sx={{ p: 4, bgcolor: '#1a1a1a', textAlign: 'center' }}>
            {!uploading && !success ? (
              <>
                <Videocam sx={{ fontSize: 80, color: '#ff0000', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                  Ready to upload?
                </Typography>
                <Typography variant="body1" sx={{ color: '#909090', mb: 3 }}>
                  Your video "{title}" will be public after upload
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => setActiveStep(1)}
                    sx={{ color: 'white', borderColor: '#404040' }}
                  >
                    Back
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
                  >
                    Upload Now
                  </Button>
                </Box>
              </>
            ) : uploading ? (
              <Box>
                <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                  Uploading... {progress}%
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: '#303030',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ff0000'
                    }
                  }} 
                />
                <Button
                  variant="text"
                  onClick={handleCancel}
                  sx={{ color: '#ff0000', mt: 2 }}
                >
                  Cancel
                </Button>
              </Box>
            ) : success ? (
              <Box>
                <CheckCircle sx={{ fontSize: 80, color: '#4caf50', mb: 2 }} />
                <Typography variant="h5" sx={{ color: 'white', mb: 1 }}>
                  Upload Complete!
                </Typography>
                <Typography variant="body1" sx={{ color: '#909090' }}>
                  Your video is being processed
                </Typography>
              </Box>
            ) : null}
          </Paper>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', py: 4 }}>
      <Typography variant="h4" sx={{ color: 'white', mb: 4, fontWeight: 600 }}>
        Upload Video
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'white' } }}>
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {getStepContent(activeStep)}
    </Box>
  );
};

export default Upload;