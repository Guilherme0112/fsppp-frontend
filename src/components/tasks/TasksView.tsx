import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Grid,
  CircularProgress,
  ClickAwayListener,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  MoreHoriz as MoreIcon,
  ArrowBack as ArrowBackIcon,
  ViewKanban as BoardIcon,
  Archive as ArchiveIcon,
  Subject as DescriptionIcon,
  ArrowForward as MoveIcon,
  ContentCopy as CopyIcon,
  CreditCard as CardIcon,
} from '@mui/icons-material';
import { useApp } from '../../context/AppContext';
import { Task, BoardColumn, Board } from '../../types';
import { taskService } from '../../services/taskService';
import { QuillEditor } from '../common/QuillEditor';
import { PageContainer } from '../common/PageContainer';

const BOARDS_PAGE_SIZE = 9;
const STATUS_PAGE_SIZE = 6;

export const TasksView: React.FC = () => {
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
    addTask,
    editTask,
    moveTaskStatus,
    deleteTask,
    isLoading,
    isMutating,
    activeBoardId,
    setActiveBoardId,
    activeBoard,
  } = useApp();

  // Create Board Dialog
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

  // Boards list pagination ("Mostrar mais Quadros")
  const [visibleBoardsCount, setVisibleBoardsCount] = useState(BOARDS_PAGE_SIZE);

  // Status columns pagination within a board ("Mostrar mais status")
  const [visibleColumnsCount, setVisibleColumnsCount] = useState(STATUS_PAGE_SIZE);

  // Board 3-dots Menu & Rename Dialog state
  const [boardMenuAnchor, setBoardMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuBoard, setMenuBoard] = useState<Board | null>(null);
  const [renameBoardDialogOpen, setRenameBoardDialogOpen] = useState(false);
  const [renamingBoard, setRenamingBoard] = useState<Board | null>(null);
  const [renameBoardTitle, setRenameBoardTitle] = useState('');
  const [renameBoardDesc, setRenameBoardDesc] = useState('');

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
  const handleSaveBoard = () => {
    if (!newBoardTitle.trim()) return;
    addBoard(newBoardTitle.trim(), newBoardDesc.trim());
    setNewBoardTitle('');
    setNewBoardDesc('');
    setBoardDialogOpen(false);
  };

  // Add list (column) inline
  const handleCreateList = () => {
    if (!newListTitle.trim() || !activeBoard) return;
    addStatusToBoard(activeBoard.id, newListTitle.trim());
    setNewListTitle('');
    setIsAddingList(false);
  };

  // Add card inline - only title and empty description (no priority, no assignee)
  const handleCreateCardInline = (columnId: string) => {
    if (!newCardTitle.trim() || !activeBoard) return;
    addTask({
      boardId: activeBoard.id,
      columnId,
      title: newCardTitle.trim(),
      description: '',
    });
    setNewCardTitle('');
    setAddingCardColId(null);
  };

  // Open Edit List
  const handleOpenEditList = (col: BoardColumn) => {
    setEditingCol(col);
    setStatusTitle(col.title);
    setEditStatusDialogOpen(true);
  };

  const handleSaveEditList = () => {
    if (!statusTitle.trim() || !activeBoard || !editingCol) return;
    editStatus(activeBoard.id, editingCol.id, statusTitle.trim());
    setEditStatusDialogOpen(false);
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
    await editBoard(renamingBoard.id, renameBoardTitle.trim(), renameBoardDesc.trim());
    handleCloseRenameBoard();
  };

  const handleArchiveBoard = async () => {
    if (!menuBoard) return;
    const boardId = menuBoard.id;
    setBoardMenuAnchor(null);
    setMenuBoard(null);
    await deleteBoard(boardId);
    if (activeBoardId === boardId) {
      setActiveBoardId('');
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

  const handleArchiveStatus = async () => {
    if (!menuColumn || !activeBoard) return;
    const colId = menuColumn.id;
    setStatusMenuAnchor(null);
    setMenuColumn(null);
    await deleteStatus(activeBoard.id, colId);
  };

  // Board 3-dots menu element (Only Rename and Archive)
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
      <MenuItem
        onClick={handleArchiveBoard}
        disabled={boards.length <= 1 || isMutating}
        sx={{ color: 'error.main' }}
      >
        {isMutating ? (
          <CircularProgress size={16} thickness={5} sx={{ mr: 1.2, color: 'error.main' }} />
        ) : (
          <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {isMutating ? 'Arquivando...' : 'Arquivar'}
        </Typography>
      </MenuItem>
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
      <DialogTitle sx={{ fontWeight: 800 }}>Renomear Quadro</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Título do Quadro"
            fullWidth
            required
            autoFocus
            value={renameBoardTitle}
            onChange={(e) => setRenameBoardTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveRenameBoard();
              }
            }}
          />
          <TextField
            label="Descrição (Opcional)"
            fullWidth
            multiline
            rows={2}
            value={renameBoardDesc}
            onChange={(e) => setRenameBoardDesc(e.target.value)}
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
      <MenuItem onClick={handleOpenEditStatus} disabled={isMutating}>
        <EditIcon fontSize="small" sx={{ mr: 1.2, color: 'text.secondary' }} />
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          Editar
        </Typography>
      </MenuItem>
      <MenuItem
        onClick={handleArchiveStatus}
        disabled={Boolean(activeBoard && activeBoard.columns.length <= 1) || isMutating}
        sx={{ color: 'error.main' }}
      >
        {isMutating ? (
          <CircularProgress size={16} thickness={5} sx={{ mr: 1.2, color: 'error.main' }} />
        ) : (
          <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
        )}
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {isMutating ? 'Arquivando...' : 'Arquivar'}
        </Typography>
      </MenuItem>
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

  const handleSaveCardModal = () => {
    if (!cardFormTitle.trim() || !selectedTask) return;
    const trimmedTitle = cardFormTitle.trim();
    editTask(selectedTask.id, {
      title: trimmedTitle,
      description: cardFormDesc,
    });
    // Keep the local snapshot in sync so the save button hides when there are no pending changes
    setSelectedTask({ ...selectedTask, title: trimmedTitle, description: cardFormDesc });
    setIsEditingDesc(false);
  };

  const handleDuplicateTask = () => {
    if (!selectedTask || !activeBoard) return;
    addTask({
      boardId: activeBoard.id,
      columnId: selectedTask.columnId,
      title: `${selectedTask.title} (Cópia)`,
      description: cardFormDesc || selectedTask.description || '',
    });
    setCardModalOpen(false);
  };

  const handleMoveTaskToCol = (targetColId: string) => {
    if (!selectedTask) return;
    moveTaskStatus(selectedTask.id, targetColId);
    setMoveMenuAnchor(null);
    setCardModalOpen(false);
  };

  const handleArchiveTask = () => {
    if (selectedTask) {
      deleteTask(selectedTask.id);
      setCardMenuAnchor(null);
      setCardModalOpen(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggingTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColId(colId);
  };

  const handleDragLeave = () => {
    setDragOverColId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggingTaskId;
    if (taskId && !isMutating) {
      moveTaskStatus(taskId, targetColId);
    }
    setDraggingTaskId(null);
    setDragOverColId(null);
  };

  // All hooks are declared above this line — early returns for loading/state
  // branches only happen after every hook has run, on every render.
  if (isLoading) {
    return (
      <PageContainer>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress color="primary" />
        </Box>
      </PageContainer>
    );
  }

  // ==========================================
  // VIEW 1: BOARDS SELECTION SCREEN (ENTRADA)
  // ==========================================
  if (!activeBoard) {
    return (
      <PageContainer disableMaxWidth>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Selecione um Quadro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Escolha um dos quadros abaixo para visualizar e gerenciar suas tarefas
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setBoardDialogOpen(true)}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Novo Quadro
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {boards.slice(0, visibleBoardsCount).map((board) => {
            return (
              <Grid key={board.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  onClick={() => setActiveBoardId(board.id)}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    cursor: 'pointer',
                    border: '1px solid #E2E8F0',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.12)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: 'rgba(220, 38, 38, 0.1)',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <BoardIcon />
                      </Box>
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
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.05rem' }}>
                      {board.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0, minHeight: 40 }}>
                      {board.description || 'Quadro de gestão de tarefas e status.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* PAGINATION: "Mostrar mais Quadros" */}
        {visibleBoardsCount < boards.length && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleBoardsCount((c) => c + BOARDS_PAGE_SIZE)}
              sx={{
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: 'text.primary',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              Mostrar mais Quadros
            </Button>
          </Box>
        )}

        {/* CREATE NEW BOARD DIALOG */}
        <Dialog open={boardDialogOpen} onClose={() => setBoardDialogOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>Novo Quadro</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                label="Título do Quadro"
                fullWidth
                required
                autoFocus
                placeholder="Ex: Projetos, Marketing, Suporte"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
              />
              <TextField
                label="Descrição (Opcional)"
                fullWidth
                multiline
                rows={2}
                value={newBoardDesc}
                onChange={(e) => setNewBoardDesc(e.target.value)}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setBoardDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="contained"
              onClick={handleSaveBoard}
              disabled={!newBoardTitle.trim() || isMutating}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              {isMutating ? 'Criando...' : 'Criar Quadro'}
            </Button>
          </DialogActions>
        </Dialog>

        {boardMenuElement}
        {renameBoardDialogElement}
      </PageContainer>
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

  return (
    <PageContainer disableMaxWidth sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Top Header of the Selected Board */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: '1px solid #E2E8F0',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveBoardId('')}
            sx={{
              borderRadius: 2,
              borderColor: '#CBD5E1',
              color: 'text.primary',
              '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
            }}
          >
            Trocar de Quadro
          </Button>

          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', fontSize: '1.2rem' }}>
            {activeBoard.title}
          </Typography>

          {activeBoard.description && (
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
              • {activeBoard.description}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            onClick={(e) => {
              setBoardMenuAnchor(e.currentTarget);
              setMenuBoard(activeBoard);
            }}
            title="Opções do quadro"
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
        </Box>
      </Box>

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
          const colTasks = boardTasks.filter((t) => t.columnId === column.id);
          const visibleColTasks = [...colTasks, ...(extraTasksByColumn[column.id] || [])];
          const hasMoreTasks = columnHasMore[column.id] ?? false;
          const isLoadingMoreTasks = Boolean(columnLoadingMore[column.id]);
          const isDraggingOver = dragOverColId === column.id;

          return (
            <Box
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              sx={{
                flex: '0 0 auto',
                width: 'fit-content',
                minWidth: 280,
                maxWidth: 400,
                maxHeight: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isDraggingOver ? '#F9F1D0' : '#F1F2F4',
                borderRadius: 2.5,
                border: isDraggingOver ? '2px dashed #B8860B' : '1px solid #E2E8F0',
                transition: 'background-color 0.15s ease, border 0.15s ease',
              }}
            >
              {/* List Header (NO COLOR STRIP / BAR AT TOP) */}
              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#172B4D' }}>
                    {column.title}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
                </Box>
              </Box>

              {/* Cards Container */}
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
                    draggable={!isMutating}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleOpenCardModal(task)}
                    sx={{
                      p: 1.75,
                      minHeight: 60,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.15)',
                      border: '1px solid #E2E8F0',
                      cursor: isMutating ? 'default' : 'grab',
                      opacity: isMutating ? 0.7 : 1,
                      '&:hover': {
                        boxShadow: '0 2px 6px rgba(9, 30, 66, 0.2)',
                        borderColor: '#B8860B',
                      },
                      '&:active': { cursor: isMutating ? 'default' : 'grabbing' },
                    }}
                  >
                    {/* Card Title */}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#172B4D', lineHeight: 1.35 }}>
                      {task.title}
                    </Typography>

                    {/* Trello Badges (e.g. Description Indicator) */}
                    {task.description && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.8, color: '#626F86' }} title="Este cartão tem uma descrição detalhada">
                        <DescriptionIcon sx={{ fontSize: 16 }} />
                      </Box>
                    )}
                  </Card>
                ))}

                {/* Pagination: fetches more tasks of this status from the backend on scroll */}
                {hasMoreTasks && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                    {isLoadingMoreTasks ? (
                      <CircularProgress size={16} thickness={5} />
                    ) : (
                      <Typography variant="caption" sx={{ color: '#626F86' }}>
                        Role para ver mais tarefas
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Inline Card Creator Form */}
                {addingCardColId === column.id ? (
                  <Box sx={{ mt: 0.5, bgcolor: '#FFFFFF', p: 1, borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                          handleCreateCardInline(column.id);
                        }
                      }}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handleCreateCardInline(column.id)}
                        disabled={!newCardTitle.trim() || isMutating}
                        sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        {isMutating ? 'Adicionando...' : 'Adicionar cartão'}
                      </Button>
                      <IconButton size="small" onClick={() => setAddingCardColId(null)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : null}
              </Box>

              {/* Bottom "+ Adicionar um cartão" button (like Trello) */}
              {addingCardColId !== column.id && (
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

        {/* PAGINATION: "Mostrar mais status" */}
        {visibleColumnsCount < activeBoard.columns.length && (
          <Box sx={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-start', pt: 1.5 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleColumnsCount((c) => c + STATUS_PAGE_SIZE)}
              sx={{
                borderRadius: 2,
                borderColor: '#CBD5E1',
                color: 'text.primary',
                whiteSpace: 'nowrap',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
              }}
            >
              Mostrar mais status
            </Button>
          </Box>
        )}

        {/* "+ Adicionar outra lista" Column */}
        <Box sx={{ flex: '0 0 280px', width: 280 }}>
          {isAddingList ? (
            <Box sx={{ bgcolor: '#F1F2F4', p: 1.5, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
              <TextField
                autoFocus
                placeholder="Insira o título da lista / status..."
                fullWidth
                size="small"
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateList();
                  }
                }}
                sx={{ mb: 1.5, bgcolor: '#FFFFFF', borderRadius: 1 }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleCreateList}
                  disabled={!newListTitle.trim() || isMutating}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
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
      </Box>

      {/* EDIT STATUS / LIST DIALOG */}
      <Dialog open={editStatusDialogOpen} onClose={() => setEditStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Editar Lista / Status
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título da Lista"
              fullWidth
              required
              autoFocus
              value={statusTitle}
              onChange={(e) => setStatusTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveEditList();
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditStatusDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveEditList}
            disabled={!statusTitle.trim() || isMutating}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            {isMutating ? 'Salvando...' : 'Salvar'}
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
              <IconButton
                size="small"
                onClick={(e) => setCardMenuAnchor(e.currentTarget)}
                title="Mais ações"
                sx={{ color: 'text.secondary', p: 0.8 }}
              >
                <MoreIcon />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => {
                  setCardModalOpen(false);
                  setIsEditingDesc(false);
                }}
                sx={{ color: 'text.secondary', p: 0.8 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        {/* 3-dots Menu for Card (Arquivar) */}
        <Menu
          anchorEl={cardMenuAnchor}
          open={Boolean(cardMenuAnchor)}
          onClose={() => setCardMenuAnchor(null)}
          slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 160 } } }}
        >
          <MenuItem onClick={handleArchiveTask} disabled={isMutating} sx={{ color: 'error.main' }}>
            {isMutating ? (
              <CircularProgress size={16} thickness={5} sx={{ mr: 1.2, color: 'error.main' }} />
            ) : (
              <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
            )}
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {isMutating ? 'Arquivando...' : 'Arquivar cartão'}
            </Typography>
          </MenuItem>
        </Menu>

        <DialogContent dividers sx={{ px: 3.5, py: 3, bgcolor: '#FFFFFF' }}>
          <Grid container spacing={3.5}>
            {/* MAIN COLUMN: SOMENTE DESCRIÇÃO (PREVIEW POR PADRÃO, EDITOR AO CLICAR) */}
            <Grid size={{ xs: 12, md: 8.5 }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DescriptionIcon sx={{ color: '#172B4D', fontSize: 22 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#172B4D' }}>
                      Descrição
                    </Typography>
                  </Box>
                  {!isEditingDesc && !isDescEmpty(cardFormDesc) && (
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
                      onClick={() => setIsEditingDesc(true)}
                      sx={{
                        bgcolor: '#091E420F',
                        borderRadius: 2,
                        minHeight: 75,
                        p: 2,
                        cursor: 'pointer',
                        color: '#44546F',
                        fontSize: '0.925rem',
                        fontWeight: 500,
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          bgcolor: '#091E421F',
                          color: '#172B4D',
                        },
                      }}
                    >
                      Adicionar uma descrição mais detalhada...
                    </Box>
                  ) : (
                    /* Rich Text Preview - click to open Quill */
                    <Box
                      onClick={() => setIsEditingDesc(true)}
                      title="Clique para editar"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        cursor: 'pointer',
                        minHeight: 60,
                        bgcolor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        transition: 'all 0.15s ease-in-out',
                        '&:hover': {
                          bgcolor: '#F1F5F9',
                          borderColor: '#CBD5E1',
                        },
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

                <Button
                  fullWidth
                  size="small"
                  disabled={isMutating}
                  startIcon={isMutating ? <CircularProgress size={14} thickness={5} sx={{ color: '#172B4D' }} /> : <MoveIcon fontSize="small" />}
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

                {/* Move to list popup menu */}
                <Menu
                  anchorEl={moveMenuAnchor}
                  open={Boolean(moveMenuAnchor)}
                  onClose={() => setMoveMenuAnchor(null)}
                  slotProps={{ paper: { sx: { borderRadius: 2, minWidth: 180 } } }}
                >
                  <Typography variant="caption" sx={{ px: 2, py: 1, display: 'block', fontWeight: 700, color: '#626F86' }}>
                    Mover para lista:
                  </Typography>
                  {activeBoard?.columns.map((col) => (
                    <MenuItem
                      key={col.id}
                      selected={col.id === selectedTask?.columnId}
                      onClick={() => handleMoveTaskToCol(col.id)}
                      disabled={isMutating}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {col.title} {col.id === selectedTask?.columnId && ' (atual)'}
                    </MenuItem>
                  ))}
                </Menu>

                <Button
                  fullWidth
                  size="small"
                  disabled={isMutating}
                  startIcon={isMutating ? <CircularProgress size={14} thickness={5} sx={{ color: '#172B4D' }} /> : <CopyIcon fontSize="small" />}
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

                <Button
                  fullWidth
                  size="small"
                  disabled={isMutating}
                  startIcon={isMutating ? <CircularProgress size={14} thickness={5} sx={{ color: '#B8860B' }} /> : <ArchiveIcon fontSize="small" />}
                  onClick={handleArchiveTask}
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
                  {isMutating ? 'Processando...' : 'Arquivar'}
                </Button>
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
          {hasTaskChanges && (
            <Button
              variant="contained"
              onClick={handleSaveCardModal}
              disabled={isMutating}
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                px: 3.5,
                py: 1,
                fontWeight: 700,
                borderRadius: 2,
              }}
            >
              {isMutating ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Menus and Dialogs */}
      {boardMenuElement}
      {renameBoardDialogElement}
      {statusMenuElement}
    </PageContainer>
  );
};
