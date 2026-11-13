import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField, CircularProgress } from '@mui/material';
import { boardService } from '../../services/boardService';

export interface ShareUser {
  id: number;
  nome: string;
}

interface UserAutocompleteProps {
  value: ShareUser | null;
  onChange: (user: ShareUser | null) => void;
  label?: string;
  placeholder?: string;
}

export const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  value,
  onChange,
  label = 'Usuário',
  placeholder = 'Digite para buscar...',
}) => {
  const [options, setOptions] = useState<ShareUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await boardService.listShareUsers(1, 10, searchTerm);
        if (active) {
          let list: ShareUser[] = [];
          if (Array.isArray(res)) {
            list = res;
          } else if (res && Array.isArray((res as any).data)) {
            list = (res as any).data;
          }
          setOptions(list);
        }
      } catch (err) {
        console.error('Erro ao listar usuários para compartilhamento:', err);
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, item) => String(option?.id) === String(item?.id)}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option?.nome || '';
      }}
      options={options}
      loading={loading}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      onInputChange={(_, value, reason) => {
        if (reason === 'input' || reason === 'clear') {
          setSearchTerm(value);
          setOpen(true);
        }
      }}
      filterOptions={(x) => x}
      noOptionsText={loading ? 'Carregando...' : 'Nenhum usuário encontrado'}
      loadingText="Carregando..."
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <li key={option.id} {...otherProps}>
            {option.nome}
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          fullWidth
          slotProps={{
            input: {
              ...(params as any).InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {(params as any).InputProps?.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
    />
  );
};
