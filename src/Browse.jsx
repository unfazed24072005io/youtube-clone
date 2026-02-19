import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Skeleton,
  Chip,
  Button,
  Card,
  CardMedia,
  CardContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Whatshot,
  MusicNote,
  SportsEsports,
  Movie,
  MoreVert,
  WatchLater,
  PlaylistAdd,
  Share,
  ThumbUp,
  ThumbDown
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const categories = [
  { label: 'All', icon: null },
  { label: 'Trending', icon: <Whatshot /> },
  { label: 'Music', icon: <MusicNote /> },
  { label: 'Gaming', icon: <SportsEsports /> },
  { label: 'Movies', icon: <Movie /> }
  // Removed News category
];

const Browse = ({ searchQuery }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [liked, setLiked] = useState({});
  const [disliked, setDisliked] = useState({});

  useEffect(() => {
    fetchVideos();
  }, [selectedCategory, searchQuery]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/videos?type=video');
      let filtered = response.data;
      
      if (searchQuery) {
        filtered = filtered.filter(v => 
          v.title?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setVideos(filtered);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast.error('Failed to load videos');
      setLoading(false);
    }
  };

  const handleMenuClick = (event, video) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedVideo(video);
  };

  const handleMenuClose = (e) => {
    e?.stopPropagation();
    setAnchorEl(null);
    setSelectedVideo(null);
  };

  const handleVideoClick = (video) => {
    window.open(video.videoUrl, '_blank');
    axios.post(`http://localhost:5000/api/videos/${video.id}/view`);
  };

  const handleLike = async (e, videoId) => {
    e.stopPropagation();
    if (!liked[videoId]) {
      try {
        const res = await axios.post(`http://localhost:5000/api/videos/${videoId}/like`);
        setVideos(videos.map(v => 
          v.id === videoId ? {...v, likes: res.data.likes} : v
        ));
        setLiked({...liked, [videoId]: true});
        if (disliked[videoId]) setDisliked({...disliked, [videoId]: false});
        toast.success('Liked!');
      } catch (error) {
        console.error('Error liking video:', error);
      }
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
    if (views >= 1000) return (views / 1000).toFixed(1) + 'K';
    return views || 0;
  };

  const formatTime = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const uploaded = new Date(date);
    const diff = Math.floor((now - uploaded) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + ' minutes ago';
    if (diff < 86400) return Math.floor(diff / 3600) + ' hours ago';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' days ago';
    return Math.floor(diff / 2592000) + ' months ago';
  };

  return (
    <Box>
      {/* Categories */}
      <Box sx={{ 
        display: 'flex', 
        gap: 1, 
        mb: 3, 
        overflowX: 'auto',
        pb: 1,
        '&::-webkit-scrollbar': { height: 4 },
        '&::-webkit-scrollbar-thumb': { bgcolor: '#ff0000', borderRadius: 2 }
      }}>
        {categories.map((cat) => (
          <Chip
            key={cat.label}
            label={cat.label}
            icon={cat.icon}
            onClick={() => setSelectedCategory(cat.label)}
            sx={{
              bgcolor: selectedCategory === cat.label ? '#ff0000' : '#1a1a1a',
              color: 'white',
              '&:hover': {
                bgcolor: selectedCategory === cat.label ? '#ff0000' : '#303030',
              },
              '& .MuiChip-icon': {
                color: 'white'
              }
            }}
          />
        ))}
      </Box>

      {/* Video Grid */}
      <Grid container spacing={2}>
        {loading ? (
          [...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ bgcolor: '#1a1a1a', borderRadius: 2 }} />
              <Box sx={{ pt: 2, display: 'flex', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: '#1a1a1a' }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" sx={{ bgcolor: '#1a1a1a', fontSize: '1rem' }} />
                  <Skeleton variant="text" sx={{ bgcolor: '#1a1a1a', fontSize: '0.875rem', width: '60%' }} />
                </Box>
              </Box>
            </Grid>
          ))
        ) : videos.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                No videos found
              </Typography>
              <Button 
                variant="contained" 
                sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
                href="/upload"
              >
                Upload a Video
              </Button>
            </Box>
          </Grid>
        ) : (
          videos.map((video) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={video.id}>
              <Card 
                sx={{ 
                  bgcolor: 'transparent', 
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    '& .video-actions': {
                      opacity: 1
                    }
                  }
                }}
                onClick={() => handleVideoClick(video)}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardMedia
                    component="img"
                    image={video.thumbnail || 'https://via.placeholder.com/320x180/ff0000/ffffff?text=Video'}
                    alt={video.title}
                    sx={{
                      height: 180,
                      borderRadius: 2,
                      objectFit: 'cover'
                    }}
                  />
                  <Box
                    className="video-actions"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    <IconButton 
                      size="small" 
                      sx={{ bgcolor: 'rgba(0,0,0,0.8)', color: 'white', '&:hover': { bgcolor: '#ff0000' } }}
                      onClick={(e) => handleMenuClick(e, video)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                  <Chip
                    label={video.duration || '10:30'}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      fontSize: '12px'
                    }}
                  />
                </Box>

                <CardContent sx={{ px: 0, pt: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: '#ff0000',
                        width: 40,
                        height: 40
                      }}
                    >
                      {video.channel?.charAt(0) || 'Y'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 500,
                          lineHeight: 1.2,
                          mb: 0.5
                        }}
                      >
                        {video.title || 'Untitled'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#909090' }}>
                        {video.channel || 'Your Channel'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#909090' }}>
                          {formatViews(video.views)} views
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#909090' }}>•</Typography>
                        <Typography variant="body2" sx={{ color: '#909090' }}>
                          {formatTime(video.uploadedAt)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleLike(e, video.id)}
                            sx={{ 
                              color: liked[video.id] ? '#ff0000' : '#909090',
                              p: 0.5
                            }}
                          >
                            <ThumbUp fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" sx={{ color: '#909090' }}>
                            {formatViews(video.likes)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            sx={{ color: '#909090', p: 0.5 }}
                          >
                            <ThumbDown fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" sx={{ color: '#909090' }}>
                            {formatViews(video.dislikes)}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Video Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            bgcolor: '#1a1a1a',
            color: 'white',
            border: '1px solid #303030'
          }
        }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
          <WatchLater fontSize="small" /> Save to Watch Later
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
          <PlaylistAdd fontSize="small" /> Save to Playlist
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
          <Share fontSize="small" /> Share
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
          <ThumbUp fontSize="small" /> Not Interested
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ gap: 1 }}>
          <ThumbDown fontSize="small" /> Don't recommend channel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Browse;