import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

const LaTeXPreview = ({ text, variant = 'inline', sx = {} }) => {
  if (!text || text.trim() === '') {
    return null;
  }

  // Check if text contains LaTeX (starts and ends with $ or contains LaTeX commands)
  const hasLaTeX = text.includes('$') || text.includes('\\') || /[{}[\]]/.test(text);

  if (!hasLaTeX) {
    return (
      <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', ...sx }}>
        {text}
      </Typography>
    );
  }

  try {
    // Extract LaTeX content from $ delimiters or treat whole text as LaTeX
    let latexContent = text;

    // Handle inline math: $...$
    if (text.includes('$')) {
      const parts = text.split('$');
      return (
        <Box sx={sx}>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              // Odd indices are LaTeX content
              try {
                return (
                  <InlineMath key={index} math={part} />
                );
              } catch (error) {
                return <span key={index}>{part}</span>;
              }
            } else {
              // Even indices are regular text
              return <span key={index}>{part}</span>;
            }
          })}
        </Box>
      );
    }

    // Handle block math: $$...$$ or just LaTeX commands
    if (text.includes('$$')) {
      const parts = text.split('$$');
      return (
        <Box sx={sx}>
          {parts.map((part, index) => {
            if (index % 2 === 1) {
              // Odd indices are LaTeX content
              try {
                return (
                  <Box key={index} sx={{ my: 1 }}>
                    <BlockMath math={part} />
                  </Box>
                );
              } catch (error) {
                return <span key={index}>{part}</span>;
              }
            } else {
              // Even indices are regular text
              return <span key={index}>{part}</span>;
            }
          })}
        </Box>
      );
    }

    // Treat as inline LaTeX if it contains LaTeX commands
    if (text.includes('\\') || /[{}[\]]/.test(text)) {
      try {
        return (
          <Box sx={sx}>
            <InlineMath math={text} />
          </Box>
        );
      } catch (error) {
        return (
          <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', ...sx }}>
            {text}
          </Typography>
        );
      }
    }

    // Fallback to regular text
    return (
      <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', ...sx }}>
        {text}
      </Typography>
    );

  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return (
      <Typography variant="body2" sx={{ color: '#ef4444', fontStyle: 'italic', ...sx }}>
        LaTeX xatolik: {text}
      </Typography>
    );
  }
};

export default LaTeXPreview;