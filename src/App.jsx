import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, IconButton, Typography, InputBase, Avatar, Badge, Drawer, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import VideoCall from '@mui/icons-material/VideoCall';
import Notifications from '@mui/icons-material/Notifications';
import Home from '@mui/icons-material/Home';
import Whatshot from '@mui/icons-material/Whatshot';
import Subscriptions from '@mui/icons-material/Subscriptions';
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import HistoryIcon from '@mui/icons-material/History';
import { BrowserRouter as Router, Switch, Route, useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import pages
import Browse from './Browse';
import Shorts from './Shorts';
import Upload from './Upload';

// Simple pages for now
const SubscriptionsPage = () => <Box sx={{ color: 'white', p: 3 }}>Subscriptions</Box>;
const Library = () => <Box sx={{ color: 'white', p: 3 }}>Library</Box>;
const HistoryPage = () => <Box sx={{ color: 'white', p: 3 }}>History</Box>;

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#ff0000' },
    background: { default: '#0f0f0f', paper: '#1a1a1a' },
  },
});

// Styled search bar
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '40px',
  backgroundColor: '#121212',
  border: '1px solid #303030',
  '&:hover': { border: '1px solid #ff0000' },
  marginRight: theme.spacing(2),
  width: '100%',
  [theme.breakpoints.up('sm')]: { marginLeft: theme.spacing(3), width: 'auto' },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  color: '#909090',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'white',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
    [theme.breakpoints.up('md')]: { width: '40ch' },
  },
}));

const drawerWidth = 240;

function App() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const history = useHistory();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      history.push(`/search?q=${searchQuery}`);
    }
  };

  const drawer = (
    <Box sx={{ bgcolor: '#0f0f0f', height: '100%', color: 'white' }}>
      <Toolbar>
        <Typography variant="h6" sx={{ color: '#ff0000', fontWeight: 'bold' }}>YouTube</Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: '#303030' }} />
      <List>
        {[
          { text: 'Home', icon: <Home />, path: '/' },
          { text: 'Shorts', icon: <Whatshot />, path: '/shorts' },
          { text: 'Subscriptions', icon: <Subscriptions />, path: '/subscriptions' },
        ].map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => { history.push(item.path); setMobileOpen(false); }}
            sx={{ '&:hover': { bgcolor: '#303030' } }}
          >
            <ListItemIcon sx={{ color: '#909090' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: 'white' }} />
          </ListItem>
        ))}
      </List>
      <Divider sx={{ bgcolor: '#303030' }} />
      <List>
        {[
          { text: 'Library', icon: <VideoLibrary />, path: '/library' },
          { text: 'History', icon: <HistoryIcon />, path: '/history' },
        ].map((item) => (
          <ListItem 
            button 
            key={item.text}
            onClick={() => { history.push(item.path); setMobileOpen(false); }}
            sx={{ '&:hover': { bgcolor: '#303030' } }}
          >
            <ListItemIcon sx={{ color: '#909090' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: 'white' }} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
      
      <Box sx={{ display: 'flex', bgcolor: '#0f0f0f', minHeight: '100vh' }}>
        <AppBar position="fixed" sx={{ bgcolor: '#0f0f0f', borderBottom: '1px solid #303030' }}>
          <Toolbar>
            <IconButton color="inherit" onClick={handleDrawerToggle} sx={{ mr: 2, color: 'white' }}>
              <MenuIcon />
            </IconButton>
            
            <Typography
              variant="h6"
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                color: '#ff0000',
                fontWeight: 'bold',
                fontSize: '1.5rem',
                cursor: 'pointer'
              }}
              onClick={() => history.push('/')}
            >
              YouTube
            </Typography>

            <form onSubmit={handleSearch} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Search>
                <SearchIconWrapper><SearchIcon /></SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Search>
            </form>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }} onClick={() => history.push('/upload')}>
                <VideoCall />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Badge badgeContent={4} color="error"><Notifications /></Badge>
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff0000' }}>U</Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#0f0f0f' },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                width: drawerWidth,
                bgcolor: '#0f0f0f',
                top: '64px',
                height: 'calc(100vh - 64px)'
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: '64px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={history.location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Switch>
                <Route exact path="/" component={Browse} />
                <Route exact path="/shorts" component={Shorts} />
                <Route exact path="/upload" component={Upload} />
                <Route exact path="/subscriptions" component={SubscriptionsPage} />
                <Route exact path="/library" component={Library} />
                <Route exact path="/history" component={HistoryPage} />
                <Route path="/search" render={(props) => <Browse {...props} searchQuery={searchQuery} />} />
              </Switch>
            </motion.div>
          </AnimatePresence>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default function WrappedApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}