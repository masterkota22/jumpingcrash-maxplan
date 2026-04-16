import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import HomeIcon from '@mui/icons-material/Home';
import TimerIcon from '@mui/icons-material/Timer';
import BarChartIcon from '@mui/icons-material/BarChart';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const NAV_ITEMS = [
  { label: '홈', icon: <HomeIcon />, path: '/' },
  { label: '측정', icon: <TimerIcon />, path: '/measure' },
  { label: '기록', icon: <BarChartIcon />, path: '/records' },
  { label: '순위', icon: <LeaderboardIcon />, path: '/ranking/school' },
  { label: '대회', icon: <EmojiEventsIcon />, path: '/competition' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Derive tab from current URL (fixes back-navigation desync)
  const currentTab = NAV_ITEMS.findIndex((item) => item.path === location.pathname);
  const tabValue = currentTab >= 0 ? currentTab : false;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            점핑크래쉬
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/profile')}>
            <AccountCircleIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flex: 1, pb: '72px' }}>
        <Outlet />
      </Box>

      <Paper
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
        elevation={3}
      >
        <BottomNavigation
          value={tabValue}
          onChange={(_, newValue) => {
            navigate(NAV_ITEMS[newValue].path);
          }}
          showLabels
          sx={{ '& .MuiBottomNavigationAction-label': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}
        >
          {NAV_ITEMS.map((item) => (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={item.icon}
              sx={{ minWidth: 0, px: { xs: 0.5, sm: 1 } }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
}
