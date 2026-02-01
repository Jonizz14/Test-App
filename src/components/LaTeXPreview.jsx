import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

// Error boundary for LaTeX components
class LaTeXErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <span>{this.props.fallback}</span>;
    }
    return this.props.children;
  }
}

// Safe inline math component
const SafeInlineMath = ({ math, fallback }) => (
  <LaTeXErrorBoundary fallback={fallback}>
    <InlineMath math={math} />
  </LaTeXErrorBoundary>
);

// Safe block math component
const SafeBlockMath = ({ math, fallback }) => (
  <LaTeXErrorBoundary fallback={fallback}>
    <BlockMath math={math} />
  </LaTeXErrorBoundary>
);

const LaTeXPreview = ({ text, sx = {} }) => {
  // Memoized parsed content to avoid recomputation
  const parsedContent = useMemo(() => {
    if (!text || text.trim() === '') {
      return { type: 'empty' };
    }

    // Check if text contains LaTeX (starts and ends with $ or contains LaTeX commands)
    const hasLaTeX = text.includes('$') || text.includes('\\') || /[{}[\]]/.test(text);

    if (!hasLaTeX) {
      return { type: 'plain', content: text };
    }

    // Handle inline math: $...$
    if (text.includes('$') && !text.includes('$$')) {
      const parts = text.split('$');
      return {
        type: 'inline',
        parts: parts.map((part, index) => ({
          isLatex: index % 2 === 1,
          content: part,
          key: index
        }))
      };
    }

    // Handle block math: $$...$$
    if (text.includes('$$')) {
      const parts = text.split('$$');
      return {
        type: 'block',
        parts: parts.map((part, index) => ({
          isLatex: index % 2 === 1,
          content: part,
          key: index
        }))
      };
    }

    // Treat as inline LaTeX if it contains LaTeX commands
    if (text.includes('\\') || /[{}[\]]/.test(text)) {
      return { type: 'latex-only', content: text };
    }

    // Fallback
    return { type: 'plain', content: text };
  }, [text]);

  // Render based on parsed content type
  if (parsedContent.type === 'empty') {
    return null;
  }

  if (parsedContent.type === 'plain') {
    return (
      <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', ...sx }}>
        {parsedContent.content}
      </Typography>
    );
  }

  if (parsedContent.type === 'inline') {
    return (
      <Box sx={sx}>
        {parsedContent.parts.map((part) =>
          part.isLatex ? (
            <SafeInlineMath key={part.key} math={part.content} fallback={part.content} />
          ) : (
            <span key={part.key}>{part.content}</span>
          )
        )}
      </Box>
    );
  }

  if (parsedContent.type === 'block') {
    return (
      <Box sx={sx}>
        {parsedContent.parts.map((part) =>
          part.isLatex ? (
            <Box key={part.key} sx={{ my: 1 }}>
              <SafeBlockMath math={part.content} fallback={part.content} />
            </Box>
          ) : (
            <span key={part.key}>{part.content}</span>
          )
        )}
      </Box>
    );
  }

  if (parsedContent.type === 'latex-only') {
    return (
      <Box sx={sx}>
        <SafeInlineMath math={parsedContent.content} fallback={parsedContent.content} />
      </Box>
    );
  }

  // Fallback (shouldn't reach here)
  return (
    <Typography variant="body2" sx={{ color: '#64748b', fontStyle: 'italic', ...sx }}>
      {text}
    </Typography>
  );
};

export default LaTeXPreview;