import { Typography, Button, Paper, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h1" component="h1" gutterBottom align="center">
        YARA Rule Builder
      </Typography>
      
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          What is YARA?
        </Typography>
        <Typography paragraph>
          YARA is a powerful tool designed to help malware researchers identify and classify malware samples. 
          Created by Victor M. Alvarez while working at VirusTotal, YARA provides a way to create descriptions 
          of malware families based on textual or binary patterns.
        </Typography>
        <Typography paragraph>
          Think of YARA rules as the malware researcher's Swiss Army knife - they allow you to create complex 
          patterns to match against files, making it possible to identify specific malware families or detect 
          certain suspicious patterns across files.
        </Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h2" gutterBottom>
          Use Cases
        </Typography>
        <Typography component="div">
          <ul>
            <li>Malware classification and detection</li>
            <li>Threat hunting and incident response</li>
            <li>File type identification</li>
            <li>Detection of suspicious patterns in files</li>
            <li>Automated malware analysis</li>
          </ul>
        </Typography>
      </Paper>

      <Box sx={{ textAlign: 'center', mt: 4 }}>
        <Button 
          variant="contained" 
          size="large" 
          onClick={() => navigate('/builder')}
          sx={{ minWidth: 200 }}
        >
          Start Building Rules
        </Button>
      </Box>
    </Box>
  );
};

export default HomePage;
