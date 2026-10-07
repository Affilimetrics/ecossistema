import { useTheme, alpha } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded';

const STEM_HEIGHT = 220;
const STEM_WIDTH = 38;
const BULB_SIZE = 68;

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinancialThermometer() {
  const theme = useTheme();

  const meta = 10000;
  const custo = 3240;
  const ganhoAtual = 8150;

  const custoPercent = Math.min((custo / meta) * 100, 100);
  const fillPercent = Math.min((ganhoAtual / meta) * 100, 100);
  const atingiuMeta = ganhoAtual >= meta;

  let status = 'investimento';
  if (ganhoAtual < custo) status = 'prejuizo';
  else if (atingiuMeta) status = 'lucro';

  const statusConfig = {
    prejuizo: { label: 'Prejuízo', color: theme.palette.error.main },
    investimento: { label: 'Zona de investimento', color: theme.palette.warning.main },
    lucro: { label: 'Lucro', color: theme.palette.success.main },
  };

  const current = statusConfig[status];

  const legenda = [
    { label: 'Meta', value: formatCurrency(meta), color: 'text.primary' },
    { label: 'Ganho atual', value: formatCurrency(ganhoAtual), color: current.color },
    { label: 'Custo', value: formatCurrency(custo), color: 'text.primary' },
  ];

  return (
    <Card
      variant="outlined"
      sx={{
        width: '100%',
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(160deg, ${alpha(
          current.color,
          theme.palette.mode === 'light' ? 0.08 : 0.16,
        )} 0%, ${alpha(current.color, 0)} 60%)`,
        '&::before': {
          content: '""',
          position: 'absolute',
          insetInline: 0,
          top: 0,
          height: 3,
          background: `linear-gradient(90deg, ${current.color}, ${alpha(current.color, 0)})`,
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 1 }}
        >
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(current.color, 0.15),
                color: current.color,
              }}
            >
              <LocalFireDepartmentRoundedIcon sx={{ fontSize: '1.15rem' }} />
            </Box>
            <Typography component="h2" variant="subtitle2" sx={{ fontWeight: 700 }}>
              Termômetro financeiro
            </Typography>
          </Stack>
          <Chip
            size="small"
            label={current.label}
            sx={{
              bgcolor: alpha(current.color, 0.15),
              color: current.color,
              fontWeight: 700,
              border: '1px solid',
              borderColor: alpha(current.color, 0.3),
            }}
          />
        </Stack>

        <Stack
          direction="row"
          sx={{ gap: { xs: 3, sm: 5 }, alignItems: 'flex-start', flexWrap: 'wrap' }}
        >
          <Stack sx={{ alignItems: 'center', flexShrink: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                mb: 0.75,
                fontWeight: 700,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
              }}
            >
              Meta
            </Typography>
            <Box
              sx={{
                position: 'relative',
                width: BULB_SIZE,
                height: STEM_HEIGHT + BULB_SIZE / 2,
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: (BULB_SIZE - STEM_WIDTH) / 2,
                  width: STEM_WIDTH,
                  height: STEM_HEIGHT,
                  borderRadius: STEM_WIDTH,
                  overflow: 'hidden',
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: `inset 0 2px 6px ${alpha(theme.palette.common.black, 0.12)}`,
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: `${custoPercent}%`,
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${custoPercent}%`,
                    bgcolor: alpha(theme.palette.error.main, 0.12),
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: `${fillPercent}%`,
                    borderRadius: STEM_WIDTH,
                    backgroundImage: `linear-gradient(180deg, ${alpha(
                      current.color,
                      0.85,
                    )} 0%, ${current.color} 100%)`,
                    boxShadow: `0 0 18px ${alpha(current.color, 0.55)}`,
                    transition: 'height .5s cubic-bezier(.4,0,.2,1), background-image .4s ease',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    bottom: 8,
                    left: 7,
                    width: 5,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.common.white, 0.35),
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: `${custoPercent}%`,
                    borderTop: '2px dashed',
                    borderColor: alpha(theme.palette.background.paper, 0.9),
                  }}
                />
              </Box>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: BULB_SIZE,
                  height: BULB_SIZE,
                  borderRadius: '50%',
                  backgroundImage: `radial-gradient(circle at 35% 30%, ${alpha(
                    theme.palette.common.white,
                    0.45,
                  )} 0%, ${current.color} 60%)`,
                  border: '1px solid',
                  borderColor: alpha(current.color, 0.5),
                  boxShadow: `0 0 24px ${alpha(current.color, 0.5)}`,
                  transition: 'background-image .4s ease, box-shadow .4s ease',
                }}
              />
            </Box>
          </Stack>

          <Stack sx={{ gap: 1.25, flexGrow: 1, minWidth: 200, justifyContent: 'center' }}>
            {legenda.map((item) => (
              <Stack
                key={item.label}
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                  px: 1.5,
                  py: 1.25,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.text.primary, 0.02),
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: item.color }}>
                  {item.value}
                </Typography>
              </Stack>
            ))}
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {fillPercent.toFixed(0)}% da meta alcançada
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
