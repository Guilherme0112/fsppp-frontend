import React from 'react';
import { Box, Card, Skeleton, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  compact?: boolean;
}

/**
 * Small summary card used by the module dashboards (users, boards, purchase requests).
 * `compact` keeps the same visual language while taking less vertical space on dense screens.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color,
  loading = false,
  compact = false,
}) => (
  <Card
    elevation={0}
    sx={{
      p: compact ? 1.5 : 2,
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      display: 'flex',
      alignItems: 'center',
      gap: compact ? 1.25 : 1.5,
      minWidth: 0,
    }}
  >
    <Box
      sx={{
        width: compact ? 36 : 42,
        height: compact ? 36 : 42,
        borderRadius: 2,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        bgcolor: `${color}18`,
        '& svg': { fontSize: compact ? 20 : 24 },
      }}
    >
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'block',
          lineHeight: 1.2,
          fontSize: compact ? '0.65rem' : undefined,
        }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={36} height={compact ? 24 : 32} />
      ) : (
        <Typography
          variant={compact ? 'h6' : 'h5'}
          sx={{ fontWeight: 800, lineHeight: 1.2 }}
        >
          {value}
        </Typography>
      )}
    </Box>
  </Card>
);
