import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded';

export default function FiltersCard() {
  // TODO: substituir por dados vindos da API / conectar com o estado global de filtros
  const [data, setData] = React.useState('30d');
  const [plataforma, setPlataforma] = React.useState('todas');
  const [nicho, setNicho] = React.useState('todos');

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, mb: 1 }}>
          <FilterAltRoundedIcon fontSize="small" />
          <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 600 }}>
            Filtros
          </Typography>
        </Stack>
        <Stack spacing={1.5}>
          <FormControl size="small" fullWidth>
            <InputLabel id="filtro-data-label">Data</InputLabel>
            <Select
              labelId="filtro-data-label"
              label="Data"
              value={data}
              onChange={(event) => setData(event.target.value)}
            >
              <MenuItem value="7d">Últimos 7 dias</MenuItem>
              <MenuItem value="30d">Últimos 30 dias</MenuItem>
              <MenuItem value="90d">Últimos 90 dias</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="filtro-plataforma-label">Plataforma</InputLabel>
            <Select
              labelId="filtro-plataforma-label"
              label="Plataforma"
              value={plataforma}
              onChange={(event) => setPlataforma(event.target.value)}
            >
              <MenuItem value="todas">Todas</MenuItem>
              <MenuItem value="magalu">Magalu</MenuItem>
              <MenuItem value="mercado-livre">Mercado Livre</MenuItem>
              <MenuItem value="shopee">Shopee</MenuItem>
              <MenuItem value="amazon">Amazon</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel id="filtro-nicho-label">Nicho</InputLabel>
            <Select
              labelId="filtro-nicho-label"
              label="Nicho"
              value={nicho}
              onChange={(event) => setNicho(event.target.value)}
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="eletronicos">Eletrônicos</MenuItem>
              <MenuItem value="games">Games</MenuItem>
              <MenuItem value="casa">Casa e decoração</MenuItem>
              <MenuItem value="moda">Moda</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
}
