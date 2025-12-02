import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Grid,
} from '@mui/material';
import { Close as CloseIcon, Palette as PaletteIcon } from '@mui/icons-material';

const GRADIENT_PRESETS = [
  {
    id: 'default',
    name: 'Standart',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    colors: ['#667eea', '#764ba2']
  },
  {
    id: 'sunset',
    name: 'Quyosh botishi',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff4757 100%)',
    colors: ['#ff6b35', '#f7931e', '#ff4757']
  },
  {
    id: 'ocean',
    name: 'Okean',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
    colors: ['#667eea', '#764ba2', '#4facfe']
  },
  {
    id: 'forest',
    name: 'O\'rmon',
    gradient: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
    colors: ['#134e5e', '#71b280']
  },
  {
    id: 'cherry',
    name: 'Olcha',
    gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    colors: ['#ff9a9e', '#fecfef']
  },
  {
    id: 'royal',
    name: 'Qirollik',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb']
  },
  {
    id: 'fire',
    name: 'Olov',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #ff4757 50%, #ff3838 100%)',
    colors: ['#ff6b35', '#ff4757', '#ff3838']
  },
  {
    id: 'ice',
    name: 'Muz',
    gradient: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 50%, #6c5ce7 100%)',
    colors: ['#74b9ff', '#0984e3', '#6c5ce7']
  },
  {
    id: 'sunrise',
    name: 'Quyosh chiqishi',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    colors: ['#ffecd2', '#fcb69f']
  },
  {
    id: 'galaxy',
    name: 'Galaktika',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb']
  },
  {
    id: 'mint',
    name: 'Yalpiz',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    colors: ['#a8edea', '#fed6e3']
  },
  {
    id: 'purple',
    name: 'Binafsha',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    colors: ['#667eea', '#764ba2', '#f093fb']
  },
  {
    id: 'neon',
    name: 'Neo\'n',
    gradient: 'linear-gradient(135deg, #ff006e 0%, #8338ec 50%, #3a86ff 100%)',
    colors: ['#ff006e', '#8338ec', '#3a86ff']
  },
  {
    id: 'tropical',
    name: 'Tropik',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    colors: ['#fa709a', '#fee140']
  },
  {
    id: 'cosmic',
    name: 'Kosmik',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    colors: ['#4facfe', '#00f2fe']
  }
];

const GradientPicker = ({ open, onClose, selectedGradient, onGradientSelect }) => {
  const handleGradientClick = (gradient) => {
    // Pass the full gradient object with name and css properties
    onGradientSelect({
      name: gradient.name,
      css: gradient.gradient
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: '20px',
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        pb: 1
      }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
          🎨 Gradient tanlang
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 1 }}>
        <Typography variant="body2" sx={{ mb: 3, color: '#64748b' }}>
          Premium profilingiz uchun chiroyli gradient tanlang
        </Typography>

        <Grid container spacing={2}>
          {GRADIENT_PRESETS.map((gradient, index) => (
            <Grid item xs={12} sm={6} md={4} key={gradient.id}>
              <Box
                onClick={() => handleGradientClick(gradient)}
                sx={{
                  position: 'relative',
                  height: '80px',
                  borderRadius: '12px',
                  background: `linear-gradient(45deg, ${gradient.colors[0]} 0%, ${gradient.colors[gradient.colors.length - 1]} 100%)`,
                  cursor: 'pointer',
                  border: selectedGradient && selectedGradient.name === gradient.name ? '2px solid #2563eb' : '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: selectedGradient && selectedGradient.name === gradient.name ? '0 0 0 3px rgba(37, 99, 235, 0.1), 0 8px 25px rgba(0, 0, 0, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: 3,
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
                    border: '2px solid rgba(255, 255, 255, 0.5)'
                  }
                }}
              >
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  fontSize: '1rem',
                  color: 'rgba(255, 255, 255, 0.95)',
                  flex: 1,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(2px)'
                }}>
                  {gradient.name}
                </Typography>
                
                {selectedGradient && selectedGradient.name === gradient.name && (
                  <Box sx={{
                    backgroundColor: '#2563eb',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
                    ml: 2
                  }}>
                    <PaletteIcon sx={{ fontSize: '18px', color: '#ffffff' }} />
                  </Box>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>
          Bekor qilish
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GradientPicker;