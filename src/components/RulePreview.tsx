import { Paper, Box, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';

interface RulePreviewProps {
  ruleContent: string;
  onCopy: () => void;
  onDownload: () => void;
}

const RulePreview = ({ ruleContent, onCopy, onDownload }: RulePreviewProps) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        position: 'relative',
        '& pre': {
          margin: 0,
          borderRadius: 1,
          maxHeight: '400px',
          overflow: 'auto'
        }
      }}
    >
      <Box sx={{ 
        position: 'absolute', 
        right: 8, 
        top: 8, 
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 1,
        padding: '4px'
      }}>
        <Tooltip title="Copy to clipboard">
          <IconButton size="small" onClick={onCopy} sx={{ color: 'white', mr: 1 }}>
            <ContentCopyIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download .yar file">
          <IconButton size="small" onClick={onDownload} sx={{ color: 'white' }}>
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <SyntaxHighlighter
        language="python"
        style={vs2015}
        customStyle={{
          padding: '24px'
        }}
      >
        {ruleContent}
      </SyntaxHighlighter>
    </Paper>
  );
};

export default RulePreview;
