import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import MouseRoundedIcon from '@mui/icons-material/MouseRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';

// TODO: substituir pelo produto real vindo da API
const PRODUTO_URL = 'https://www.magazineluiza.com.br/busca/mouse+rgb/';

export default function HighlightedCard() {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
        >
          <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600 }}>
            Melhor Produto
          </Typography>
          <Chip size="small" label="Magalu" color="primary" variant="outlined" />
        </Stack>

        <Stack direction="row" sx={{ alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage:
                'linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)',
              color: 'hsla(210, 100%, 95%, 0.9)',
              border: '1px solid',
              borderColor: 'hsl(210, 100%, 55%)',
              boxShadow: 'inset 0 2px 5px rgba(255, 255, 255, 0.3)',
            }}
          >
            <MouseRoundedIcon sx={{ fontSize: '1.75rem' }} />
          </Box>
          <Stack sx={{ gap: 0.25, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Mouse RGB
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Vendido em: Magalu
            </Typography>
          </Stack>
        </Stack>

        <Link
          href={PRODUTO_URL}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{
            mt: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          Ver produto
          <OpenInNewRoundedIcon sx={{ fontSize: '1rem' }} />
        </Link>
      </CardContent>
    </Card>
  );
}