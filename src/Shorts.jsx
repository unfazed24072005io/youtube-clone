import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Avatar,
  TextField,
  Button,
  Paper,
  Chip
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MusicNote,
  MoreVert
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';

const Shorts = () => {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState({});
  const [commentText, setCommentText] = useState('');
  const [openCommentsId, setOpenCommentsId] = useState(null);
  const [commentsMap, setCommentsMap] = useState({});
  const videoRefs = useRef([]);

  useEffect(() => {
    fetchShorts();
  }, []);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(() => {});
          if (shorts[index]) {
            axios.post(`https://youtube-clone-ofee.onrender.com/api/videos/${shorts[index].id}/view`);
          }
        } else {
          video.pause();
        }
      }
    });
  }, [currentIndex, shorts]);

  const fetchShorts = async () => {
    try {
      const response = await axios.get('https://youtube-clone-ofee.onrender.com/api/videos?type=short');
      setShorts(response.data);
      
      const comments = {};
      response.data.forEach(short => {
        comments[short.id] = short.comments || [];
      });
      setCommentsMap(comments);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching shorts:', error);
      toast.error('Failed to load shorts');
      setLoading(false);
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    const itemHeight = window.innerHeight - 64; // Subtract header height
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex >= 0 && newIndex < shorts.length) {
      setCurrentIndex(newIndex);
      setOpenCommentsId(null);
      setCommentText('');
    }
  };

  const handleLike = async (shortId) => {
    if (!liked[shortId]) {
      try {
        const res = await axios.post(`https://youtube-clone-ofee.onrender.com/api/videos/${shortId}/like`);
        setShorts(shorts.map(s => 
          s.id === shortId ? {...s, likes: res.data.likes} : s
        ));
        setLiked({...liked, [shortId]: true});
        toast.success('Liked!');
      } catch (error) {
        console.error('Error liking short:', error);
      }
    }
  };

  const handleComment = async (shortId) => {
    if (commentText.trim()) {
      try {
        const res = await axios.post(`https://youtube-clone-ofee.onrender.com/api/videos/${shortId}/comment`, {
          text: commentText,
          username: 'You'
        });
        
        setCommentsMap({
          ...commentsMap,
          [shortId]: res.data.comments
        });
        
        setShorts(shorts.map(s => 
          s.id === shortId ? {...s, comments: res.data.comments} : s
        ));
        
        setCommentText('');
        toast.success('Comment added!');
      } catch (error) {
        console.error('Error posting comment:', error);
        toast.error('Failed to post comment');
      }
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num/1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num/1000).toFixed(1) + 'K';
    return num || 0;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography sx={{ color: 'white' }}>Loading shorts...</Typography>
      </Box>
    );
  }

  if (shorts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
          No shorts yet
        </Typography>
        <Button 
          variant="contained" 
          sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
          href="/upload"
        >
          Upload a Short
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        bgcolor: '#000',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {shorts.map((short, index) => (
        <Box
          key={short.id}
          sx={{
            height: 'calc(100vh - 64px)',
            scrollSnapAlign: 'start',
            position: 'relative',
            bgcolor: '#000'
          }}
        >
          <video
            ref={(el) => { videoRefs.current[index] = el; }}
            src={`https://youtube-clone-ofee.onrender.com/uploads/${short.filename}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            loop
            playsInline
            muted={false}
          />

          {/* Video Info Overlay */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              p: 3,
              background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ bgcolor: '#ff0000' }}>
                {short.channel?.charAt(0) || 'Y'}
              </Avatar>
              <Box>
                <Typography variant="h6">{short.title || 'Untitled'}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  {short.channel || 'Your Channel'} • {formatNumber(short.views)} views
                </Typography>
              </Box>
            </Box>

            {short.description && (
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                {short.description}
              </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                icon={<MusicNote />}
                label="Original Audio"
                size="small"
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box
            sx={{
              position: 'absolute',
              right: 16,
              bottom: 100,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <IconButton
              onClick={() => handleLike(short.id)}
              sx={{
                bgcolor: 'rgba(0,0,0,0.6)',
                color: liked[short.id] ? '#ff0000' : 'white',
                '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' },
                flexDirection: 'column',
                width: 56,
                height: 56
              }}
            >
              {liked[short.id] ? <Favorite /> : <FavoriteBorder />}
              <Typography variant="caption">{formatNumber(short.likes)}</Typography>
            </IconButton>

            <IconButton
              onClick={() => setOpenCommentsId(openCommentsId === short.id ? null : short.id)}
              sx={{
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' },
                flexDirection: 'column',
                width: 56,
                height: 56
              }}
            >
              <Comment />
              <Typography variant="caption">{formatNumber(commentsMap[short.id]?.length || 0)}</Typography>
            </IconButton>

            <IconButton
              sx={{
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' },
                flexDirection: 'column',
                width: 56,
                height: 56
              }}
            >
              <Share />
              <Typography variant="caption">Share</Typography>
            </IconButton>

            <IconButton
              sx={{
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,0,0,0.8)' }
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>

          {/* Comments Panel */}
          {openCommentsId === short.id && (
            <Paper
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: '#1a1a1a',
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                p: 3,
                maxHeight: '60vh',
                overflowY: 'auto',
                zIndex: 10
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  Comments ({commentsMap[short.id]?.length || 0})
                </Typography>
                <IconButton onClick={() => setOpenCommentsId(null)} sx={{ color: 'white' }}>
                  ✕
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      bgcolor: '#333',
                      '& fieldset': { borderColor: '#404040' }
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={() => handleComment(short.id)}
                  sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
                >
                  Post
                </Button>
              </Box>

              {(commentsMap[short.id] || []).map((comment, idx) => (
                <Box key={idx} sx={{ mb: 2, pb: 2, borderBottom: '1px solid #333' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff0000' }}>
                      {comment.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
                      {comment.username}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#909090' }}>
                      {new Date(comment.timestamp).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#ddd', ml: 5 }}>
                    {comment.text}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default Shorts;