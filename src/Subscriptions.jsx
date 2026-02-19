import React from 'react';
import { Box, Typography, Grid, Paper, Avatar, Button } from '@mui/material';

const Subscriptions = () => {
  const channels = [
    { name: 'Tech Channel', subscribers: '1.2M', avatar: 'T' },
    { name: 'Gaming Hub', subscribers: '850K', avatar: 'G' },
    { name: 'Music Lab', subscribers: '2.1M', avatar: 'M' },
    { name: 'News Daily', subscribers: '3.4M', avatar: 'N' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        Subscriptions
      </Typography>
      <Grid container spacing={2}>
        {channels.map((channel, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Paper sx={{ p: 3, bgcolor: '#1a1a1a', textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#ff0000', fontSize: 32, mx: 'auto', mb: 2 }}>
                {channel.avatar}
              </Avatar>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                {channel.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#909090', mb: 2 }}>
                {channel.subscribers} subscribers
              </Typography>
              <Button 
                variant="contained" 
                fullWidth
                sx={{ bgcolor: '#ff0000', '&:hover': { bgcolor: '#cc0000' } }}
              >
                Subscribed
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Subscriptions;