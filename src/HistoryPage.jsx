import React from 'react';
import { Box, Typography, List, ListItem, ListItemAvatar, Avatar, ListItemText, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';

const HistoryPage = () => {
  const history = [
    { title: 'Video 1', channel: 'Channel 1', watched: '2 hours ago', thumbnail: 'V1' },
    { title: 'Video 2', channel: 'Channel 2', watched: '5 hours ago', thumbnail: 'V2' },
    { title: 'Video 3', channel: 'Channel 3', watched: '1 day ago', thumbnail: 'V3' },
  ];

  return (
    <Box>
      <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 600 }}>
        History
      </Typography>
      <List>
        {history.map((item, index) => (
          <ListItem 
            key={index}
            secondaryAction={
              <IconButton edge="end" sx={{ color: '#909090' }}>
                <Delete />
              </IconButton>
            }
            sx={{ '&:hover': { bgcolor: '#1a1a1a' } }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: '#ff0000', width: 60, height: 40, borderRadius: 1 }}>
                {item.thumbnail}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={item.title}
              secondary={`${item.channel} • ${item.watched}`}
              sx={{
                '& .MuiListItemText-primary': { color: 'white' },
                '& .MuiListItemText-secondary': { color: '#909090' }
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default HistoryPage;