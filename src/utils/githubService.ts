import axios from 'axios';

export interface GithubContents {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url: string | null;
  html_url: string;
}

export interface YaraRule {
  name: string;
  path: string;
  content: string;
  html_url: string;
}

export interface RepoConfig {
  owner: string;
  repo: string;
  defaultPath: string;
  description: string;
  type: 'malware' | 'apt' | 'general';
}

// Organized YARA rule repositories by their primary purpose
const GITHUB_CONFIGS: RepoConfig[] = [
  {
    owner: 'DidierStevens',
    repo: 'DidierStevensSuite',
    defaultPath: '.',
    description: 'Didierstevenssuite repository',
    type: 'general'
  },
  {
    owner: 'Neo23x0',
    repo: 'signature-base',
    defaultPath: 'yara',
    description: 'Signature base repository',
    type: 'general'
  },
  {
    owner: 'Yara-Rules',
    repo: 'rules',
    defaultPath: 'malware',
    description: 'Rules repository',
    type: 'general'
  },
  {
    owner: 'reversinglabs',
    repo: 'reversinglabs-yara-rules',
    defaultPath: '.',
    description: 'ReversingLabs YARA rules',
    type: 'general'
  }
  //{
  //  owner: 'NAME',
  //  repo: 'REPONAME',
  //  defaultPath: '.',
  //  description: 'Short description',
  //  type: 'general'
  //}
];

// Get all repository configurations
export const getRepoConfigs = () => GITHUB_CONFIGS;

// Get repositories by type
export const getReposByType = (type: RepoConfig['type']) => 
  GITHUB_CONFIGS.filter(config => config.type === type);

// GitHub API configuration
// Initialize without token, can be updated later
const axiosInstance = axios.create({
  baseURL: 'https://api.github.com',
  timeout: 30000,
  headers: {
    'Accept': 'application/vnd.github.v3+json'
  }
});

// Function to update token if needed
export const updateGithubToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `token ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryOperation = async <T>(
  operation: () => Promise<T>,
  retries = 5, // Increased retries
  delayMs = 2000 // Increased initial delay
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    if (retries === 0) throw error;
    
    // Handle rate limiting and secondary rate limits
    if (axios.isAxiosError(error) && (error.response?.status === 403 || error.response?.status === 429)) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      const retryAfter = error.response.headers['retry-after'];
      
      if (resetTime) {
        const waitTime = (parseInt(resetTime) * 1000) - Date.now();
        if (waitTime > 0) {
          await delay(Math.min(waitTime, 120000)); // Wait up to 2 minutes
          return retryOperation(operation, retries, delayMs);
        }
      } else if (retryAfter) {
        await delay(parseInt(retryAfter) * 1000);
        return retryOperation(operation, retries, delayMs);
      }
    }
    
    await delay(delayMs);
    return retryOperation(operation, retries - 1, delayMs * 2);
  }
};

export const fetchDirectoryContents = async (
  owner: string, 
  repo: string, 
  path: string,
  maxRetries = 3
): Promise<GithubContents[]> => {
  try {
    // Handle '.' path and clean any leading/trailing slashes
    const cleanPath = path === '.' ? '' : path.replace(/^\/+|\/+$/g, '');
    const url = `https://api.github.com/repos/${owner}/${repo}/contents${cleanPath ? `/${cleanPath}` : ''}`;
    const response = await retryOperation(() => axiosInstance.get<GithubContents[]>(url));
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
    if (status === 403 || status === 429) {
      const remaining = error.response?.headers['x-ratelimit-remaining'];
      const resetTime = error.response?.headers['x-ratelimit-reset'];
      const retryAfter = error.response?.headers['retry-after'];
      
      let message = 'GitHub API rate limit exceeded. ';
      if (!axiosInstance.defaults.headers.common['Authorization']) {
        message += 'Add a GitHub token to increase rate limits.';
      } else if (remaining === '0' && resetTime) {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        message += `Rate limit resets at: ${resetDate.toLocaleTimeString()}`;
      } else if (retryAfter) {
        message += `Please try again in ${retryAfter} seconds.`;
      }
      throw new Error(message);
    }
    if (status === 404) {
      throw new Error(`Repository path not found: ${owner}/${repo}/${path}`);
    }
    if (status === 401 && axiosInstance.defaults.headers.common['Authorization']) {
      throw new Error('Invalid GitHub token. Please check your token configuration.');
    }
    }
    console.error('Error fetching directory contents:', error);
    return [];
  }
};

export const fetchYaraRules = async (owner: string, repo: string, path: string): Promise<YaraRule[]> => {
  try {
    const contents = await fetchDirectoryContents(owner, repo, path);
    const yaraFiles = contents.filter(item => 
      item.type === 'file' && (item.name.endsWith('.yar') || item.name.endsWith('.yara'))
    );
    
    if (yaraFiles.length === 0) {
      throw new Error(`No YARA rules found in ${owner}/${repo}/${path}`);
    }

    const allRules = await Promise.all(
      yaraFiles.map(async file => {
        try {
          const response = await retryOperation(() => axiosInstance.get<string>(file.download_url!));
          return {
            name: file.name.replace(/\.(yar|yara)$/, ''),
            path: `${owner}/${repo}/${file.path}`,
            content: response.data,
            html_url: file.html_url
          };
        } catch (error: unknown) {
          console.error(`Error fetching rule ${file.name}:`, error);
          return null;
        }
      })
    );

    const validRules = allRules.filter((rule): rule is YaraRule => rule !== null);
    
    if (validRules.length === 0) {
      throw new Error('Failed to fetch any YARA rules. Please try again later.');
    }

    return validRules;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Preserve custom error messages
    }
    console.error('Error fetching YARA rules:', error);
    throw new Error('Failed to fetch YARA rules. Please try again later.');
  }
};
