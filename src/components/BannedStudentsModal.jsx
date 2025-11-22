import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import {
  Close as CloseIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const BannedStudentsModal = ({ open, onClose, bannedStudents, onUnbanStudent }) => {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          height: '70vh',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          backgroundColor: '#ffffff',
        },
      }}
    >
      <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <BlockIcon sx={{ color: '#dc2626', fontSize: '2rem' }} />
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Bloklangan o'quvchilar
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                {bannedStudents.length} ta bloklangan o'quvchi
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Banned Students List */}
        <Box sx={{ flex: 1, overflowY: 'auto' }}>
          {bannedStudents.length > 0 ? (
            <List sx={{ p: 0 }}>
              {bannedStudents.map((student, index) => (
                <React.Fragment key={student.id}>
                  <ListItem
                    sx={{
                      px: 0,
                      py: 2,
                      backgroundColor: '#fef2f2',
                      borderRadius: '8px',
                      mb: 1,
                      border: '1px solid #fecaca',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography sx={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: '#dc2626'
                          }}>
                            {student.name}
                          </Typography>
                          <Chip
                            label="Bloklangan"
                            size="small"
                            sx={{
                              backgroundColor: '#fef2f2',
                              color: '#dc2626',
                              fontWeight: 600,
                              borderRadius: '6px',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography sx={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            mb: 1
                          }}>
                            ID: {student.display_id || student.username}
                          </Typography>
                          <Typography sx={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            Bloklash sababi: {student.ban_reason || 'Noma\'lum'} •
                            Bloklangan: {student.ban_date ? new Date(student.ban_date).toLocaleDateString('uz-UZ') : 'Noma\'lum'}
                          </Typography>
                          {student.unban_code && (
                            <Typography sx={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              fontFamily: 'monospace',
                              backgroundColor: '#fee2e2',
                              px: 1,
                              py: 0.5,
                              borderRadius: '4px',
                              display: 'inline-block',
                              mt: 1
                            }}>
                              Kod: {student.unban_code}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    <Box sx={{ ml: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => onUnbanStudent(student.id)}
                        sx={{
                          color: '#059669',
                          borderColor: '#059669',
                          '&:hover': {
                            backgroundColor: '#ecfdf5',
                            borderColor: '#059669',
                          },
                          fontSize: '0.75rem',
                          px: 2,
                          py: 0.5,
                        }}
                      >
                        Blokdan chiqarish
                      </Button>
                    </Box>
                  </ListItem>
                  {index < bannedStudents.length - 1 && <Divider sx={{ my: 1 }} />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                Bloklangan o'quvchilar yo'q
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Hozirda barcha o'quvchilar faol
              </Typography>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button
            fullWidth
            variant="contained"
            onClick={onClose}
            sx={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              py: 1.5,
              borderRadius: '8px',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: '#1d4ed8',
              },
            }}
          >
            Yopish
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default BannedStudentsModal;