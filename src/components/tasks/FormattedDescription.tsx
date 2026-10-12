import React from 'react';
import { Box, Typography } from '@mui/material';
import {
  CheckBox as CheckedIcon,
  CheckBoxOutlineBlank as UncheckedIcon,
} from '@mui/icons-material';

interface FormattedDescriptionProps {
  content: string;
}

export const FormattedDescription: React.FC<FormattedDescriptionProps> = ({ content }) => {
  if (!content || !content.trim()) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Nenhuma descrição informada. Use o editor para adicionar tópicos ou parágrafos.
      </Typography>
    );
  }

  // Check if content is HTML from Quill (e.g. contains <p>, <ul>, <ol>, <strong>, etc.)
  const isHtml = /<[a-z][\s\S]*>/i.test(content);

  if (isHtml) {
    return (
      <Box
        sx={{
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: '#1E293B',
          '& p': {
            mb: 1,
            '&:last-child': { mb: 0 },
          },
          '& ul': {
            pl: 2.5,
            mb: 1,
            listStyleType: 'disc',
            '& li': {
              mb: 0.5,
              '&::marker': {
                color: '#B8860B',
              },
            },
          },
          '& ol': {
            pl: 2.5,
            mb: 1,
            listStyleType: 'decimal',
            '& li': {
              mb: 0.5,
              '&::marker': {
                color: '#B8860B',
                fontWeight: 700,
              },
            },
          },
          '& h1, & h2, & h3': {
            fontWeight: 800,
            color: '#0F172A',
            mt: 1.5,
            mb: 0.5,
          },
          '& blockquote': {
            borderLeft: '3px solid #B8860B',
            pl: 1.5,
            py: 0.5,
            my: 1,
            color: '#64748B',
            fontStyle: 'italic',
            bgcolor: '#F9F5EC',
            borderRadius: '0 6px 6px 0',
          },
          '& pre, & code': {
            bgcolor: '#F1F5F9',
            p: 0.5,
            borderRadius: 1,
            fontSize: '0.85rem',
            fontFamily: 'monospace',
          },
          '& strong': {
            fontWeight: 700,
            color: '#0F172A',
          },
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback for markdown/plain text format
  const paragraphs = content.split(/\n\s*\n/);

  const renderInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#0F172A', fontWeight: 700 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 0.5 }}>
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split('\n');

        return (
          <Box key={pIdx}>
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();

              if (trimmed.startsWith('### ')) {
                return (
                  <Typography
                    key={lIdx}
                    variant="subtitle2"
                    sx={{ fontWeight: 800, color: 'text.primary', mt: 1, mb: 0.5 }}
                  >
                    {trimmed.replace(/^###\s+/, '')}
                  </Typography>
                );
              }

              if (trimmed.startsWith('[ ] ') || trimmed.startsWith('[x] ') || trimmed.startsWith('[X] ')) {
                const isChecked = trimmed.startsWith('[x] ') || trimmed.startsWith('[X] ');
                const text = trimmed.slice(4);

                return (
                  <Box key={lIdx} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.3 }}>
                    {isChecked ? (
                      <CheckedIcon sx={{ fontSize: '1.1rem', color: '#16A34A' }} />
                    ) : (
                      <UncheckedIcon sx={{ fontSize: '1.1rem', color: '#94A3B8' }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{
                        textDecoration: isChecked ? 'line-through' : 'none',
                        color: isChecked ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {renderInlineStyles(text)}
                    </Typography>
                  </Box>
                );
              }

              if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                const text = trimmed.replace(/^[•\-*]\s+/, '');
                return (
                  <Box key={lIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.2, py: 0.2, pl: 0.5 }}>
                    <Box
                      sx={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        mt: '7px',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                      {renderInlineStyles(text)}
                    </Typography>
                  </Box>
                );
              }

              const numberedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
              if (numberedMatch) {
                const num = numberedMatch[1];
                const text = numberedMatch[2];
                return (
                  <Box key={lIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, py: 0.2, pl: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main', minWidth: 18 }}>
                      {num}.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
                      {renderInlineStyles(text)}
                    </Typography>
                  </Box>
                );
              }

              return (
                <Typography key={lIdx} variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                  {renderInlineStyles(line)}
                </Typography>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
};
