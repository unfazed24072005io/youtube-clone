import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { History, WatchLater, PlaylistPlay, ThumbUp } from '@mui/icons-material';

const Library = () => {
  const sections = [
    { icon: <History />, text: 'History', count: 12 },
    { icon: <WatchLater />, text: 'Watch Later', count: 5 },
    { icon: <PlaylistPlay />, text: 'Playlists', count: 3 },
    { icon: <ThumbUp />, text: 'Liked Videos', count: 24 },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        Library
      </Typography>
      <Paper sx={{ bgcolor: '#1a1a1a' }}>
        <List>
          {sections.map((section, index) => (
            <ListItem button key={index} sx={{ '&:hover': { bgcolor: '#303030' } }}>
              <ListItemIcon sx={{ color: '#ff0000' }}>{section.icon}</ListItemIcon>
              <ListItemText 
                primary={section.text} 
                secondary={`${section.count} items`}
                sx={{
                  '& .MuiListItemText-primary': { color: 'white' },
                  '& .MuiListItemText-secondary': { color: '#909090' }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Library;