import React, { useEffect, useState } from 'react';
import {
  Grid,
  Box,
  Typography,
  Skeleton,
  Chip,
  Button,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  TextField
} from '@mui/material';
import {
  MoreVert,
  WatchLater,
  PlaylistAdd,
  Share,
  ThumbUp,
  ThumbDown,
  PlayArrow
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Browse = ({ searchQuery }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [liked, setLiked] = useState({});
  const [disliked, setDisliked] = useState({});
  const [playerOpen, setPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://xenzys-api.sutirthasoor7.workers.dev/api/videos?type=video');
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

  useEffect(() => {
    fetchVideos();
  }, [searchQuery]); // Removed fetchVideos from dependencies to fix the warning

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
    setCurrentVideo(video);
    setPlayerOpen(true);
    setComments(video.comments || []);
    
    axios.post(`https://xenzys-api.sutirthasoor7.workers.dev/api/videos/${video.id}/view`);
    
    setVideos(videos.map(v => 
      v.id === video.id ? {...v, views: (v.views || 0) + 1} : v
    ));
  };

  const handleLikeVideo = async () => {
    if (!currentVideo || liked[currentVideo.id]) return;
    
    try {
      const res = await axios.post(`https://xenzys-api.sutirthasoor7.workers.dev/api/videos/${currentVideo.id}/like`);
      setCurrentVideo({...currentVideo, likes: res.data.likes});
      setLiked({...liked, [currentVideo.id]: true});
      if (disliked[currentVideo.id]) setDisliked({...disliked, [currentVideo.id]: false});
      
      setVideos(videos.map(v => 
        v.id === currentVideo.id ? {...v, likes: res.data.likes} : v
      ));
    } catch (error) {
      console.error('Error liking video:', error);
    }
  };

  const handleDislikeVideo = async () => {
    if (!currentVideo || disliked[currentVideo.id]) return;
    
    try {
      const res = await axios.post(`https://xenzys-api.sutirthasoor7.workers.dev/api/videos/${currentVideo.id}/dislike`);
      setCurrentVideo({...currentVideo, dislikes: res.data.dislikes});
      setDisliked({...disliked, [currentVideo.id]: true});
      if (liked[currentVideo.id]) setLiked({...liked, [currentVideo.id]: false});
      
      setVideos(videos.map(v => 
        v.id === currentVideo.id ? {...v, dislikes: res.data.dislikes} : v
      ));
    } catch (error) {
      console.error('Error disliking video:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentVideo) return;
    
    try {
      const res = await axios.post(`https://xenzys-api.sutirthasoor7.workers.dev/api/videos/${currentVideo.id}/comment`, {
        text: commentText,
        username: 'You'
      });
      
      setComments(res.data.comments);
      setCommentText('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLike = async (e, videoId) => {
    e.stopPropagation();
    if (!liked[videoId]) {
      try {
        const res = await axios.post(`https://xenzys-api.sutirthasoor7.workers.dev/api/videos/${videoId}/like`);
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
    <Box sx={{ 
      width: '100%',
      maxWidth: '100%',
      overflowX: 'hidden',
      px: { xs: 1, sm: 2, md: 3 },
      boxSizing: 'border-box'
    }}>
      {/* Video Grid */}
      <Grid 
        container 
        spacing={{ xs: 1, sm: 2 }} 
        sx={{ 
          mx: 0, 
          width: 'calc(100% + 16px)',
          marginLeft: '-8px',
          marginRight: '-8px',
          mt: 2
        }}
      >
        {loading ? (
          [...Array(8)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={i} sx={{ pl: '8px', pr: '8px' }}>
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
            <Grid 
              item 
              xs={12} 
              sm={6} 
              md={4} 
              lg={3} 
              key={video.id}
              sx={{ 
                pl: '8px', 
                pr: '8px',
                width: '100%'
              }}
            >
              <Card 
                sx={{ 
                  bgcolor: 'transparent', 
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  width: '100%',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    '& .video-actions': {
                      opacity: 1
                    },
                    '& .play-button': {
                      transform: 'scale(1.1)'
                    }
                  }
                }}
                onClick={() => handleVideoClick(video)}
              >
                <Box sx={{ position: 'relative', height: 180, bgcolor: '#000', borderRadius: 2, overflow: 'hidden' }}>
                  {/* Black background with red play button circle */}
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      bgcolor: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Red Circle with Play Icon */}
                    <Box
                      className="play-button"
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: '#ff0000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        boxShadow: '0 4px 10px rgba(255,0,0,0.3)'
                      }}
                    >
                      <PlayArrow sx={{ fontSize: 40, color: 'white' }} />
                    </Box>
                  </Box>
                  
                  {/* Actions Menu Button */}
                  <Box
                    className="video-actions"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      zIndex: 10
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
                  
                  {/* Duration Chip */}
                  <Chip
                    label={video.duration || '0:00'}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      fontSize: '12px',
                      zIndex: 10
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          color: 'white', 
                          fontWeight: 500,
                          lineHeight: 1.2,
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {video.title || 'Untitled'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#909090' }}>
                        {video.channel || 'Your Channel'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
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

      {/* Video Player Modal - Fixed Overflow */}
      {playerOpen && currentVideo && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0,0,0,0.95)',
            zIndex: 2000,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setPlayerOpen(false)}
        >
          <Box 
            sx={{ 
              width: '100%',
              maxWidth: 1200,
              maxHeight: '90vh',
              mx: 'auto', 
              p: { xs: 1, sm: 2, md: 3 },
              cursor: 'default',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <IconButton
              onClick={() => setPlayerOpen(false)}
              sx={{ 
                position: 'absolute', 
                top: { xs: 8, sm: 16 }, 
                right: { xs: 8, sm: 16 }, 
                zIndex: 2100,
                bgcolor: '#ff0000',
                color: 'white',
                '&:hover': { bgcolor: '#cc0000' },
                width: { xs: 36, sm: 48 },
                height: { xs: 36, sm: 48 }
              }}
            >
              ✕
            </IconButton>

            {/* Video Player */}
            <Box sx={{ 
              position: 'relative', 
              width: '100%',
              height: 0,
              pb: '56.25%',
              bgcolor: '#000', 
              borderRadius: 2, 
              overflow: 'hidden' 
            }}>
              <video
                src={`https://b2-proxy.sutirthasoor7.workers.dev/${currentVideo.filename}`}
                controls
                autoPlay
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
              />
            </Box>

            {/* Video Info - Scrollable */}
            <Box sx={{ 
              mt: { xs: 1, sm: 2, md: 3 }, 
              color: 'white',
              maxHeight: '35vh',
              overflowY: 'auto',
              pr: 1,
              width: '100%',
              boxSizing: 'border-box',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: '#ff0000',
                borderRadius: '10px',
              }
            }}>
              <Typography variant="h5" sx={{ mb: 2, fontSize: { xs: '1.2rem', sm: '1.5rem' } }}>{currentVideo.title}</Typography>
              
              {/* Stats and Actions */}
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' }, 
                mb: 2, 
                pb: 2, 
                borderBottom: '1px solid #333',
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="body2" sx={{ color: '#aaa' }}>
                  {formatViews(currentVideo.views)} views • {formatTime(currentVideo.uploadedAt)}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    startIcon={<ThumbUp />}
                    onClick={handleLikeVideo}
                    sx={{
                      color: liked[currentVideo.id] ? '#ff0000' : '#aaa',
                      '&:hover': { color: '#ff0000' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minWidth: 'auto'
                    }}
                  >
                    {formatViews(currentVideo.likes)}
                  </Button>
                  <Button
                    startIcon={<ThumbDown />}
                    onClick={handleDislikeVideo}
                    sx={{
                      color: disliked[currentVideo.id] ? '#ff0000' : '#aaa',
                      '&:hover': { color: '#ff0000' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minWidth: 'auto'
                    }}
                  >
                    {formatViews(currentVideo.dislikes)}
                  </Button>
                  <Button 
                    startIcon={<Share />} 
                    sx={{ 
                      color: '#aaa', 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      minWidth: 'auto'
                    }}
                  >
                    Share
                  </Button>
                </Box>
              </Box>

              {/* Channel Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Avatar sx={{ bgcolor: '#ff0000', width: { xs: 32, sm: 48 }, height: { xs: 32, sm: 48 } }}>
                  {currentVideo.channel?.charAt(0) || 'Y'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>{currentVideo.channel || 'Your Channel'}</Typography>
                  <Typography variant="body2" sx={{ color: '#aaa', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>1.2K subscribers</Typography>
                </Box>
                <Button
                  variant="contained"
                  sx={{
                    ml: 'auto',
                    bgcolor: '#cc0000',
                    '&:hover': { bgcolor: '#ff0000' },
                    fontSize: { xs: '0.7rem', sm: '0.875rem' },
                    py: { xs: 0.5, sm: 1 }
                  }}
                >
                  Subscribe
                </Button>
              </Box>

              {/* Description */}
              <Typography variant="body1" sx={{ 
                mb: 3, 
                color: '#ddd', 
                whiteSpace: 'pre-wrap',
                fontSize: { xs: '0.85rem', sm: '1rem' }
              }}>
                {currentVideo.description || 'No description'}
              </Typography>

              {/* Comments Section */}
              <Box>
                <Typography variant="h6" sx={{ mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Comments ({comments.length})</Typography>
                
                {/* Add Comment */}
                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Avatar sx={{ bgcolor: '#333', width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 } }}>Y</Avatar>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Add a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: '#333' },
                        '&:hover fieldset': { borderColor: '#ff0000' }
                      }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddComment}
                    sx={{ 
                      bgcolor: '#ff0000', 
                      '&:hover': { bgcolor: '#cc0000' },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    Comment
                  </Button>
                </Box>

                {/* Comments List */}
                {comments.map((comment, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#333', width: 32, height: 32 }}>
                      {comment.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="subtitle2">{comment.username}</Typography>
                        <Typography variant="caption" sx={{ color: '#aaa' }}>
                          {new Date(comment.timestamp).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: '#ddd' }}>{comment.text}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Browse;