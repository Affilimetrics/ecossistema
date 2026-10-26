import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import InputLabel from '@mui/material/InputLabel';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import visuallyHidden from '@mui/utils/visuallyHidden';
import { styled } from '@mui/material/styles';
import Cursor from '@/components/ui/inverted-cursor';

const TEMPLATE_IMAGE_URL =
  import.meta.env.VITE_TEMPLATE_IMAGE_URL || 'https://mui.com';

const PreviewCard = styled('div')(({ theme }) => ({
  alignSelf: 'center',
  width: '100%',
  height: 420,
  marginTop: theme.spacing(6),
  borderRadius: theme.shape.borderRadius * 2,
  border: '1px solid rgba(255, 255, 255, 0.12)',
  boxShadow: '0 20px 80px rgba(0, 0, 0, 0.6)',
  backgroundImage: `url(${TEMPLATE_IMAGE_URL}/static/screenshots/material-ui/getting-started/templates/dashboard-dark.jpg)`,
  backgroundSize: 'cover',
  backgroundPosition: 'top center',
  [theme.breakpoints.up('sm')]: {
    marginTop: theme.spacing(8),
    height: 650,
  },
}));

export default function Hero() {
  return (
    <Box
      id="hero"
      sx={{
        position: 'relative',
        isolation: 'isolate',
        overflow: 'hidden',
        width: '100%',
        bgcolor: '#0B0F17',
        color: '#FFFFFF',
        pt: { xs: 12, sm: 18 },
        pb: { xs: 8, sm: 12 },
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Elemento interativo: Cursor Invertido ativado exclusivamente dentro do Hero */}
      <Cursor size={80} />

      {/* Gradientes decorativos sutis */}
      <Box
        sx={{
          pointerEvents: 'none',
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80%',
          height: '600px',
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15), transparent 70%)',
          filter: 'blur(60px)',
          zIndex: 1,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', maxWidth: '850px' }}>
          <Chip
            label="Módulo de Inteligência de Vendas"
            size="small"
            sx={{
              bgcolor: 'rgba(59, 130, 246, 0.1)',
              color: '#60A5FA',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              fontWeight: 600,
              fontSize: '0.75rem',
              px: 1,
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            Escalabilidade e controle total para suas campanhas no{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Scallora
            </Box>
          </Typography>

          <Typography
            sx={{
              color: '#94A3B8',
              fontSize: { xs: '1rem', sm: '1.25rem' },
              lineHeight: 1.6,
              maxWidth: '680px',
            }}
          >
            Gerencie ofertas, monitore conversões em tempo real e otimize o desempenho da sua operação com infraestrutura de alta performance.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ pt: 1, width: { xs: '100%', sm: '420px' } }}
          >
            <InputLabel htmlFor="email-hero" sx={visuallyHidden}>
              Email
            </InputLabel>
            <TextField
              id="email-hero"
              hiddenLabel
              size="small"
              variant="outlined"
              placeholder="Seu e-mail corporativo"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#FFF',
                  borderRadius: '8px',
                  '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.15)' },
                  '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                },
              }}
            />
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#3B82F6',
                color: '#FFF',
                fontWeight: 600,
                px: 3,
                borderRadius: '8px',
                textTransform: 'none',
                minWidth: 'fit-content',
                '&:hover': { bgcolor: '#2563EB' },
              }}
            >
              Começar Agora
            </Button>
          </Stack>

          <Typography variant="caption" sx={{ color: '#64748B' }}>
            Sem necessidade de cartão de crédito no teste grátis.
          </Typography>
        </Stack>

        <PreviewCard id="image" />
      </Container>
    </Box>
  );
}