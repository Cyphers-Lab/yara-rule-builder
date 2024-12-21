import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          YARA Rule Builder
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button 
          color="inherit" 
          onClick={() => navigate('/')}
        >
          Home
        </Button>
        <Button 
          color="inherit" 
          onClick={() => navigate('/builder')}
        >
          Rule Builder
        </Button>
        <Button 
          color="inherit" 
          onClick={() => navigate('/repository')}
        >
          Repository
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
