import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

export default function CardAlert() {
  const [open, setOpen] = React.useState(true);

  if (!open) return null;

  return (
    <Card variant="outlined" sx={{ m: 1.5, flexShrink: 0, position: 'relative' }}>
      <IconButton
        size="small"
        onClick={() => setOpen(false)}
        aria-label="Fechar"
        sx={{ position: 'absolute', top: 4, right: 4 }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 0.5 }}>
          <AutoAwesomeRoundedIcon fontSize="small" />
          <Typography sx={{ fontWeight: 600 }}>Plano prestes a expirar</Typography>
        </Stack>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Renove hoje e ganhe 10% de desconto.
        </Typography>
        <Button variant="contained" size="small" fullWidth>
          Ver desconto
        </Button>
      </CardContent>
    </Card>
  );
}
