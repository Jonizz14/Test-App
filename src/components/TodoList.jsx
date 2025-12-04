import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Assignment as TaskIcon,
} from '@mui/icons-material';

const TodoList = ({ 
  title = "Ishlar ro'yxati", 
  tasks = [], 
  onTasksChange,
  maxTasks = 20,
  showFilters = true,
  defaultFilter = 'all',
  allowPriority = true,
  allowDueDate = true 
}) => {
  const [todoTasks, setTodoTasks] = useState(tasks);
  const [newTask, setNewTask] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [editTaskPriority, setEditTaskPriority] = useState('medium');
  const [editTaskDueDate, setEditTaskDueDate] = useState('');
  const [filter, setFilter] = useState(defaultFilter);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    setTodoTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    if (onTasksChange) {
      onTasksChange(todoTasks);
    }
  }, [todoTasks, onTasksChange]);

  const addTask = () => {
    if (!newTask.trim()) return;
    
    if (todoTasks.length >= maxTasks) {
      alert(`Maksimal ${maxTasks} ta ish qo'shish mumkin`);
      return;
    }

    const task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      createdAt: new Date().toISOString(),
    };

    setTodoTasks([...todoTasks, task]);
    setNewTask('');
    setNewTaskPriority('medium');
    setNewTaskDueDate('');
  };

  const toggleTask = (taskId) => {
    setTodoTasks(todoTasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTodoTasks(todoTasks.filter(task => task.id !== taskId));
    setConfirmDialogOpen(false);
    setTaskToDelete(null);
  };

  const startEditTask = (task) => {
    setEditingTask(task.id);
    setEditTaskText(task.text);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate || '');
  };

  const saveEditTask = () => {
    if (!editTaskText.trim()) return;

    setTodoTasks(todoTasks.map(task =>
      task.id === editingTask 
        ? { 
            ...task, 
            text: editTaskText.trim(),
            priority: editTaskPriority,
            dueDate: editTaskDueDate
          } 
        : task
    ));
    setEditingTask(null);
    setEditTaskText('');
    setEditTaskPriority('medium');
    setEditTaskDueDate('');
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTaskText('');
    setEditTaskPriority('medium');
    setEditTaskDueDate('');
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Yuqori';
      case 'medium': return 'O\'rta';
      case 'low': return 'Past';
      default: return 'Noma\'lum';
    }
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getFilteredTasks = () => {
    switch (filter) {
      case 'completed':
        return todoTasks.filter(task => task.completed);
      case 'pending':
        return todoTasks.filter(task => !task.completed);
      case 'overdue':
        return todoTasks.filter(task => !task.completed && isOverdue(task.dueDate));
      case 'high':
        return todoTasks.filter(task => task.priority === 'high');
      default:
        return todoTasks;
    }
  };

  const filteredTasks = getFilteredTasks();
  const completedTasks = todoTasks.filter(task => task.completed);
  const pendingTasks = todoTasks.filter(task => !task.completed);
  const overdueTasks = todoTasks.filter(task => !task.completed && isOverdue(task.dueDate));

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setConfirmDialogOpen(true);
  };

  return (
    <Card sx={{
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <TaskIcon sx={{ mr: 1, color: '#2563eb' }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
            {title}
          </Typography>
          <Chip 
            label={`${todoTasks.length}/${maxTasks}`}
            size="small"
            color="primary"
            sx={{ ml: 'auto' }}
          />
        </Box>

        {todoTasks.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Hali ishlar qo'shilmagan. Quyida yangi ish qo'shishingiz mumkin.
          </Alert>
        ) : (
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary">
              Jami: {todoTasks.length} | 
              Tugallangan: {completedTasks.length} | 
              Qolgan: {pendingTasks.length}
              {overdueTasks.length > 0 && ` | Muddati o'tgan: ${overdueTasks.length}`}
            </Typography>
          </Box>
        )}

        {/* Add New Task */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Yangi ish qo'shing..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            sx={{ mb: 2 }}
          />
          
          <Box display="flex" gap={2} mb={2} flexWrap="wrap">
            {allowPriority && (
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Ahamiyat</InputLabel>
                <Select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                  label="Ahamiyat"
                >
                  <MenuItem value="high">Yuqori</MenuItem>
                  <MenuItem value="medium">O'rta</MenuItem>
                  <MenuItem value="low">Past</MenuItem>
                </Select>
              </FormControl>
            )}

            {allowDueDate && (
              <TextField
                size="small"
                type="date"
                label="Muddat"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
            )}
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addTask}
            disabled={!newTask.trim() || todoTasks.length >= maxTasks}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              }
            }}
          >
            Qo'shish
          </Button>
        </Box>

        {/* Filters */}
        {showFilters && todoTasks.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Filtr</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Filtr"
              >
                <MenuItem value="all">Barcha</MenuItem>
                <MenuItem value="pending">Tugallanmagan</MenuItem>
                <MenuItem value="completed">Tugallangan</MenuItem>
                <MenuItem value="overdue">Muddati o'tgan</MenuItem>
                {allowPriority && <MenuItem value="high">Yuqori ahamiyat</MenuItem>}
              </Select>
            </FormControl>
          </Box>
        )}

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <List>
            {filteredTasks.map((task, index) => (
              <React.Fragment key={task.id}>
                <ListItem sx={{ px: 0 }}>
                  <Checkbox
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    sx={{ mr: 1 }}
                  />
                  
                  {editingTask === task.id ? (
                    <Box sx={{ flex: 1, mr: 2 }}>
                      <TextField
                        fullWidth
                        value={editTaskText}
                        onChange={(e) => setEditTaskText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveEditTask();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        sx={{ mb: 1 }}
                      />
                      
                      <Box display="flex" gap={2} flexWrap="wrap">
                        {allowPriority && (
                          <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Ahamiyat</InputLabel>
                            <Select
                              value={editTaskPriority}
                              onChange={(e) => setEditTaskPriority(e.target.value)}
                              label="Ahamiyat"
                            >
                              <MenuItem value="high">Yuqori</MenuItem>
                              <MenuItem value="medium">O'rta</MenuItem>
                              <MenuItem value="low">Past</MenuItem>
                            </Select>
                          </FormControl>
                        )}

                        {allowDueDate && (
                          <TextField
                            size="small"
                            type="date"
                            label="Muddat"
                            value={editTaskDueDate}
                            onChange={(e) => setEditTaskDueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: 120 }}
                          />
                        )}
                      </Box>
                      
                      <Box display="flex" gap={1} mt={1}>
                        <Button size="small" onClick={saveEditTask} variant="contained">
                          <CheckIcon fontSize="small" />
                        </Button>
                        <Button size="small" onClick={cancelEdit}>
                          <CloseIcon fontSize="small" />
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                          <Typography
                            variant="body1"
                            sx={{
                              textDecoration: task.completed ? 'line-through' : 'none',
                              color: task.completed ? '#94a3b8' : '#1e293b',
                              flex: 1
                            }}
                          >
                            {task.text}
                          </Typography>
                          <Chip
                            label={getPriorityLabel(task.priority)}
                            size="small"
                            color={getPriorityColor(task.priority)}
                            sx={{ fontSize: '0.625rem' }}
                          />
                          {task.dueDate && (
                            <Chip
                              label={new Date(task.dueDate).toLocaleDateString('uz-UZ')}
                              size="small"
                              color={isOverdue(task.dueDate) && !task.completed ? 'error' : 'default'}
                              variant="outlined"
                              sx={{ fontSize: '0.625rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="textSecondary">
                          Qo'shildi: {new Date(task.createdAt).toLocaleString('uz-UZ')}
                        </Typography>
                      }
                    />
                  )}
                  
                  <ListItemSecondaryAction>
                    <Box display="flex">
                      <IconButton
                        size="small"
                        onClick={() => startEditTask(task)}
                        sx={{ color: '#2563eb', mr: 0.5 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteClick(task)}
                        sx={{ color: '#dc2626' }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < filteredTasks.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="textSecondary">
              {filter === 'all' ? 'Ishlar yo\'q' : `Filtr bo'yicha ishlar topilmadi`}
            </Typography>
          </Box>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Ishni o'chirish</DialogTitle>
          <DialogContent>
            <Typography>
              "{taskToDelete?.text}" ishini o'chirishni xohlaysizmi?
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>Bekor qilish</Button>
            <Button 
              onClick={() => deleteTask(taskToDelete?.id)} 
              color="error" 
              variant="contained"
            >
              O'chirish
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TodoList;