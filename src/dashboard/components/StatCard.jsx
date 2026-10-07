import { useTheme, alpha } from '@mui/material/styles';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowUpwardRoundedIcon from '@mui/icons-material/ArrowUpwardRounded';
import ArrowDownwardRoundedIcon from '@mui/icons-material/ArrowDownwardRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { SparkLineChart } from '@mui/x-charts/SparkLineChart';
import { lineClasses } from '@mui/x-charts/LineChart';

function getDaysInMonth(month, year) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString('en-US', {
    month: 'short',
  });
  const daysInMonth = date.getDate();
  const days = [];
  let i = 1;
  while (days.length < daysInMonth) {
    days.push(`${monthName} ${i}`);
    i += 1;
  }
  return days;
}

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.45} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

function cardSx(theme, accent) {
  return {
    height: '100%',
    flexGrow: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 3,
    backgroundImage: `linear-gradient(160deg, ${alpha(
      accent,
      theme.palette.mode === 'light' ? 0.07 : 0.14,
    )} 0%, ${alpha(accent, 0)} 55%)`,
    transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
    '&:hover': {
      transform: 'translateY(-3px)',
      borderColor: alpha(accent, 0.4),
      boxShadow: `0 18px 40px -24px ${alpha(accent, 0.9)}`,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      insetInline: 0,
      top: 0,
      height: 3,
      background: `linear-gradient(90deg, ${accent}, ${alpha(accent, 0)})`,
    },
  };
}

function StatCard({ title, value, interval, trend, data, items }) {
  const theme = useTheme();
  const daysInWeek = getDaysInMonth(4, 2024);

  const trendColors = {
    up: theme.palette.success.main,
    down: theme.palette.error.main,
    neutral: theme.palette.info?.main ?? theme.palette.primary.main,
  };

  const trendIcons = {
    up: <ArrowUpwardRoundedIcon sx={{ fontSize: '0.9rem' }} />,
    down: <ArrowDownwardRoundedIcon sx={{ fontSize: '0.9rem' }} />,
    neutral: <TrendingFlatRoundedIcon sx={{ fontSize: '0.9rem' }} />,
  };

  const accent = trend ? trendColors[trend] : theme.palette.primary.main;
  const chartColor = accent;
  const trendValues = { up: '+25%', down: '-25%', neutral: '+5%' };

  if (items) {
    return (
      <Card variant="outlined" sx={cardSx(theme, theme.palette.primary.main)}>
        <CardContent>
          <Typography
            component="h2"
            variant="overline"
            sx={{ color: 'text.secondary', letterSpacing: '.09em', fontWeight: 700 }}
          >
            {title}
          </Typography>
          <Stack
            direction="row"
            sx={{
              justifyContent: 'space-between',
              alignItems: 'stretch',
              mt: 2,
              gap: 1,
            }}
          >
            {items.map((item, index) => (
              <Stack
                key={item.label}
                sx={{
                  gap: 0.5,
                  minWidth: 0,
                  flex: 1,
                  pl: index === 0 ? 0 : 1.5,
                  borderLeft: index === 0 ? 'none' : '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    fontWeight: 600,
                  }}
                >
                  {item.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-.01em' }}
                >
                  {item.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={cardSx(theme, accent)}>
      <CardContent>
        <Typography
          component="h2"
          variant="overline"
          sx={{ color: 'text.secondary', letterSpacing: '.09em', fontWeight: 700 }}
        >
          {title}
        </Typography>
        <Stack
          direction="column"
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1.5, mt: 0.5 }}
        >
          <Stack sx={{ justifyContent: 'space-between', gap: 0.5 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}
            >
              <Typography
                variant="h4"
                component="p"
                sx={{ fontWeight: 700, letterSpacing: '-.02em' }}
              >
                {value}
              </Typography>
              <Chip
                size="small"
                icon={trendIcons[trend]}
                label={trendValues[trend]}
                sx={{
                  fontWeight: 700,
                  bgcolor: alpha(accent, 0.14),
                  color: accent,
                  border: '1px solid',
                  borderColor: alpha(accent, 0.3),
                  '& .MuiChip-icon': { color: accent, ml: 0.5 },
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {interval}
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 58 }}>
            <SparkLineChart
              color={chartColor}
              data={data}
              area
              curve="natural"
              showHighlight
              showTooltip
              margin={{ top: 6, bottom: 0, left: 0, right: 0 }}
              xAxis={{
                scaleType: 'band',
                data: daysInWeek,
              }}
              sx={{
                [`& .${lineClasses.area}`]: {
                  fill: `url(#area-gradient-${value})`,
                },
                [`& .${lineClasses.root}`]: {
                  strokeWidth: 2,
                },
              }}
            >
              <AreaGradient color={chartColor} id={`area-gradient-${value}`} />
            </SparkLineChart>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

StatCard.propTypes = {
  data: PropTypes.arrayOf(PropTypes.number),
  interval: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired,
    }),
  ),
  title: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['down', 'neutral', 'up']),
  value: PropTypes.string,
};

export default StatCard;
