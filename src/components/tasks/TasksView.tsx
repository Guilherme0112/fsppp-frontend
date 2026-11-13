import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  ClickAwayListener,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Archive as ArchiveIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as MoveIcon,
  CardGiftcard as EmptyCardIcon,
  Clear as ClearIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  CreditCard as CardIcon,
  Description as DescriptionIcon,
  DragIndicator as DragIndicatorIcon,
  Edit as EditIcon,
  Inbox as EmptyIcon,
  MoreHoriz as MoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Share as ShareIcon,
  ViewColumn as ViewColumnIcon,
  ViewKanban as BoardIcon,
  WarningAmber as WarningIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Task, BoardColumn, Board } from '../../types';
import { taskService } from '../../services/taskService';
import { boardService, SharedUserWithRole } from '../../services/boardService';
import { QuillEditor } from '../common/QuillEditor';
import { PageContainer } from '../common/PageContainer';
import { UserSelect, ShareUser } from '../common/UserSelect';
import { avatarColor, getInitials } from '../../utils/avatar';

const BOARDS_PAGE_SIZE = 9;
const STATUS_PAGE_SIZE = 6;
const BOARD_ACCENTS = ['#B8860B', '#0277BD', '#2E7D32', '#6A1B9A', '#B42318', '#5C3A15'];

type Feedback = {
  severity: 'success' | 'error' | 'info';
  message: string;
};

const boardAccent = (seed: string) => {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return BOARD_ACCENTS[hash % BOARD_ACCENTS.length];
};

const stripHtml = (html?: string) =>
  (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const BoardSelectionSkeleton: React.FC = () => (
  <PageContainer disableMaxWidth>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        mb: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Skeleton variant="rounded" width={48} height={48} />
        <Box>
          <Skeleton width={160} height={32} />
          <Skeleton width={320} height={20} />
        </Box>
      </Box>
      <Skeleton variant="rounded" width={150} height={40} />
    </Box>
    <Skeleton variant="rounded" height={76} sx={{ mb: 2.5 }} />
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(3, minmax(0, 1fr))',
        },
        gap: 2.5,
      }}
    >
      {Array.from({ length: 6 }).map((_, item) => (
        <Skeleton key={item} variant="rounded" height={190} />
      ))}
    </Box>
  </PageContainer>
);

const SharedUsersList: React.FC<{
  loading: boolean;
  users: SharedUserWithRole[];
}> = ({ loading, users }) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2, color: 'text.secondary' }}>
        <CircularProgress size={18} />
        <Typography variant="body2">Carregando usuários...</Typography>
      </Box>
    );
  }

  if (users.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          py: 2,
          px: 1.5,
          borderRadius: 2,
          bgcolor: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          color: 'text.secondary',
        }}
      >
        <EmptyIcon fontSize="small" />
        <Typography variant="body2">Nenhum usuário com acesso além de você.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 190, overflowY: 'auto', pr: 0.5 }}>
      {users.map((usuario) => (
        <Box
          key={usuario.id}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            bgcolor: '#F8FAFC',
            p: 1.25,
            borderRadius: 2,
            border: '1px solid #E2E8F0',
          }}
        >
          <Avatar
            sx={{
              width: 36,
              height: 36,
              bgcolor: avatarColor(usuario.email || usuario.nome),
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            {getInitials(usuario.nome)}
          </Avatar>
          <Box sx={{ minWidth: 0, flexGrow: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {usuario.nome}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {usuario.email}
            </Typography>
          </Box>
          <Chip
            label={usuario.tipo}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }}
          />
        </Box>
      ))}
    </Box>
  );
};

const ArchiveConfirmDialog: React.FC<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}> = ({ open, title, description, confirmLabel = 'Arquivar', loading = false, onClose, onConfirm }) => (
  <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2,
          bgcolor: 'rgba(180, 35, 24, 0.10)',
          color: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <WarningIcon />
      </Box>
      {title}
    </DialogTitle>
    <DialogContent dividers>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
        {description}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button onClick={onClose} disabled={loading}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={18} color="inherit" /> : <ArchiveIcon />
        }
      >
        {loading ? 'Arquivando...' : confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
);

export const TasksView: React.FC = () => {
  const { hasPermission } = useAuth();
  const podeCriarQuadro = hasPermission('quadros.criar');
  const podeEditarQuadro = hasPermission('quadros.editar');
  const podeApagarQuadro = hasPermission('quadros.deletar');
  const podeCriarTarefa = hasPermission('tarefas.criar');
  const podeEditarTarefa = hasPermission('tarefas.editar');
  const podeApagarTarefa = hasPermission('tarefas.deletar');
  const podeGerenciarQuadro = podeEditarQuadro || podeApagarQuadro;

  const {
    boards,
    addBoard,
    editBoard,
    deleteBoard,
    addStatusToBoard,
    editStatus,
    deleteStatus,
    tasks,
    columnHasMore: columnHasMoreFromApi,
    columnTotal,
    addTask,
    editTask,
    moveTaskStatus,
    deleteTask,
    isLoading,
    isMutating,
    activeBoardId,
    setActiveBoardId,
    activeBoard,
    refreshBoards,
    isFetchingBoards,
  } = useApp();

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const notify = (severity: Feedback['severity'], message: string) =>
    setFeedback({ severity, message });

  // Create Board Dialog
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

  // Client-side search over the loaded boards
  const [boardSearch, setBoardSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  // Boards list pagination ("Mostrar mais Quadros")
  const [visibleBoardsCount, setVisibleBoardsCount] = useState(BOARDS_PAGE_SIZE);

  // Status columns pagination within a board ("Mostrar mais status")
  const [visibleColumnsCount, setVisibleColumnsCount] = useState(STATUS_PAGE_SIZE);

  // Archive confirmation targets
  const [archiveBoardTarget, setArchiveBoardTarget] = useState<Board | null>(null);
  const [archiveStatusTarget, setArchiveStatusTarget] = useState<BoardColumn | null>(null);
  const [archiveTaskTarget, setArchiveTaskTarget] = useState<Task | null>(null);

  const normalizedBoardSearch = boardSearch.trim().toLowerCase();
  const filteredBoards = useMemo(
    () =>
      boards.filter((board) => {
        if (!normalizedBoardSearch) return true;
        return (
          board.title.toLowerCase().includes(normalizedBoardSearch) ||
          (board.description || '').toLowerCase().includes(normalizedBoardSearch)
        );
      }),
    [boards, normalizedBoardSearch]
  );

  useEffect(() => {
    setVisibleBoardsCount(BOARDS_PAGE_SIZE);
  }, [normalizedBoardSearch]);

  useEffect(() => {
    setTaskSearch('');
  }, [activeBoardId]);

  // Board 3-dots Menu & Rename Dialog state
  const [boardMenuAnchor, setBoardMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuBoard, setMenuBoard] = useState<Board | null>(null);
  const [renameBoardDialogOpen, setRenameBoardDialogOpen] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState<Board | null>(null);
  const [renameBoardTitle, setRenameBoardTitle] = useState('');
  const [renameBoardDesc, setRenameBoardDesc] = useState('');

  // Share Board Dialog state
  const [shareBoardDialogOpen, setShareBoardDialogOpen] = useState(false);
  const [sharingBoard, setSharingBoard] = useState<Board | null>(null);
  const [selectedUserObj, setSelectedUserObj] = useState<ShareUser | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [sharedBoardUsers, setSharedBoardUsers] = useState<SharedUserWithRole[]>([]);
  const [sharedBoardUsersLoading, setSharedBoardUsersLoading] = useState(false);

  const handleOpenShareBoard = async (board: Board) => {
    setSharingBoard(board);
    setSelectedUserObj(null);
    setShareFeedback(null);
    setShareBoardDialogOpen(true);
    setBoardMenuAnchor(null);
    setMenuBoard(null);
    setSharedBoardUsersLoading(true);
    try {
      const res = await boardService.listSharedUsers(Number(board.id));
      setSharedBoardUsers(Array.isArray(res) ? res : []);
    } catch {
      setSharedBoardUsers([]);
    } finally {
      setSharedBoardUsersLoading(false);
    }
  };

  const handleCloseShareBoard = () => {
    setShareBoardDialogOpen(false);
    setSharingBoard(null);
    setSelectedUserObj(null);
    setShareFeedback(null);
    setSharedBoardUsers([]);
  };

  const handleConfirmShareBoard = async () => {
    if (!sharingBoard || !selectedUserObj) return;
    setShareLoading(true);
    setShareFeedback(null);
    try {
      await boardService.share(Number(sharingBoard.id), Number(selectedUserObj.id));
      setShareFeedback('Quadro compartilhado com sucesso!');
      const res = await boardService.listSharedUsers(Number(sharingBoard.id));
      setSharedBoardUsers(Array.isArray(res) ? res : []);
      setSelectedUserObj(null);
      setTimeout(() => {
        setShareFeedback(null);
      }, 3000);
    } catch (err: any) {
      setShareFeedback(err.message || 'Erro ao compartilhar quadro.');
    } finally {
      setShareLoading(false);
    }
  };

  // Share Card Dialog state
  const [shareCardDialogOpen, setShareCardDialogOpen] = useState(false);
  const [sharingTask, setSharingTask] = useState<Task | null>(null);
  const [shareCardUserObj, setShareCardUserObj] = useState<ShareUser | null>(null);
  const [shareCardLoading, setShareCardLoading] = useState(false);
  const [shareCardFeedback, setShareCardFeedback] = useState<string | null>(null);
  const [sharedCardUsers, setSharedCardUsers] = useState<SharedUserWithRole[]>([]);
  const [sharedCardUsersLoading, setSharedCardUsersLoading] = useState(false);

  const handleOpenShareCard = async (task: Task) => {
    setSharingTask(task);
    setShareCardUserObj(null);
    setShareCardFeedback(null);
    setShareCardDialogOpen(true);
    setSharedCardUsersLoading(true);
    try {
      const res = await taskService.listSharedUsers(Number(task.id));
      setSharedCardUsers(Array.isArray(res) ? res : []);
    } catch {
      setSharedCardUsers([]);
    } finally {
      setSharedCardUsersLoading(false);
    }
  };

  const handleCloseShareCard = () => {
    setShareCardDialogOpen(false);
    setSharingTask(null);
    setShareCardUserObj(null);
    setShareCardFeedback(null);
    setSharedCardUsers([]);
  };

  const handleConfirmShareCard = async () => {
    if (!sharingTask || !shareCardUserObj) return;
    setShareCardLoading(true);
    setShareCardFeedback(null);
    try {
      await taskService.share(Number(sharingTask.id), Number(shareCardUserObj.id));
      setShareCardFeedback('Cartão compartilhado com sucesso!');
      const res = await taskService.listSharedUsers(Number(sharingTask.id));
      setSharedCardUsers(Array.isArray(res) ? res : []);
      setShareCardUserObj(null);
      setTimeout(() => {
        setShareCardFeedback(null);
      }, 3000);
    } catch (err: any) {
      setShareCardFeedback(err.message || 'Erro ao compartilhar cartão.');
    } finally {
      setShareCardLoading(false);
    }
  };

  // Column / Status 3-dots Menu state
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuColumn, setMenuColumn] = useState<BoardColumn | null>(null);

  // Inline "Add List / Status" state
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

  // Inline "Add Card" state (keyed by column id)
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');

  // Edit List / Status Dialog
  const [editStatusDialogOpen, setEditStatusDialogOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<BoardColumn | null>(null);
  const [statusTitle, setStatusTitle] = useState('');

  // Card Detail Modal
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [cardFormTitle, setCardFormTitle] = useState('');
  const [cardFormDesc, setCardFormDesc] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [cardMenuAnchor, setCardMenuAnchor] = useState<null | HTMLElement>(null);
  const [moveMenuAnchor, setMoveMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionsSidebarOpen, setActionsSidebarOpen] = useState(true);

  const isDescEmpty = (html?: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    return stripped.length === 0;
  };

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  // Per-column tasks pagination: fetches more tasks of that status from the backend as the
  // user scrolls to the bottom of a list (each column starts with the 10 most recent tasks).
  const [extraTasksByColumn, setExtraTasksByColumn] = useState<Record<string, Task[]>>({});
  const [columnPage, setColumnPage] = useState<Record<string, number>>({});
  const [columnHasMore, setColumnHasMore] = useState<Record<string, boolean>>({});
  const [columnLoadingMore, setColumnLoadingMore] = useState<Record<string, boolean>>({});

  // The base task list is refetched on board switch and after mutations; discard any
  // extra pages fetched so columns don't show stale or duplicated cards. columnHasMore is
  // seeded from the API's own pagination data (current_page < last_page) rather than guessed.
  useEffect(() => {
    setExtraTasksByColumn({});
    setColumnPage({});
    setColumnHasMore(columnHasMoreFromApi);
  }, [tasks, columnHasMoreFromApi]);

  // Reset the visible status columns whenever the active board changes
  useEffect(() => {
    setVisibleColumnsCount(STATUS_PAGE_SIZE);
  }, [activeBoardId]);

  const fetchMoreTasksForColumn = async (columnId: string) => {
    if (columnLoadingMore[columnId] || columnHasMore[columnId] === false) return;
    const numericStatusId = Number(columnId);
    if (isNaN(numericStatusId)) return;

    const nextPage = (columnPage[columnId] ?? 1) + 1;
    setColumnLoadingMore((prev) => ({ ...prev, [columnId]: true }));
    try {
      const pagina = await taskService.listByStatus(numericStatusId, nextPage);
      const novasTarefas: Task[] = pagina.data.map((t) => ({
        id: String(t.id),
        boardId: String(t.quadro_id),
        columnId: String(t.status_id),
        title: t.nome,
        description: t.descricao || '',
      }));
      setExtraTasksByColumn((prev) => ({
        ...prev,
        [columnId]: [...(prev[columnId] || []), ...novasTarefas],
      }));
      setColumnPage((prev) => ({ ...prev, [columnId]: pagina.current_page }));
      setColumnHasMore((prev) => ({ ...prev, [columnId]: pagina.current_page < pagina.last_page }));
    } catch (err) {
      notify(
        'error',
        err instanceof Error ? err.message : 'Não foi possível carregar mais cartões.'
      );
    } finally {
      setColumnLoadingMore((prev) => ({ ...prev, [columnId]: false }));
    }
  };

  const handleColumnScroll = (e: React.UIEvent<HTMLDivElement>, columnId: string) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight < el.scrollHeight - 48) return;
    if (!columnHasMore[columnId]) return;
    fetchMoreTasksForColumn(columnId);
  };

  // Board creation
  const handleSaveBoard = async () => {
    if (!newBoardTitle.trim()) return;
    try {
      await addBoard(newBoardTitle.trim(), newBoardDesc.trim());
      setNewBoardTitle('');
      setNewBoardDesc('');
      setBoardDialogOpen(false);
      notify('success', 'Quadro criado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível criar o quadro.');
    }
  };

  // Add list (column) inline
  const handleCreateList = async () => {
    if (!newListTitle.trim() || !activeBoard) return;
    try {
      await addStatusToBoard(activeBoard.id, newListTitle.trim());
      setNewListTitle('');
      setIsAddingList(false);
      notify('success', 'Lista adicionada ao quadro.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível adicionar a lista.');
    }
  };

  // Add card inline - only title and empty description (no priority, no assignee)
  const handleCreateCardInline = async (columnId: string) => {
    if (!newCardTitle.trim() || !activeBoard) return;
    try {
      await addTask({
        boardId: activeBoard.id,
        columnId,
        title: newCardTitle.trim(),
        description: '',
      });
      setNewCardTitle('');
      setTaskSearch('');
      notify('success', 'Cartão criado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível criar o cartão.');
    }
  };

  // Open Edit List
  const handleOpenEditList = (col: BoardColumn) => {
    setEditingCol(col);
    setStatusTitle(col.title);
    setEditStatusDialogOpen(true);
  };

  const handleSaveEditList = async () => {
    if (!statusTitle.trim() || !activeBoard || !editingCol) return;
    try {
      await editStatus(activeBoard.id, editingCol.id, statusTitle.trim());
      setEditStatusDialogOpen(false);
      notify('success', 'Lista atualizada com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível atualizar a lista.');
    }
  };

  // Board actions (Rename & Archive)
  const handleOpenRenameBoard = (board: Board) => {
    setRenamingBoard(board);
    setRenameBoardTitle(board.title);
    setRenameBoardDesc(board.description || '');
    setRenameBoardDialogOpen(true);
    setBoardMenuAnchor(null);
    setMenuBoard(null);
  };

  const handleCloseRenameBoard = () => {
    setRenameBoardDialogOpen(false);
    setRenamingBoard(null);
    setRenameBoardTitle('');
    setRenameBoardDesc('');
  };

  const handleSaveRenameBoard = async () => {
    if (!renameBoardTitle.trim() || !renamingBoard) return;
    try {
      await editBoard(renamingBoard.id, renameBoardTitle.trim(), renameBoardDesc.trim());
      handleCloseRenameBoard();
      notify('success', 'Quadro atualizado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível atualizar o quadro.');
    }
  };

  const handleRequestArchiveBoard = (board: Board) => {
    setBoardMenuAnchor(null);
    setMenuBoard(null);
    setArchiveBoardTarget(board);
  };

  const handleConfirmArchiveBoard = async () => {
    if (!archiveBoardTarget) return;
    if (boards.length <= 1) {
      setArchiveBoardTarget(null);
      notify('error', 'Não é possível arquivar o único quadro.');
      return;
    }
    const boardId = archiveBoardTarget.id;
    try {
      await deleteBoard(boardId);
      setArchiveBoardTarget(null);
      if (activeBoardId === boardId) {
        setActiveBoardId('');
      }
      notify('success', 'Quadro arquivado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível arquivar o quadro.');
    }
  };

  // Status actions (Edit & Archive)
  const handleOpenEditStatus = () => {
    if (!menuColumn) return;
    setEditingCol(menuColumn);
    setStatusTitle(menuColumn.title);
    setEditStatusDialogOpen(true);
    setStatusMenuAnchor(null);
    setMenuColumn(null);
  };

  const handleRequestArchiveStatus = () => {
    if (!menuColumn) return;
    setArchiveStatusTarget(menuColumn);
    setStatusMenuAnchor(null);
    setMenuColumn(null);
  };

  const handleConfirmArchiveStatus = async () => {
    if (!archiveStatusTarget || !activeBoard) return;
    if (activeBoard.columns.length <= 1) {
      setArchiveStatusTarget(null);
      notify('error', 'Não é possível arquivar a única lista do quadro.');
      return;
    }
    try {
      await deleteStatus(activeBoard.id, archiveStatusTarget.id);
      setArchiveStatusTarget(null);
      notify('success', 'Lista arquivada com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível arquivar a lista.');
    }
  };

  // Board 3-dots menu element (Rename, Compartilhar and Archive)
  const boardMenuElement = (
    <Menu
      anchorEl={boardMenuAnchor}
      open={Boolean(boardMenuAnchor)}
      onClose={() => {
        setBoardMenuAnchor(null);
        setMenuBoard(null);
      }}
      slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}
    >
      {podeEditarQuadro && (
        <MenuItem
          onClick={() => {
            if (menuBoard) {
              handleOpenRenameBoard(menuBoard);
            }
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1.2, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Renomear
          </Typography>
        </MenuItem>
      )}
      {podeEditarQuadro && (
        <MenuItem
          onClick={() => {
            if (menuBoard) {
              handleOpenShareBoard(menuBoard);
            }
          }}
        >
          <ShareIcon fontSize="small" sx={{ mr: 1.2, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Compartilhar
          </Typography>
        </MenuItem>
      )}
      {podeApagarQuadro && (
        <MenuItem
          onClick={() => {
            if (menuBoard) handleRequestArchiveBoard(menuBoard);
          }}
          disabled={boards.length <= 1 || isMutating}
          sx={{ color: 'error.main' }}
        >
          <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Arquivar
          </Typography>
        </MenuItem>
      )}
    </Menu>
  );

  // Rename Board Dialog element
  const renameBoardDialogElement = (
    <Dialog
      open={renameBoardDialogOpen}
      onClose={handleCloseRenameBoard}
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(184, 134, 11, 0.12)',
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <BoardIcon />
        </Box>
        Renomear quadro
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          Atualize o nome e a descrição que identificam este quadro para a equipe.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Nome do quadro"
            fullWidth
            required
            autoFocus
            value={renameBoardTitle}
            onChange={(e) => setRenameBoardTitle(e.target.value)}
            helperText="Use um nome curto e fácil de reconhecer."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveRenameBoard();
              }
            }}
          />
          <TextField
            label="Descrição"
            fullWidth
            multiline
            rows={3}
            value={renameBoardDesc}
            onChange={(e) => setRenameBoardDesc(e.target.value)}
            helperText="Opcional. Explique o objetivo deste quadro."
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCloseRenameBoard}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSaveRenameBoard}
          disabled={!renameBoardTitle.trim() || isMutating}
          sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
        >
          {isMutating ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Share Board Dialog element
  const shareBoardDialogElement = (
    <Dialog open={shareBoardDialogOpen} onClose={handleCloseShareBoard} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(2, 119, 189, 0.12)',
            color: '#0277BD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShareIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.25 }}>Compartilhar quadro</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {sharingBoard?.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Quem já tem acesso
            </Typography>
            <SharedUsersList loading={sharedBoardUsersLoading} users={sharedBoardUsers} />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Adicionar novo usuário
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              O usuário selecionado poderá visualizar e editar este quadro e seus cartões.
            </Typography>
            <UserSelect
              value={selectedUserObj}
              onChange={(u) => setSelectedUserObj(u)}
              label="Selecionar usuário"
            />
          </Box>

          {shareFeedback && (
            <Alert
              severity={shareFeedback.includes('sucesso') ? 'success' : 'error'}
              sx={{ borderRadius: 2 }}
            >
              {shareFeedback}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCloseShareBoard} disabled={shareLoading}>
          Fechar
        </Button>
        <Button
          variant="contained"
          startIcon={shareLoading ? <CircularProgress size={18} color="inherit" /> : <ShareIcon />}
          onClick={handleConfirmShareBoard}
          disabled={!selectedUserObj || shareLoading}
        >
          {shareLoading ? 'Compartilhando...' : 'Compartilhar'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Share Card Dialog element
  const shareCardDialogElement = (
    <Dialog open={shareCardDialogOpen} onClose={handleCloseShareCard} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: 'rgba(2, 119, 189, 0.12)',
            color: '#0277BD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CardIcon />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, lineHeight: 1.25 }}>Compartilhar cartão</Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {sharingTask?.title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Quem já tem acesso
            </Typography>
            <SharedUsersList loading={sharedCardUsersLoading} users={sharedCardUsers} />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
              Adicionar novo usuário
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              O usuário selecionado poderá visualizar e editar este cartão.
            </Typography>
            <UserSelect
              value={shareCardUserObj}
              onChange={(u) => setShareCardUserObj(u)}
              label="Selecionar usuário"
            />
          </Box>

          {shareCardFeedback && (
            <Alert
              severity={shareCardFeedback.includes('sucesso') ? 'success' : 'error'}
              sx={{ borderRadius: 2 }}
            >
              {shareCardFeedback}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCloseShareCard} disabled={shareCardLoading}>
          Fechar
        </Button>
        <Button
          variant="contained"
          startIcon={shareCardLoading ? <CircularProgress size={18} color="inherit" /> : <ShareIcon />}
          onClick={handleConfirmShareCard}
          disabled={!shareCardUserObj || shareCardLoading}
        >
          {shareCardLoading ? 'Compartilhando...' : 'Compartilhar'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  // Status / List 3-dots menu element (Only Edit and Archive)
  const statusMenuElement = (
    <Menu
      anchorEl={statusMenuAnchor}
      open={Boolean(statusMenuAnchor)}
      onClose={() => {
        setStatusMenuAnchor(null);
        setMenuColumn(null);
      }}
      slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}
    >
      {podeEditarQuadro && (
        <MenuItem onClick={handleOpenEditStatus} disabled={isMutating}>
          <EditIcon fontSize="small" sx={{ mr: 1.2, color: 'text.secondary' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Editar
          </Typography>
        </MenuItem>
      )}
      {podeEditarQuadro && (
        <MenuItem
          onClick={handleRequestArchiveStatus}
          disabled={Boolean(activeBoard && activeBoard.columns.length <= 1) || isMutating}
          sx={{ color: 'error.main' }}
        >
          <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Arquivar
          </Typography>
        </MenuItem>
      )}
    </Menu>
  );

  // Card Modal
  const handleOpenCardModal = (task: Task) => {
    setSelectedTask(task);
    setCardFormTitle(task.title);
    setCardFormDesc(task.description || '');
    setIsEditingDesc(false);
    setActionsSidebarOpen(true);
    setCardModalOpen(true);
  };

  const handleSaveCardModal = async () => {
    if (!cardFormTitle.trim() || !selectedTask) return;
    const trimmedTitle = cardFormTitle.trim();
    try {
      await editTask(
        selectedTask.id,
        {
          title: trimmedTitle,
          description: cardFormDesc,
        },
        selectedTask
      );
      // Keep the local snapshot in sync so the save button hides when there are no pending changes
      setSelectedTask({ ...selectedTask, title: trimmedTitle, description: cardFormDesc });
      setIsEditingDesc(false);
      notify('success', 'Cartão atualizado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível salvar o cartão.');
    }
  };

  const handleDuplicateTask = async () => {
    if (!selectedTask || !activeBoard) return;
    try {
      await addTask({
        boardId: activeBoard.id,
        columnId: selectedTask.columnId,
        title: `${selectedTask.title} (Cópia)`,
        description: cardFormDesc || selectedTask.description || '',
      });
      setCardModalOpen(false);
      notify('success', 'Cartão duplicado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível duplicar o cartão.');
    }
  };

  const handleMoveTaskToCol = async (targetColId: string) => {
    if (!selectedTask) return;
    setMoveMenuAnchor(null);
    if (targetColId === selectedTask.columnId) return;
    try {
      await moveTaskStatus(selectedTask.id, targetColId, selectedTask);
      setCardModalOpen(false);
      const targetTitle = activeBoard?.columns.find((column) => column.id === targetColId)?.title;
      notify(
        'success',
        targetTitle ? `Cartão movido para "${targetTitle}".` : 'Cartão movido com sucesso.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível mover o cartão.');
    }
  };

  const handleRequestArchiveTask = () => {
    if (selectedTask) {
      setCardMenuAnchor(null);
      setArchiveTaskTarget(selectedTask);
    }
  };

  const handleConfirmArchiveTask = async () => {
    if (!archiveTaskTarget) return;
    try {
      await deleteTask(archiveTaskTarget.id);
      setArchiveTaskTarget(null);
      setSelectedTask(null);
      setCardModalOpen(false);
      notify('success', 'Cartão arquivado com sucesso.');
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível arquivar o cartão.');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (!podeEditarTarefa || isMutating) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (!podeEditarTarefa || isMutating) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverColId(colId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    setDraggingTaskId(null);
    setDragOverColId(null);
    if (!taskId || !podeEditarTarefa || isMutating) return;
    const knownTask =
      boardTasks.find((task) => task.id === taskId) ||
      Object.values(extraTasksByColumn).flat().find((task) => task.id === taskId);
    if (knownTask?.columnId === targetColId) return;
    try {
      await moveTaskStatus(taskId, targetColId, knownTask);
      const targetTitle = activeBoard?.columns.find((column) => column.id === targetColId)?.title;
      notify(
        'success',
        targetTitle ? `Cartão movido para "${targetTitle}".` : 'Cartão movido com sucesso.'
      );
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'Não foi possível mover o cartão.');
    }
  };

  const feedbackElement = (
    <Snackbar
      open={Boolean(feedback)}
      autoHideDuration={4000}
      onClose={() => setFeedback(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      {feedback ? (
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback(null)}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {feedback.message}
        </Alert>
      ) : undefined}
    </Snackbar>
  );

  const archiveDialogsElement = (
    <>
      <ArchiveConfirmDialog
        open={Boolean(archiveBoardTarget)}
        title="Arquivar quadro"
        description={`O quadro "${archiveBoardTarget?.title || ''}" e todas as suas listas e cartões deixarão de aparecer na listagem. Essa ação não pode ser desfeita pela interface.`}
        loading={isMutating && Boolean(archiveBoardTarget)}
        onClose={() => setArchiveBoardTarget(null)}
        onConfirm={handleConfirmArchiveBoard}
      />
      <ArchiveConfirmDialog
        open={Boolean(archiveStatusTarget)}
        title="Arquivar lista"
        description={`A lista "${archiveStatusTarget?.title || ''}" deixará de aparecer no quadro. Os cartões vinculados a ela também ficarão ocultos.`}
        loading={isMutating && Boolean(archiveStatusTarget)}
        onClose={() => setArchiveStatusTarget(null)}
        onConfirm={handleConfirmArchiveStatus}
      />
      <ArchiveConfirmDialog
        open={Boolean(archiveTaskTarget)}
        title="Arquivar cartão"
        description={`O cartão "${archiveTaskTarget?.title || ''}" será removido do quadro. Essa ação não pode ser desfeita pela interface.`}
        loading={isMutating && Boolean(archiveTaskTarget)}
        onClose={() => setArchiveTaskTarget(null)}
        onConfirm={handleConfirmArchiveTask}
      />
    </>
  );

  // All hooks are declared above this line — early returns for loading/state
  // branches only happen after every hook has run, on every render.
  if (isLoading) {
    return (
      <>
        <BoardSelectionSkeleton />
        {feedbackElement}
      </>
    );
  }

  // ==========================================
  // VIEW 1: BOARDS SELECTION SCREEN (ENTRADA)
  // ==========================================
  if (!activeBoard) {
    const comBusca = normalizedBoardSearch.length > 0;
    const boardsExibidos = filteredBoards.slice(0, visibleBoardsCount);

    return (
      <>
        <PageContainer disableMaxWidth>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: 'rgba(184, 134, 11, 0.12)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BoardIcon />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Quadros
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Organize tarefas em listas e acompanhe o fluxo de trabalho da equipe
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title="Atualizar quadros">
                <span>
                  <IconButton
                    onClick={refreshBoards}
                    disabled={isFetchingBoards}
                    aria-label="Atualizar quadros"
                  >
                    {isFetchingBoards ? <CircularProgress size={20} /> : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              {podeCriarQuadro && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setBoardDialogOpen(true)}
                >
                  Novo quadro
                </Button>
              )}
            </Box>
          </Box>

          <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2, mb: 2.5 }}>
            <Box
              sx={{
                p: 2,
                display: 'flex',
                alignItems: { xs: 'stretch', sm: 'center' },
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 1.5,
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800 }}>Seus quadros</Typography>
                <Typography variant="caption" color="text.secondary">
                  {filteredBoards.length === 1 ? '1 quadro' : `${filteredBoards.length} quadros`}
                  {comBusca ? ` encontrados para “${boardSearch.trim()}”` : ''}
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Buscar por nome ou descrição"
                value={boardSearch}
                onChange={(e) => setBoardSearch(e.target.value)}
                sx={{ minWidth: { xs: '100%', sm: 320 } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: boardSearch ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setBoardSearch('')}
                          aria-label="Limpar busca"
                          edge="end"
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : undefined,
                  },
                }}
              />
            </Box>
          </Card>

          {boardsExibidos.length === 0 ? (
            <Card elevation={0} sx={{ border: '1px solid #E2E8F0', borderRadius: 2 }}>
              <Box sx={{ py: 8, px: 3, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    bgcolor: 'rgba(184, 134, 11, 0.10)',
                    color: 'primary.main',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <EmptyIcon />
                </Box>
                <Typography sx={{ fontWeight: 800 }}>
                  {comBusca ? 'Nenhum quadro encontrado' : 'Nenhum quadro cadastrado'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.5, mb: 2, maxWidth: 420, mx: 'auto' }}
                >
                  {comBusca
                    ? 'Tente buscar por outro nome ou descrição.'
                    : podeCriarQuadro
                      ? 'Crie seu primeiro quadro para começar a organizar as tarefas da equipe.'
                      : 'Os quadros aparecerão aqui assim que forem criados.'}
                </Typography>
                {comBusca ? (
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={() => setBoardSearch('')}
                  >
                    Limpar busca
                  </Button>
                ) : (
                  podeCriarQuadro && (
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setBoardDialogOpen(true)}
                    >
                      Novo quadro
                    </Button>
                  )
                )}
              </Box>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {boardsExibidos.map((board) => {
                const accent = boardAccent(board.title || board.id);
                return (
                  <Grid key={board.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Card
                      onClick={() => setActiveBoardId(board.id)}
                      elevation={0}
                      sx={{
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%',
                        borderRadius: 2.5,
                        border: '1px solid #E2E8F0',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 4,
                          bgcolor: accent,
                        },
                        '&:hover': {
                          borderColor: accent,
                          transform: 'translateY(-3px)',
                          boxShadow: `0 12px 28px ${accent}22`,
                        },
                      }}
                    >
                      <CardContent
                        sx={{
                          p: 2.5,
                          pt: 3,
                          '&:last-child': { pb: 2.5 },
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: 2,
                              bgcolor: `${accent}14`,
                              color: accent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <BoardIcon />
                          </Box>
                          {podeGerenciarQuadro && (
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setBoardMenuAnchor(e.currentTarget);
                                setMenuBoard(board);
                              }}
                              title="Opções do quadro"
                              sx={{ color: 'text.secondary', p: 0.5 }}
                            >
                              <MoreIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Box>

                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 800, mb: 0.5, fontSize: '1.05rem', lineHeight: 1.3 }}
                        >
                          {board.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            minHeight: 42,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.5,
                          }}
                        >
                          {board.description ||
                            'Sem descrição. Adicione um resumo para identificar o objetivo deste quadro.'}
                        </Typography>

                        <Box
                          sx={{
                            mt: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1,
                          }}
                        >
                          <Chip
                            label="Kanban"
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              bgcolor: `${accent}12`,
                              color: accent,
                              border: `1px solid ${accent}33`,
                            }}
                          />
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              color: accent,
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            Abrir quadro
                            <MoveIcon sx={{ fontSize: 16 }} />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}

          {boardsExibidos.length > 0 && visibleBoardsCount < filteredBoards.length && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setVisibleBoardsCount((count) => count + BOARDS_PAGE_SIZE)}
                sx={{
                  borderRadius: 2,
                  borderColor: '#CBD5E1',
                  color: 'text.primary',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                {comBusca ? 'Mostrar mais resultados' : 'Mostrar mais quadros'}
              </Button>
            </Box>
          )}

          <Dialog
            open={boardDialogOpen}
            onClose={() => setBoardDialogOpen(false)}
            maxWidth="xs"
            fullWidth
          >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: 'rgba(184, 134, 11, 0.12)',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BoardIcon />
              </Box>
              Novo quadro
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                Crie um espaço para organizar as tarefas da equipe em listas e cartões.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Nome do quadro"
                  fullWidth
                  required
                  autoFocus
                  placeholder="Ex: Projetos, Marketing, Suporte"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  helperText="Use um nome curto e fácil de reconhecer."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleSaveBoard();
                    }
                  }}
                />
                <TextField
                  label="Descrição"
                  fullWidth
                  multiline
                  rows={3}
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  helperText="Opcional. Explique o objetivo deste quadro."
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setBoardDialogOpen(false)} disabled={isMutating}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                startIcon={
                  isMutating ? <CircularProgress size={18} color="inherit" /> : <AddIcon />
                }
                onClick={handleSaveBoard}
                disabled={!newBoardTitle.trim() || isMutating}
              >
                {isMutating ? 'Criando...' : 'Criar quadro'}
              </Button>
            </DialogActions>
          </Dialog>

          {boardMenuElement}
          {renameBoardDialogElement}
          {shareBoardDialogElement}
        </PageContainer>
        {archiveDialogsElement}
        {feedbackElement}
      </>
    );
  }

  // ==========================================
  // VIEW 2: SELECTED BOARD'S TASKS & LISTS (TRELLO VIEW)
  // ==========================================
  const boardTasks = tasks.filter((t) => t.boardId === activeBoard.id);

  // Only show the save button when the title or description actually changed
  const taskTitleChanged = cardFormTitle.trim() !== (selectedTask?.title || '').trim();
  const taskDescChanged = cardFormDesc !== (selectedTask?.description || '');
  const hasTaskChanges = Boolean(selectedTask) && (taskTitleChanged || taskDescChanged);

  const normalizedTaskSearch = taskSearch.trim().toLowerCase();
  const matchesTaskSearch = (task: Task) => {
    if (!normalizedTaskSearch) return true;
    return (
      task.title.toLowerCase().includes(normalizedTaskSearch) ||
      stripHtml(task.description).toLowerCase().includes(normalizedTaskSearch)
    );
  };
  const hasAnySearchResults =
    !normalizedTaskSearch ||
    activeBoard.columns.some((column) =>
      [
        ...boardTasks.filter((task) => task.columnId === column.id),
        ...(extraTasksByColumn[column.id] || []),
      ].some(matchesTaskSearch)
    );
  const boardColor = boardAccent(activeBoard.title || activeBoard.id);
  const hasCardActions = podeEditarTarefa || podeCriarTarefa || podeApagarTarefa;

  return (
    <PageContainer disableMaxWidth sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Board header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 2,
          pb: 2,
          borderBottom: '1px solid #E2E8F0',
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Tooltip title="Voltar para quadros">
            <IconButton
              onClick={() => setActiveBoardId('')}
              aria-label="Voltar para quadros"
              sx={{
                border: '1px solid #CBD5E1',
                borderRadius: 2,
                color: 'text.secondary',
                flexShrink: 0,
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${boardColor}14`,
              color: boardColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <BoardIcon />
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                {activeBoard.title}
              </Typography>
              <Chip
                label="Kanban"
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: '0.68rem',
                  bgcolor: `${boardColor}12`,
                  color: boardColor,
                  border: `1px solid ${boardColor}33`,
                }}
              />
            </Box>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 0.25,
                maxWidth: 620,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {activeBoard.description ||
                'Arraste os cartões entre as listas para atualizar o andamento.'}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            width: { xs: '100%', lg: 'auto' },
          }}
        >
          <TextField
            size="small"
            placeholder="Buscar cartão..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 240 }, flexGrow: { xs: 1, lg: 0 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: taskSearch ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setTaskSearch('')}
                      aria-label="Limpar busca"
                      edge="end"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />
          <Tooltip title="Atualizar quadro">
            <span>
              <IconButton
                onClick={refreshBoards}
                disabled={isFetchingBoards}
                aria-label="Atualizar quadro"
              >
                {isFetchingBoards ? <CircularProgress size={20} /> : <RefreshIcon />}
              </IconButton>
            </span>
          </Tooltip>
          {podeGerenciarQuadro && (
            <Tooltip title="Opções do quadro">
              <IconButton
                onClick={(e) => {
                  setBoardMenuAnchor(e.currentTarget);
                  setMenuBoard(activeBoard);
                }}
                aria-label="Opções do quadro"
                sx={{
                  border: '1px solid #CBD5E1',
                  borderRadius: 2,
                  p: 0.8,
                  color: 'text.secondary',
                  '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                }}
              >
                <MoreIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {normalizedTaskSearch && !hasAnySearchResults && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setTaskSearch('')}>
              Limpar
            </Button>
          }
        >
          Nenhum cartão encontrado para “{taskSearch.trim()}”.
        </Alert>
      )}

      {/* Trello Board Canvas (Horizontal Scroll of Lists) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          flexGrow: 1,
          minHeight: 0,
          pb: 2,
          pr: 2,
        }}
      >
        {/* Render Each Column (List) */}
        {activeBoard.columns.slice(0, visibleColumnsCount).map((column) => {
          const colTasks = boardTasks.filter((task) => task.columnId === column.id);
          const allColTasks = [...colTasks, ...(extraTasksByColumn[column.id] || [])];
          const visibleColTasks = allColTasks.filter(matchesTaskSearch);
          const hasMoreTasks = columnHasMore[column.id] ?? false;
          const isLoadingMoreTasks = Boolean(columnLoadingMore[column.id]);
          const isDraggingOver = dragOverColId === column.id;
          const columnCount = normalizedTaskSearch
            ? visibleColTasks.length
            : columnTotal[column.id] ?? allColTasks.length;

          return (
            <Box
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              sx={{
                flex: '0 0 auto',
                width: 300,
                minWidth: 280,
                maxWidth: 340,
                maxHeight: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isDraggingOver ? '#FDF6E3' : '#F8FAFC',
                borderRadius: 2.5,
                border: isDraggingOver ? '2px dashed #B8860B' : '1px solid #E2E8F0',
                transition: 'background-color 0.15s ease, border 0.15s ease',
              }}
            >
              <Box
                sx={{
                  p: 1.5,
                  pb: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <Typography
                    variant="subtitle2"
                    noWrap
                    sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#172B4D' }}
                  >
                    {column.title}
                  </Typography>
                  <Chip
                    label={columnCount}
                    size="small"
                    sx={{
                      height: 22,
                      minWidth: 24,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      bgcolor: '#E2E8F0',
                      color: '#44546F',
                      '& .MuiChip-label': { px: 0.8 },
                    }}
                  />
                </Box>

                {podeEditarQuadro && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      setStatusMenuAnchor(e.currentTarget);
                      setMenuColumn(column);
                    }}
                    title="Opções da lista"
                    sx={{ p: 0.5, color: '#626F86' }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Box
                onScroll={(e) => handleColumnScroll(e, column.id)}
                sx={{
                  px: 1,
                  py: 0.5,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  flexGrow: 1,
                  minHeight: 0,
                }}
              >
                {visibleColTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable={podeEditarTarefa && !isMutating}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={() => {
                      setDraggingTaskId(null);
                      setDragOverColId(null);
                    }}
                    onClick={() => handleOpenCardModal(task)}
                    sx={{
                      p: 1.75,
                      minHeight: 60,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.10)',
                      border: '1px solid #E2E8F0',
                      cursor: podeEditarTarefa && !isMutating ? 'grab' : 'pointer',
                      position: 'relative',
                      '&:hover': {
                        boxShadow: '0 6px 16px rgba(9, 30, 66, 0.12)',
                        borderColor: '#B8860B',
                        '& .task-drag-handle': { opacity: 1 },
                      },
                      '&:active': {
                        cursor: podeEditarTarefa && !isMutating ? 'grabbing' : 'pointer',
                      },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#172B4D',
                        lineHeight: 1.4,
                        pr: 2.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {task.title}
                    </Typography>

                    {task.description && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          mt: 1,
                          color: '#626F86',
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: 15 }} />
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                          Descrição
                        </Typography>
                      </Box>
                    )}

                    {podeEditarTarefa && (
                      <DragIndicatorIcon
                        className="task-drag-handle"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 16,
                          color: '#94A3B8',
                          opacity: 0,
                          transition: 'opacity 0.15s ease',
                        }}
                      />
                    )}
                  </Card>
                ))}

                {visibleColTasks.length === 0 && addingCardColId !== column.id && (
                  <Box
                    sx={{
                      border: '1px dashed #CBD5E1',
                      borderRadius: 2,
                      p: 2,
                      textAlign: 'center',
                      color: 'text.secondary',
                      bgcolor: 'rgba(255, 255, 255, 0.6)',
                    }}
                  >
                    <EmptyCardIcon sx={{ fontSize: 22, mb: 0.5, opacity: 0.7 }} />
                    <Typography variant="caption" sx={{ display: 'block', fontWeight: 600 }}>
                      {normalizedTaskSearch
                        ? 'Nenhum cartão corresponde à busca.'
                        : 'Nenhum cartão nesta lista.'}
                    </Typography>
                    {!normalizedTaskSearch && podeCriarTarefa && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setAddingCardColId(column.id);
                          setNewCardTitle('');
                        }}
                        sx={{ mt: 0.5, fontSize: '0.75rem' }}
                      >
                        Adicionar cartão
                      </Button>
                    )}
                  </Box>
                )}

                {hasMoreTasks && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                    {isLoadingMoreTasks ? (
                      <CircularProgress size={16} thickness={5} />
                    ) : (
                      <Typography variant="caption" sx={{ color: '#626F86' }}>
                        Role para ver mais cartões
                      </Typography>
                    )}
                  </Box>
                )}

                {addingCardColId === column.id && podeCriarTarefa && (
                  <Box
                    sx={{
                      mt: 0.5,
                      bgcolor: '#FFFFFF',
                      p: 1,
                      borderRadius: 2,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <TextField
                      autoFocus
                      placeholder="Insira um título para este cartão..."
                      multiline
                      rows={2}
                      fullWidth
                      size="small"
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void handleCreateCardInline(column.id);
                        }
                      }}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={
                          isMutating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />
                        }
                        onClick={() => handleCreateCardInline(column.id)}
                        disabled={!newCardTitle.trim() || isMutating}
                      >
                        {isMutating ? 'Adicionando...' : 'Adicionar cartão'}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => setAddingCardColId(null)}
                        aria-label="Fechar criação de cartão"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>

              {addingCardColId !== column.id && podeCriarTarefa && (
                <Box sx={{ p: 1 }}>
                  <Button
                    fullWidth
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setAddingCardColId(column.id);
                      setNewCardTitle('');
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      color: '#44546F',
                      fontWeight: 600,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.06)', color: 'text.primary' },
                    }}
                  >
                    Adicionar um cartão
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}

        {/* Pagination: additional lists */}
        {visibleColumnsCount < activeBoard.columns.length && (
          <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', pt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleColumnsCount((count) => count + STATUS_PAGE_SIZE)}
              sx={{
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: 'text.primary',
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              Mostrar mais listas
            </Button>
          </Box>
        )}

        {/* Add another list */}
        {podeEditarQuadro && (
          <Box sx={{ flex: '0 0 280px', width: 280 }}>
            {isAddingList ? (
              <Box
                sx={{
                  bgcolor: '#F8FAFC',
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid #E2E8F0',
                }}
              >
                <TextField
                  autoFocus
                  placeholder="Insira o título da lista..."
                  fullWidth
                  size="small"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleCreateList();
                    }
                  }}
                  sx={{ mb: 1.5, bgcolor: '#FFFFFF', borderRadius: 1 }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={
                      isMutating ? <CircularProgress size={14} color="inherit" /> : <AddIcon />
                    }
                    onClick={handleCreateList}
                    disabled={!newListTitle.trim() || isMutating}
                  >
                    {isMutating ? 'Adicionando...' : 'Adicionar lista'}
                  </Button>
                  <IconButton size="small" onClick={() => setIsAddingList(false)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ) : (
              <Button
                fullWidth
                startIcon={<AddIcon />}
                onClick={() => {
                  setIsAddingList(true);
                  setNewListTitle('');
                }}
                sx={{
                  justifyContent: 'flex-start',
                  p: 1.5,
                  bgcolor: 'rgba(184, 134, 11, 0.08)',
                  color: 'primary.main',
                  borderRadius: 2.5,
                  fontWeight: 700,
                  border: '1px dashed #B8860B',
                  '&:hover': { bgcolor: 'rgba(184, 134, 11, 0.14)' },
                }}
              >
                Adicionar outra lista
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Edit list dialog */}
      <Dialog
        open={editStatusDialogOpen}
        onClose={() => setEditStatusDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 800 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: 'rgba(184, 134, 11, 0.12)',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ViewColumnIcon />
          </Box>
          Editar lista
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
            Renomeie a lista para refletir a etapa do fluxo de trabalho.
          </Typography>
          <TextField
            label="Nome da lista"
            fullWidth
            required
            autoFocus
            value={statusTitle}
            onChange={(e) => setStatusTitle(e.target.value)}
            helperText="Ex: A fazer, Em andamento, Concluído."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleSaveEditList();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditStatusDialogOpen(false)} disabled={isMutating}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={isMutating ? <CircularProgress size={18} color="inherit" /> : <EditIcon />}
            onClick={handleSaveEditList}
            disabled={!statusTitle.trim() || isMutating}
          >
            {isMutating ? 'Salvando...' : 'Salvar lista'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CARD DETAIL MODAL (TRELLO CARD TEMPLATE WITH QUILL EDITOR) */}
      <Dialog
        open={cardModalOpen}
        onClose={() => {
          setCardModalOpen(false);
          setIsEditingDesc(false);
        }}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 3,
              width: '100%',
              maxWidth: 860,
              minHeight: 620,
              boxShadow: '0 24px 48px rgba(0, 0, 0, 0.18)',
              bgcolor: '#FFFFFF',
            },
          },
        }}
      >
        <DialogTitle sx={{ pt: 3, pb: 1.5, px: 3.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
            {/* Header: Card Icon + H1 Editable Title + List Subtitle */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flexGrow: 1 }}>
              <CardIcon sx={{ color: '#172B4D', fontSize: 26, mt: 0.6 }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography component="h1" sx={{ m: 0, p: 0 }}>
                  <TextField
                    variant="standard"
                    fullWidth
                    placeholder="Título do Cartão"
                    value={cardFormTitle}
                    onChange={(e) => setCardFormTitle(e.target.value)}
                    slotProps={{
                      input: {
                        readOnly: !podeEditarTarefa,
                        sx: {
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          lineHeight: 1.3,
                          py: 0.3,
                          '&:hover:not(.Mui-focused):before': {
                            borderColor: '#CBD5E1',
                          },
                        },
                      },
                    }}
                  />
                </Typography>
                <Typography variant="body2" sx={{ color: '#626F86', mt: 0.5 }}>
                  na lista{' '}
                  <strong style={{ textDecoration: 'underline', color: '#172B4D' }}>
                    {activeBoard?.columns.find((c) => c.id === selectedTask?.columnId)?.title || 'Quadro'}
                  </strong>
                </Typography>
              </Box>
            </Box>

            {/* Top Actions: 3 Dots (Archive) & Close (NO trash icon) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
              {podeApagarTarefa && (
                <IconButton
                  size="small"
                  onClick={(e) => setCardMenuAnchor(e.currentTarget)}
                  title="Mais ações"
                  sx={{ color: 'text.secondary', p: 0.8 }}
                >
                  <MoreIcon />
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={() => {
                  setCardModalOpen(false);
                  setIsEditingDesc(false);
                }}
                sx={{ color: 'text.secondary', p: 0.8 }}
                aria-label="Fechar cartão"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {/* 3-dots menu for the card */}
        <Menu
          anchorEl={cardMenuAnchor}
          open={Boolean(cardMenuAnchor)}
          onClose={() => setCardMenuAnchor(null)}
          slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}
        >
          <MenuItem
            onClick={handleRequestArchiveTask}
            disabled={isMutating}
            sx={{ color: 'error.main' }}
          >
            <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Arquivar cartão
            </Typography>
          </MenuItem>
        </Menu>

        <DialogContent dividers sx={{ px: 3.5, py: 3, bgcolor: '#FFFFFF' }}>
          <Grid container spacing={3.5}>
            {/* MAIN COLUMN: SOMENTE DESCRIÇÃO (PREVIEW POR PADRÃO, EDITOR AO CLICAR) */}
            <Grid size={{ xs: 12, md: hasCardActions ? 8.5 : 12 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DescriptionIcon sx={{ color: '#172B4D', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#172B4D' }}>
                      Descrição
                    </Typography>
                  </Box>
                  {podeEditarTarefa && !isEditingDesc && !isDescEmpty(cardFormDesc) && (
                    <Button
                      size="small"
                      onClick={() => setIsEditingDesc(true)}
                      sx={{
                        textTransform: 'none',
                        bgcolor: '#091E420F',
                        color: '#172B4D',
                        fontWeight: 600,
                        fontSize: '0.825rem',
                        px: 1.5,
                        py: 0.4,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: '#091E4224' },
                      }}
                    >
                      Editar
                    </Button>
                  )}
                </Box>

                {/* PREVIEW VS EDITOR */}
                {!isEditingDesc ? (
                  isDescEmpty(cardFormDesc) ? (
                    /* Placeholder Box - click to open Quill */
                    <Box
                      onClick={podeEditarTarefa ? () => setIsEditingDesc(true) : undefined}
                      sx={{
                        bgcolor: '#091E420F',
                        borderRadius: 2,
                        minHeight: 75,
                        p: 2,
                        cursor: podeEditarTarefa ? 'pointer' : 'default',
                        color: '#44546F',
                        fontSize: '0.925rem',
                        fontWeight: 500,
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': podeEditarTarefa
                          ? {
                              bgcolor: '#091E421F',
                              color: '#172B4D',
                            }
                          : undefined,
                      }}
                    >
                      {podeEditarTarefa
                        ? 'Adicionar uma descrição mais detalhada...'
                        : 'Este cartão não possui descrição.'}
                    </Box>
                  ) : (
                    /* Rich Text Preview - click to open Quill */
                    <Box
                      onClick={podeEditarTarefa ? () => setIsEditingDesc(true) : undefined}
                      title={podeEditarTarefa ? 'Clique para editar' : undefined}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: podeEditarTarefa ? 'pointer' : 'default',
                        minHeight: 60,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': podeEditarTarefa
                          ? {
                              bgcolor: '#F1F5F9',
                              borderColor: '#CBD5E1',
                            }
                          : undefined,
                        '& p': { mb: 1.2, lineHeight: 1.6, color: '#172B4D', fontSize: '0.925rem' },
                        '& p:last-child': { mb: 0 },
                        '& h1': { fontSize: '1.4rem', fontWeight: 700, mt: 1.5, mb: 1, color: '#0F172A' },
                        '& h2': { fontSize: '1.2rem', fontWeight: 700, mt: 1.2, mb: 0.8, color: '#0F172A' },
                        '& h3': { fontSize: '1.05rem', fontWeight: 600, mt: 1, mb: 0.6, color: '#0F172A' },
                        '& ul': { listStyleType: 'disc', pl: 3, my: 1, '& li': { mb: 0.5, color: '#172B4D' } },
                        '& ol': { listStyleType: 'decimal', pl: 3, my: 1, '& li': { mb: 0.5, color: '#172B4D' } },
                        '& blockquote': {
                          borderLeft: '4px solid #CBD5E1',
                          pl: 2,
                          py: 0.5,
                          my: 1.5,
                          color: '#64748B',
                          fontStyle: 'italic',
                        },
                        '& pre': {
                          bgcolor: '#0F172A',
                          color: '#F8FAFC',
                          p: 1.5,
                          borderRadius: 1.5,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          overflowX: 'auto',
                          my: 1.5,
                        },
                        '& a': { color: 'primary.main', textDecoration: 'underline' },
                      }}
                      dangerouslySetInnerHTML={{ __html: cardFormDesc }}
                    />
                  )
                ) : (
                  /* Quill Editor - use the single "Salvar Alterações" button in the footer to save */
                  <Box>
                    <QuillEditor
                      value={cardFormDesc}
                      onChange={setCardFormDesc}
                      placeholder="Adicione uma descrição detalhada com tópicos, parágrafos, listas organizadas..."
                      minHeight={240}
                    />
                  </Box>
                )}
              </Box>
            </Grid>

            {/* SIDEBAR: APENAS AS AÇÕES (esconde ao clicar fora, reaparece ao clicar em "Ações") */}
            {hasCardActions && (
              <Grid size={{ xs: 12, md: 3.5 }}>
                {actionsSidebarOpen ? (
                <ClickAwayListener
                  onClickAway={(event) => {
                    // Ignore clicks inside portaled MUI menus (ex: submenu "Mover")
                    if ((event.target as HTMLElement | null)?.closest?.('.MuiMenu-paper')) return;
                    setActionsSidebarOpen(false);
                  }}
                >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color: '#626F86',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    mb: 0.5,
                  }}
                >
                  Ações
                </Typography>

                {podeEditarTarefa && (
                  <>
                    <Button
                      fullWidth
                      size="small"
                      disabled={isMutating}
                      startIcon={<MoveIcon fontSize="small" />}
                      onClick={(e) => setMoveMenuAnchor(e.currentTarget)}
                      sx={{
                        justifyContent: 'flex-start',
                        bgcolor: '#091E420F',
                        color: '#172B4D',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1,
                        px: 1.5,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: '#091E4224' },
                      }}
                    >
                      Mover
                    </Button>

                    <Menu
                      anchorEl={moveMenuAnchor}
                      open={Boolean(moveMenuAnchor)}
                      onClose={() => setMoveMenuAnchor(null)}
                      slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180 } } }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          px: 2,
                          py: 1,
                          display: 'block',
                          fontWeight: 700,
                          color: '#626F86',
                        }}
                      >
                        Mover para lista:
                      </Typography>
                      {activeBoard?.columns.map((col) => (
                        <MenuItem
                          key={col.id}
                          selected={col.id === selectedTask?.columnId}
                          onClick={() => handleMoveTaskToCol(col.id)}
                          disabled={isMutating || col.id === selectedTask?.columnId}
                          sx={{ fontSize: '0.875rem' }}
                        >
                          {col.title} {col.id === selectedTask?.columnId && ' (atual)'}
                        </MenuItem>
                      ))}
                    </Menu>
                  </>
                )}

                {podeCriarTarefa && (
                  <Button
                    fullWidth
                    size="small"
                    disabled={isMutating}
                    startIcon={<CopyIcon fontSize="small" />}
                    onClick={handleDuplicateTask}
                    sx={{
                      justifyContent: 'flex-start',
                      bgcolor: '#091E420F',
                      color: '#172B4D',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      px: 1.5,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#091E4224' },
                    }}
                  >
                    Copiar
                  </Button>
                )}

                {podeEditarTarefa && (
                  <Button
                    fullWidth
                    size="small"
                    disabled={isMutating}
                    startIcon={<ShareIcon fontSize="small" />}
                    onClick={() => {
                      if (selectedTask) {
                        handleOpenShareCard(selectedTask);
                      }
                    }}
                    sx={{
                      justifyContent: 'flex-start',
                      bgcolor: '#091E420F',
                      color: '#172B4D',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      px: 1.5,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#091E4224' },
                    }}
                  >
                    Compartilhar
                  </Button>
                )}

                {podeApagarTarefa && (
                  <Button
                    fullWidth
                    size="small"
                    disabled={isMutating}
                    startIcon={<ArchiveIcon fontSize="small" />}
                    onClick={handleRequestArchiveTask}
                    sx={{
                      justifyContent: 'flex-start',
                      bgcolor: '#F9F1D0',
                      color: '#B8860B',
                      textTransform: 'none',
                      fontWeight: 600,
                      py: 1,
                      px: 1.5,
                      borderRadius: 1.5,
                      '&:hover': { bgcolor: '#F3E3A3' },
                    }}
                  >
                    Arquivar
                  </Button>
                )}
              </Box>
                </ClickAwayListener>
              ) : (
                <Button
                  fullWidth
                  size="small"
                  startIcon={<MoreIcon fontSize="small" />}
                  onClick={() => setActionsSidebarOpen(true)}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: '#091E420F',
                    color: '#172B4D',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    px: 1.5,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: '#091E4224' },
                  }}
                >
                  Ações
                </Button>
              )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, px: 3.5, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={() => {
              setCardModalOpen(false);
              setIsEditingDesc(false);
            }}
            sx={{ px: 3, fontWeight: 600 }}
          >
            Cancelar
          </Button>
          {hasTaskChanges && podeEditarTarefa && (
            <Button
              variant="contained"
              onClick={handleSaveCardModal}
              disabled={isMutating}
              startIcon={
                isMutating ? <CircularProgress size={18} color="inherit" /> : <EditIcon />
              }
              sx={{
                px: 3.5,
                py: 1,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              {isMutating ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Menus and Dialogs */}
      {boardMenuElement}
      {renameBoardDialogElement}
      {statusMenuElement}
      {shareBoardDialogElement}
      {shareCardDialogElement}
      {archiveDialogsElement}
      {feedbackElement}
    </PageContainer>
  );
};
