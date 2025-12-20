import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Fab,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Reply as ReplyIcon,
  MarkEmailRead as MarkEmailReadIcon,
  MarkEmailUnread as MarkEmailUnreadIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import apiService from '../../data/apiService';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [replyFilter, setReplyFilter] = useState('all');

  // Fetch contact messages
  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await apiService.getContactMessages();
      setMessages(Array.isArray(response) ? response : response.data || []);
      console.log('Messages fetched:', response);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Filter messages based on status, subject, and search term
  const filteredMessages = messages.filter(message => {
    const matchesStatus = filterStatus === 'all' || message.status === filterStatus;
    const matchesSubject = filterSubject === 'all' || message.subject === filterSubject;
    const matchesSearch = searchTerm === '' || 
      message.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Date filter
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const messageDate = new Date(message.created_at);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = messageDate.toDateString() === now.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = messageDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = messageDate >= monthAgo;
          break;
      }
    }
    
    // Reply filter
    let matchesReply = true;
    if (replyFilter !== 'all') {
      if (replyFilter === 'replied') {
        matchesReply = message.status === 'replied';
      } else if (replyFilter === 'not_replied') {
        matchesReply = message.status !== 'replied';
      }
    }
    
    return matchesStatus && matchesSubject && matchesSearch && matchesDate && matchesReply;
  });

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'error';
      case 'read': return 'warning';
      case 'replied': return 'success';
      case 'closed': return 'default';
      default: return 'default';
    }
  };

  // Get status text in Uzbek
  const getStatusText = (status) => {
    switch (status) {
      case 'new': return 'Yangi';
      case 'read': return 'O\'qilgan';
      case 'replied': return 'Javob berilgan';
      case 'closed': return 'Yopilgan';
      default: return status;
    }
  };

  // Get subject text in Uzbek
  const getSubjectText = (subject) => {
    switch (subject) {
      case 'technical': return 'Texnik yordam';
      case 'billing': return 'To\'lov masalalari';
      case 'feature': return 'Yangi funksiya taklifi';
      case 'partnership': return 'Hamkorlik';
      case 'other': return 'Boshqa';
      default: return subject;
    }
  };

  // Update message status
  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      await apiService.updateContactMessageStatus(messageId, { status: newStatus });
      setSuccessMessage('Xabar holati yangilandi');
      fetchMessages();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to update message status:', error);
    }
  };

  // Reply to message
  const replyToMessage = async () => {
    if (!replyText.trim()) return;
    
    try {
      const response = await apiService.replyToContactMessage(selectedMessage.id, { admin_reply: replyText });
      
      // Show success message based on email sending status
      if (response.email_sent) {
        setSuccessMessage('Javob yuborildi va email xabar yuborildi!');
      } else {
        setSuccessMessage('Javob yuborildi (email yuborishda muammo)');
      }
      
      fetchMessages();
      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedMessage(null);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      console.error('Failed to reply to message:', error);
    }
  };

  // Open message details
  const openMessageDetails = (message) => {
    setSelectedMessage(message);
    // Mark as read if it's new
    if (message.status === 'new') {
      updateMessageStatus(message.id, 'read');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1e293b' }}>
          Xabarlar
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EmailIcon sx={{ color: '#6366f1' }} />
          <Typography variant="h6" sx={{ color: '#6366f1', fontWeight: 600 }}>
            {filteredMessages.length} ta xabar
          </Typography>
        </Box>
      </Box>

      {/* Success Alert */}
      {successMessage && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSuccessMessage('')}
        >
          {successMessage}
        </Alert>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mr: 2 }}>
            <FilterIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            Filtr va Qidiruv
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Search */}
          <TextField
            placeholder="Qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 250 }}
          />

          {/* Status Filter */}
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Holati</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Holati"
            >
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="new">Yangi</MenuItem>
              <MenuItem value="read">O'qilgan</MenuItem>
              <MenuItem value="replied">Javob berilgan</MenuItem>
              <MenuItem value="closed">Yopilgan</MenuItem>
            </Select>
          </FormControl>

          {/* Subject Filter */}
          <FormControl sx={{ minWidth: 180 }}>
            <InputLabel>Mavzu</InputLabel>
            <Select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              label="Mavzu"
            >
              <MenuItem value="all">Barchasi</MenuItem>
              <MenuItem value="technical">Texnik yordam</MenuItem>
              <MenuItem value="billing">To'lov masalalari</MenuItem>
              <MenuItem value="feature">Yangi funksiya taklifi</MenuItem>
              <MenuItem value="partnership">Hamkorlik</MenuItem>
              <MenuItem value="other">Boshqa</MenuItem>
            </Select>
          </FormControl>

          {/* Clear Filters */}
          <Button
            variant="outlined"
            onClick={() => {
              setFilterStatus('all');
              setFilterSubject('all');
              setSearchTerm('');
            }}
            startIcon={<FilterIcon />}
          >
            Tozalash
          </Button>
        </Box>
      </Paper>

      {/* Messages Table */}
      <TableContainer component={Paper} sx={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 1 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f9fafb' }}>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Ism</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Telefon</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Mavzu</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Holati</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Sana</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#374151', borderBottom: '1px solid #e5e7eb' }}>Amallar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMessages.map((message) => (
              <TableRow 
                key={message.id}
                sx={{ 
                  '&:hover': { backgroundColor: '#f9fafb' },
                  backgroundColor: message.status === 'new' ? '#fef3f2' : '#ffffff',
                  borderBottom: '1px solid #e5e7eb'
                }}
              >
                <TableCell sx={{ fontWeight: message.status === 'new' ? 600 : 400, borderBottom: '1px solid #f3f4f6' }}>
                  {message.name}
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>{message.email}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>{message.phone || '-'}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>{getSubjectText(message.subject)}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                  <Chip
                    label={getStatusText(message.status)}
                    color={getStatusColor(message.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>{formatDate(message.created_at)}</TableCell>
                <TableCell sx={{ borderBottom: '1px solid #f3f4f6' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => openMessageDetails(message)}
                      color="primary"
                      title="Ko'rish"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    {message.status !== 'replied' && (
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedMessage(message);
                          setReplyDialogOpen(true);
                        }}
                        color="success"
                        title="Javob berish"
                      >
                        <ReplyIcon />
                      </IconButton>
                    )}
                    {message.status === 'new' && (
                      <IconButton
                        size="small"
                        onClick={() => updateMessageStatus(message.id, 'read')}
                        color="warning"
                        title="O'qilgan deb belgilash"
                      >
                        <MarkEmailReadIcon />
                      </IconButton>
                    )}
                    {message.status === 'replied' && (
                      <Chip
                        label="Email yuborildi"
                        color="success"
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredMessages.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              Xabarlar topilmadi
            </Typography>
          </Box>
        )}
      </TableContainer>

      {/* Message Details Dialog */}
      <Dialog
        open={!!selectedMessage && !replyDialogOpen}
        onClose={() => setSelectedMessage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Xabar tafsilotlari</Typography>
            <IconButton onClick={() => setSelectedMessage(null)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        {selectedMessage && (
          <DialogContent sx={{ pt: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Ism:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedMessage.name}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Email:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedMessage.email}</Typography>
              
              {selectedMessage.phone && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Telefon:</Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>{selectedMessage.phone}</Typography>
                </>
              )}
              
              <Typography variant="subtitle2" color="text.secondary">Mavzu:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{getSubjectText(selectedMessage.subject)}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Xabar:</Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 2, 
                  p: 2, 
                  backgroundColor: '#f8fafc', 
                  borderRadius: 1,
                  whiteSpace: 'pre-wrap'
                }}
              >
                {selectedMessage.message}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Yuborilgan sana:</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{formatDate(selectedMessage.created_at)}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Holati:</Typography>
              <Chip
                label={getStatusText(selectedMessage.status)}
                color={getStatusColor(selectedMessage.status)}
                sx={{ mb: 2 }}
              />
              
              {selectedMessage.admin_reply && (
                <>
                  <Typography variant="subtitle2" color="text.secondary">Admin javobi:</Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      p: 2, 
                      backgroundColor: '#e0f2fe', 
                      borderRadius: 1,
                      whiteSpace: 'pre-wrap',
                      mb: 2
                    }}
                  >
                    {selectedMessage.admin_reply}
                  </Typography>
                  {selectedMessage.replied_by_name && (
                    <Typography variant="caption" color="text.secondary">
                      Javob bergan: {selectedMessage.replied_by_name} - {selectedMessage.replied_at && formatDate(selectedMessage.replied_at)}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </DialogContent>
        )}
        <DialogActions sx={{ borderTop: '1px solid #e2e8f0', px: 3, py: 2 }}>
          {selectedMessage?.status !== 'replied' && (
            <Button
              variant="contained"
              startIcon={<ReplyIcon />}
              onClick={() => {
                setReplyDialogOpen(true);
              }}
            >
              Javob berish
            </Button>
          )}
          <Button onClick={() => setSelectedMessage(null)}>
            Yopish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog
        open={replyDialogOpen}
        onClose={() => setReplyDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedMessage?.name} ga javob berish
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            label="Javob matni"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Javobingizni yozing..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>
            Bekor qilish
          </Button>
          <Button
            variant="contained"
            onClick={replyToMessage}
            disabled={!replyText.trim()}
          >
            Javob yuborish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContactMessages;