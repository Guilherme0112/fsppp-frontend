import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
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
import { QuillEditor } from '../common/QuillEditor';

export const TasksView: React.FC = () => {
  const {
    boards,
    addBoard,
    deleteBoard,
    addStatusToBoard,
    editStatus,
    deleteStatus,
    tasks,
    addTask,
    editTask,
    moveTaskStatus,
    deleteTask,
  } = useApp();

  // Active selected board (null means showing the boards selection grid)
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Create Board Dialog
  const [boardDialogOpen, setBoardDialogOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

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

  const isDescEmpty = (html?: string) => {
    if (!html) return true;
    const stripped = html.replace(/<[^>]*>/g, '').trim();
    return stripped.length === 0;
  };

  // Drag and Drop state
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColId, setDragOverColId] = useState<string | null>(null);

  const activeBoard: Board | undefined = boards.find((b) => b.id === selectedBoardId);

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
    addStatusToBoard(activeBoard.id, newListTitle.trim(), '#E2E8F0');
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
    editStatus(activeBoard.id, editingCol.id, statusTitle.trim(), '#E2E8F0');
    setEditStatusDialogOpen(false);
  };

  // Card Modal
  const handleOpenCardModal = (task: Task) => {
    setSelectedTask(task);
    setCardFormTitle(task.title);
    setCardFormDesc(task.description || '');
    setIsEditingDesc(false);
    setCardModalOpen(true);
  };

  const handleSaveDescInline = () => {
    if (!selectedTask) return;
    editTask(selectedTask.id, { description: cardFormDesc });
    setSelectedTask((prev) => (prev ? { ...prev, description: cardFormDesc } : null));
    setIsEditingDesc(false);
  };

  const handleCancelDescInline = () => {
    setCardFormDesc(selectedTask?.description || '');
    setIsEditingDesc(false);
  };

  const handleSaveCardModal = () => {
    if (!cardFormTitle.trim() || !selectedTask) return;
    editTask(selectedTask.id, {
      title: cardFormTitle.trim(),
      description: cardFormDesc,
    });
    setIsEditingDesc(false);
    setCardModalOpen(false);
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
    if (taskId) {
      moveTaskStatus(taskId, targetColId);
    }
    setDraggingTaskId(null);
    setDragOverColId(null);
  };

  // ==========================================
  // VIEW 1: BOARDS SELECTION SCREEN (ENTRADA)
  // ==========================================
  if (!activeBoard) {
    return (
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
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
          {boards.map((board) => {
            const boardTasksCount = tasks.filter((t) => t.boardId === board.id).length;
            return (
              <Grid key={board.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  onClick={() => setSelectedBoardId(board.id)}
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
                      {boards.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBoard(board.id);
                          }}
                          title="Excluir quadro"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: '1.05rem' }}>
                      {board.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {board.description || 'Quadro de gestão de tarefas e status.'}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5, borderTop: '1px solid #F1F5F9' }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        {board.columns.length} listas
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        {boardTasksCount} {boardTasksCount === 1 ? 'tarefa' : 'tarefas'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {/* Quick Create Board Card */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Box
              onClick={() => setBoardDialogOpen(true)}
              sx={{
                p: 3,
                height: '100%',
                minHeight: 160,
                borderRadius: 2.5,
                border: '2px dashed #CBD5E1',
                bgcolor: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                textAlign: 'center',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'rgba(220, 38, 38, 0.04)',
                },
              }}
            >
              <AddIcon sx={{ color: 'primary.main', fontSize: '2rem', mb: 1 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Criar Novo Quadro
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Adicione um novo espaço de tarefas
              </Typography>
            </Box>
          </Grid>
        </Grid>

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
              disabled={!newBoardTitle.trim()}
              sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
            >
              Criar Quadro
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  // ==========================================
  // VIEW 2: SELECTED BOARD'S TASKS & LISTS (TRELLO VIEW)
  // ==========================================
  const boardTasks = tasks.filter((t) => t.boardId === activeBoard.id);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
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
            onClick={() => setSelectedBoardId(null)}
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
          <Button
            size="small"
            variant="text"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => {
              deleteBoard(activeBoard.id);
              setSelectedBoardId(null);
            }}
            disabled={boards.length <= 1}
          >
            Excluir Quadro
          </Button>
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
          pb: 2,
          pr: 2,
        }}
      >
        {/* Render Each Column (List) */}
        {activeBoard.columns.map((column) => {
          const colTasks = boardTasks.filter((t) => t.columnId === column.id);
          const isDraggingOver = dragOverColId === column.id;

          return (
            <Box
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
              sx={{
                flex: '0 0 280px',
                width: 280,
                maxHeight: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: isDraggingOver ? '#FEE2E2' : '#F1F2F4',
                borderRadius: 2.5,
                border: isDraggingOver ? '2px dashed #DC2626' : '1px solid #E2E8F0',
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
                  <Typography
                    variant="caption"
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.06)',
                      px: 0.8,
                      py: 0.2,
                      borderRadius: 1,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      color: 'text.secondary',
                    }}
                  >
                    {colTasks.length}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenEditList(column)}
                    title="Editar lista"
                    sx={{ p: 0.5, color: '#626F86' }}
                  >
                    <MoreIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              {/* Cards Container */}
              <Box
                sx={{
                  px: 1,
                  py: 0.5,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  flexGrow: 1,
                }}
              >
                {colTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => handleOpenCardModal(task)}
                    sx={{
                      p: 1.5,
                      bgcolor: '#FFFFFF',
                      borderRadius: 2,
                      boxShadow: '0 1px 2px rgba(9, 30, 66, 0.15)',
                      border: '1px solid #E2E8F0',
                      cursor: 'grab',
                      '&:hover': {
                        boxShadow: '0 2px 6px rgba(9, 30, 66, 0.2)',
                        borderColor: '#DC2626',
                      },
                      '&:active': { cursor: 'grabbing' },
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
                        disabled={!newCardTitle.trim()}
                        sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                      >
                        Adicionar cartão
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
                  disabled={!newListTitle.trim()}
                  sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
                >
                  Adicionar lista
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
                bgcolor: 'rgba(220, 38, 38, 0.06)',
                color: 'primary.main',
                borderRadius: 2.5,
                fontWeight: 700,
                border: '1px dashed #DC2626',
                '&:hover': { bgcolor: 'rgba(220, 38, 38, 0.12)' },
              }}
            >
              Adicionar outra lista
            </Button>
          )}
        </Box>
      </Box>

      {/* EDIT STATUS / LIST DIALOG */}
      <Dialog open={editStatusDialogOpen} onClose={() => setEditStatusDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Editar Lista / Status</span>
          {editingCol && activeBoard.columns.length > 1 && (
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                deleteStatus(activeBoard.id, editingCol.id);
                setEditStatusDialogOpen(false);
              }}
              title="Excluir esta lista"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Título da Lista"
              fullWidth
              required
              value={statusTitle}
              onChange={(e) => setStatusTitle(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {editingCol && activeBoard.columns.length > 1 && (
            <Button
              color="error"
              onClick={() => {
                deleteStatus(activeBoard.id, editingCol.id);
                setEditStatusDialogOpen(false);
              }}
              sx={{ mr: 'auto', fontWeight: 600 }}
            >
              Excluir Lista
            </Button>
          )}
          <Button onClick={() => setEditStatusDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleSaveEditList}
            disabled={!statusTitle.trim()}
            sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}
          >
            Salvar
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
          <MenuItem onClick={handleArchiveTask} sx={{ color: 'error.main' }}>
            <ArchiveIcon fontSize="small" sx={{ mr: 1.2, color: 'error.main' }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Arquivar cartão
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
                  /* Quill Editor with Inline Salvar / Cancelar */
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <QuillEditor
                      value={cardFormDesc}
                      onChange={setCardFormDesc}
                      placeholder="Adicione uma descrição detalhada com tópicos, parágrafos, listas organizadas..."
                      minHeight={240}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveDescInline}
                        sx={{
                          bgcolor: 'primary.main',
                          '&:hover': { bgcolor: 'primary.dark' },
                          fontWeight: 600,
                          px: 2.5,
                          py: 0.8,
                          textTransform: 'none',
                          borderRadius: 1.5,
                        }}
                      >
                        Salvar
                      </Button>
                      <Button
                        size="small"
                        onClick={handleCancelDescInline}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: 'text.secondary',
                          px: 2,
                          py: 0.8,
                          borderRadius: 1.5,
                          '&:hover': { bgcolor: '#091E420F' },
                        }}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* SIDEBAR: APENAS AS AÇÕES */}
            <Grid size={{ xs: 12, md: 3.5 }}>
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
                      sx={{ fontSize: '0.875rem' }}
                    >
                      {col.title} {col.id === selectedTask?.columnId && ' (atual)'}
                    </MenuItem>
                  ))}
                </Menu>

                <Button
                  fullWidth
                  size="small"
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

                <Button
                  fullWidth
                  size="small"
                  startIcon={<ArchiveIcon fontSize="small" />}
                  onClick={handleArchiveTask}
                  sx={{
                    justifyContent: 'flex-start',
                    bgcolor: '#FEE2E2',
                    color: '#DC2626',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1,
                    px: 1.5,
                    borderRadius: 1.5,
                    '&:hover': { bgcolor: '#FECACA' },
                  }}
                >
                  Arquivar
                </Button>
              </Box>
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
          <Button
            variant="contained"
            onClick={handleSaveCardModal}
            disabled={!cardFormTitle.trim()}
            sx={{
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' },
              px: 3.5,
              py: 1,
              fontWeight: 700,
              borderRadius: 2,
            }}
          >
            Salvar Alterações
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
