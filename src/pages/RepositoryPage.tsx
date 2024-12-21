import React, { useState, useEffect } from 'react';
import { fetchYaraRules, YaraRule, getRepoConfigs, RepoConfig, updateGithubToken } from '../utils/githubService';
import { Box, Typography, TextField, Card, CardContent, Button, CircularProgress, InputAdornment, Select, MenuItem, FormControl, InputLabel, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FolderIcon from '@mui/icons-material/Folder';
import StorageIcon from '@mui/icons-material/Storage';

export const RepositoryPage: React.FC = () => {
  const [rules, setRules] = useState<YaraRule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepoConfig>(getRepoConfigs()[0]);
  const [path, setPath] = useState(getRepoConfigs()[0].defaultPath);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [githubToken, setGithubToken] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadRules = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        setError(null);
        
        // Update GitHub token if provided
        updateGithubToken(githubToken || null);
        
        const fetchedRules = await fetchYaraRules(selectedRepo.owner, selectedRepo.repo, path);
        
        if (!isMounted) return;
        setRules(fetchedRules);
        setRetryAttempt(0); // Reset retry count on successful load
      } catch (err) {
        if (!isMounted) return;
        if (err instanceof Error) {
          setError(err.message);
          // If it's a rate limit error, increment retry count
          if (err.message.includes('rate limit')) {
            setRetryAttempt(prev => prev + 1);
          }
        } else {
          setError('Failed to load YARA rules. Please try again later.');
        }
        setRules([]); // Clear rules on error
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRules();
    return () => { isMounted = false; };
  }, [selectedRepo, path, retryAttempt, githubToken]); // Added githubToken to dependencies

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImport = (rule: YaraRule) => {
    // Navigate to builder page with the selected rule
    navigate('/builder', { state: { importedRule: rule } });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        YARA Rule Repository Browser
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel>Repository</InputLabel>
          <Select
            value={`${selectedRepo.owner}/${selectedRepo.repo}`}
            label="Repository"
            onChange={(e) => {
              const [owner, repo] = e.target.value.split('/');
              const newRepo = getRepoConfigs().find(r => r.owner === owner && r.repo === repo)!;
              setSelectedRepo(newRepo);
              setPath(newRepo.defaultPath);
            }}
            startAdornment={
              <InputAdornment position="start">
                <StorageIcon />
              </InputAdornment>
            }
          >
            {getRepoConfigs().map((config) => (
              <MenuItem key={`${config.owner}/${config.repo}`} value={`${config.owner}/${config.repo}`}>
                {config.description} ({config.type})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          variant="outlined"
          label="Repository Path"
          value={path}
          onChange={(e) => setPath(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FolderIcon />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          fullWidth
          variant="outlined"
          label="Search Rules"
          value={searchTerm}
          onChange={handleSearch}
        />
      </Box>

      <Box sx={{ mb: 3 }}>
        <Chip 
          label={`Type: ${selectedRepo.type}`}
          color="primary"
          sx={{ mr: 1 }}
        />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Box sx={{ mb: 3, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
          <Typography color="error.dark" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            href={`https://github.com/${selectedRepo.owner}/${selectedRepo.repo}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ mt: 2, mb: error.includes('rate limit') ? 2 : 0 }}
          >
            View Repository on GitHub
          </Button>
          {error.includes('rate limit') && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="GitHub Token"
                type="password"
                value={githubToken}
                onChange={(e) => setGithubToken(e.target.value)}
                placeholder="Enter your GitHub token"
                helperText="Create a token at: https://github.com/settings/tokens (only public repo access needed)"
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => setRetryAttempt(prev => prev + 1)}
              >
                Retry with Token
              </Button>
            </Box>
          )}
          {error.includes('not found') && (
            <Typography variant="body2" color="error.dark" sx={{ mt: 1 }}>
              The specified path was not found in the repository. Try changing the path or selecting a different repository.
            </Typography>
          )}
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        {filteredRules.map((rule, index) => (
          <Card key={index}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {rule.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Repository: {rule.path}
              </Typography>
              <Typography variant="body2" noWrap sx={{ mb: 2 }}>
                {rule.content.split('\n')[0]}...
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleImport(rule)}
                >
                  Import Rule
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  href={rule.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default RepositoryPage;
