import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import MouseRoundedIcon from '@mui/icons-material/MouseRounded';

export default function HighlightedCard() {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1 }}
        >
          <MouseRoundedIcon />
          <Chip size="small" label="Magalu" color="primary" variant="outlined" />
        </Stack>
        <Typography
          component="h2"
          variant="subtitle2"
          gutterBottom
          sx={{ fontWeight: '600' }}
        >
          Melhor Produto
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Mouse RGB
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Vendido em: Magalu
        </Typography>
      </CardContent>
    </Card>
  );
}