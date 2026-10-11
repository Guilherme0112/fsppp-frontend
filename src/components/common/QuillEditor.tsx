import React, { useEffect, useRef } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { Box } from '@mui/material';

interface QuillEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: number | string;
}

export const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escreva a descrição detalhada com tópicos, parágrafos, listas...',
  minHeight = 160,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const quillRef = useRef<Quill | null>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous child nodes if re-rendered
    containerRef.current.innerHTML = '';

    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
          ['blockquote', 'code-block'],
          [{ color: [] }, { background: [] }],
          ['clean'],
        ],
      },
    });

    quillRef.current = quill;

    // Set initial value
    if (value) {
      quill.root.innerHTML = value;
    }

    // Listen to text change
    quill.on('text-change', () => {
      if (isUpdatingRef.current) return;
      const html = quill.root.innerHTML;
      // If empty quill editor (`<p><br></p>`), treat as empty string
      if (html === '<p><br></p>') {
        onChange('');
      } else {
        onChange(html);
      }
    });

    return () => {
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []); // Run on mount

  // Sync external value changes
  useEffect(() => {
    if (!quillRef.current) return;
    const currentHtml = quillRef.current.root.innerHTML;
    const normalizedValue = value || '<p><br></p>';

    if (currentHtml !== value && currentHtml !== normalizedValue) {
      isUpdatingRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isUpdatingRef.current = false;
    }
  }, [value]);

  return (
    <Box
      sx={{
        border: '1px solid #E2E8F0',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#FFFFFF',
        '& .ql-toolbar': {
          border: 'none !important',
          borderBottom: '1px solid #E2E8F0 !important',
          bgcolor: '#F8FAFC',
          px: 1.5,
          py: 1,
        },
        '& .ql-container': {
          border: 'none !important',
          fontSize: '0.9rem',
          fontFamily: 'inherit',
          minHeight,
        },
        '& .ql-editor': {
          minHeight,
          lineHeight: 1.6,
          '&.ql-blank::before': {
            fontStyle: 'normal',
            color: '#94A3B8',
          },
          '& ul': {
            paddingLeft: '1.5rem',
            '& li': {
              mb: 0.5,
            },
          },
          '& ol': {
            paddingLeft: '1.5rem',
            '& li': {
              mb: 0.5,
            },
          },
          '& p': {
            mb: 1,
          },
        },
      }}
    >
      <div ref={containerRef} />
    </Box>
  );
};
