import React, { useState, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Checkbox,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from '@mui/icons-material';

const TodoList = ({ tasks = [], onChange }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  // Use ref for ID generation to avoid impure function calls during render
  const idCounterRef = useRef(0);
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `task-${idCounterRef.current}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleAddTask = useCallback(() => {
    if (newTaskText.trim()) {
      const newTask = {
        id: generateId(),
        text: newTaskText.trim(),
        completed: false,
        priority: 'medium',
        createdAt: new Date().toISOString(),
        type: 'manual'
      };
      onChange([...tasks, newTask]);
      setNewTaskText('');
    }
  }, [newTaskText, generateId, onChange, tasks]);

  const handleToggleTask = (taskId) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    onChange(updatedTasks);
  };

  const handleDeleteTask = (taskId) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    onChange(updatedTasks);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditText(task.text);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && editingTask) {
      const updatedTasks = tasks.map(task =>
        task.id === editingTask.id ? { ...task, text: editText.trim() } : task
      );
      onChange(updatedTasks);
      setEditDialogOpen(false);
      setEditingTask(null);
      setEditText('');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#1e293b' }}>
        Vazifalar ro'yxati ({tasks.length})
      </Typography>

      {/* Add new task */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Yangi vazifa qo'shish..."
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTask}
          disabled={!newTaskText.trim()}
          sx={{ minWidth: 'auto' }}
        >
          Qo'shish
        </Button>
      </Box>

      {/* Pending tasks */}
      {pendingTasks.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, color: '#64748b' }}>
            Bajarilmagan ({pendingTasks.length})
          </Typography>
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {pendingTasks.map((task) => (
              <ListItem key={task.id} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Checkbox
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon />}
                />
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? '#64748b' : '#1e293b'
                        }}
                      >
                        {task.text}
                      </Typography>
                      {task.priority && (
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority)}
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      )}
                      {task.type === 'suggestion' && (
                        <Chip
                          label="Taklif"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    task.createdAt ? new Date(task.createdAt).toLocaleDateString('uz-UZ') : null
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="Tahrirlash">
                    <IconButton edge="end" onClick={() => handleEditTask(task)} size="small">
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="O'chirish">
                    <IconButton edge="end" onClick={() => handleDeleteTask(task.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, color: '#64748b' }}>
            Bajarilgan ({completedTasks.length})
          </Typography>
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {completedTasks.map((task) => (
              <ListItem key={task.id} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Checkbox
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  icon={<RadioButtonUncheckedIcon />}
                  checkedIcon={<CheckCircleIcon />}
                />
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        textDecoration: 'line-through',
                        color: '#64748b'
                      }}
                    >
                      {task.text}
                    </Typography>
                  }
                  secondary={
                    task.createdAt ? new Date(task.createdAt).toLocaleDateString('uz-UZ') : null
                  }
                />
                <ListItemSecondaryAction>
                  <Tooltip title="O'chirish">
                    <IconButton edge="end" onClick={() => handleDeleteTask(task.id)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {tasks.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4, color: '#64748b' }}>
          <Typography>Hozircha vazifalar yo'q</Typography>
          <Typography variant="body2">Yuqoridagi maydonga vazifa qo'shing</Typography>
        </Box>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Vazifani tahrirlash</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Bekor qilish</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={!editText.trim()}>
            Saqlash
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TodoList;