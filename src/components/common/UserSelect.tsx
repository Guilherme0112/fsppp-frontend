import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material';
import { boardService } from '../../services/boardService';
import { avatarColor, getInitials } from '../../utils/avatar';

export interface ShareUser {
  id: number;
  nome: string;
  email?: string;
}

interface UserSelectProps {
  value: ShareUser | null;
  onChange: (user: ShareUser | null) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Async autocomplete used to pick a user to share a board/card with.
 * Options are fetched from the backend (debounced) instead of loaded once,
 * so the list stays accurate no matter how many users exist.
 */
export const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  label = 'Usuário',
  placeholder = 'Digite o nome ou o e-mail do usuário...',
}) => {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<ShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const fetchOptions = useCallback(async (search: string) => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await boardService.listShareUsers(
        1,
        20,
        search.trim() === '' ? undefined : search.trim()
      );
      if (requestId === requestIdRef.current) {
        setOptions(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setOptions([]);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Debounce server-side search as the user types (and when the dropdown opens)
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = window.setTimeout(() => {
      void fetchOptions(inputValue);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [inputValue, open, fetchOptions]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      value={value}
      inputValue={inputValue}
      onInputChange={(_event, newInputValue) => setInputValue(newInputValue)}
      onChange={(_event, newValue) => {
        onChange(newValue);
        setOpen(false);
      }}
      getOptionLabel={(option) => option.nome}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      filterOptions={(currentOptions) => currentOptions}
      noOptionsText={loading ? 'Carregando...' : 'Nenhum usuário encontrado'}
      loadingText="Carregando usuários..."
      fullWidth
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 700,
                bgcolor: avatarColor(option.email || option.nome),
              }}
            >
              {getInitials(option.nome)}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                {option.nome}
              </Typography>
              {option.email && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ display: 'block' }}
                >
                  {option.email}
                </Typography>
              )}
            </Box>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size="small"
          fullWidth
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {loading && <CircularProgress size={18} sx={{ mr: 0.5 }} />}
                  {params.slotProps.input.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};
