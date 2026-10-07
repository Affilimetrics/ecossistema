import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { DraggableWidgetGrid } from './draggable-widget-grid';

import StatCard from './StatCard';
import HighlightedCard from './HighlightedCard';
import FiltersCard from './FiltersCard';
import FinancialThermometer from './FinancialThermometer';
import SessionsChart from './SessionsChart';
import PageViewsBarChart from './PageViewsBarChart';
import CustomizedDataGrid from './CustomizedDataGrid';
import CustomizedTreeView from './CustomizedTreeView';
import ChartUserByCountry from './ChartUserByCountry';

// TODO: substituir os valores fictícios por dados vindos da API
const RESUMO_ITEMS = [
  { label: 'Custo', value: 'R$ 3.240,00' },
  { label: 'Retorno', value: 'R$ 8.150,00' },
  { label: 'Meta', value: 'R$ 10.000,00' },
];

// Ordem e tamanho padrão dos widgets no grid. "size" controla quantas
// células (colunas x linhas) cada card ocupa: sm=1x1, wide=2x1, tall=1x2, lg=2x2.
const DEFAULT_WIDGETS = [
  { id: 'resumo', kind: 'resumo', size: 'wide', label: 'Resumo' },
  { id: 'melhorProduto', kind: 'melhorProduto', size: 'sm', label: 'Melhor produto' },
  { id: 'filtros', kind: 'filtros', size: 'tall', label: 'Filtros' },
  { id: 'termometro', kind: 'termometro', size: 'wide', label: 'Termômetro financeiro' },
  { id: 'sessions', kind: 'sessions', size: 'wide', label: 'Sessions' },
  { id: 'pageviews', kind: 'pageviews', size: 'wide', label: 'Page views e downloads' },
  { id: 'datagrid', kind: 'datagrid', size: 'lg', label: 'Tabela de dados' },
  { id: 'treeview', kind: 'treeview', size: 'tall', label: 'Árvore de produtos' },
  { id: 'chartCountry', kind: 'chartCountry', size: 'tall', label: 'Usuários por país' },
];

const WIDGET_VIEWS = {
  resumo: () => <StatCard title="Resumo" items={RESUMO_ITEMS} />,
  melhorProduto: () => <HighlightedCard />,
  filtros: () => <FiltersCard />,
  termometro: () => <FinancialThermometer />,
  sessions: () => <SessionsChart />,
  pageviews: () => <PageViewsBarChart />,
  datagrid: () => <CustomizedDataGrid />,
  treeview: () => <CustomizedTreeView />,
  chartCountry: () => <ChartUserByCountry />,
};

function renderWidget(item) {
  const View = WIDGET_VIEWS[item.kind];
  if (!View) return null;
  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'auto' }}>
      <View />
    </Box>
  );
}

export default function DashboardWidgetGrid() {
  const [editable, setEditable] = React.useState(false);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Tooltip
          title={
            editable
              ? 'Arraste os cards para reorganizar. Clique para travar o layout.'
              : 'Layout travado. Clique para poder arrastar os cards.'
          }
        >
          <Button
            variant={editable ? 'contained' : 'outlined'}
            size="small"
            color={editable ? 'primary' : 'inherit'}
            startIcon={
              editable ? <CheckRoundedIcon /> : <DashboardCustomizeRoundedIcon />
            }
            onClick={() => setEditable((prev) => !prev)}
          >
            {editable ? 'Concluir personalização' : 'Personalizar layout'}
          </Button>
        </Tooltip>
      </Box>

      <DraggableWidgetGrid
        items={DEFAULT_WIDGETS}
        editable={editable}
        renderItem={renderWidget}
        maxColumns={4}
        cellSize={260}
        gap={16}
        radius={8}
      />
    </Box>
  );
}