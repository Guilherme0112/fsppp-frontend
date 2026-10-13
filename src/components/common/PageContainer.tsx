import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: number;
  disableMaxWidth?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Standard width constraint for app views (board selection, users, etc).
 * Views that need the full viewport width (e.g. the Trello-style board canvas
 * with horizontal scroll) should pass `disableMaxWidth`.
 */
export const PAGE_MAX_WIDTH = 1200;

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  maxWidth = PAGE_MAX_WIDTH,
  disableMaxWidth = false,
  sx,
}) => {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: disableMaxWidth ? 'none' : maxWidth,
        mx: 'auto',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};
