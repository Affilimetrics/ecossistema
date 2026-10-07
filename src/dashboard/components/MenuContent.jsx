import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';

const mainListItems = [
  { text: 'Inicio', icon: <HomeRoundedIcon /> },
  { text: 'Avançado', icon: <AnalyticsRoundedIcon /> },
  { text: 'Produtos', icon: <PeopleRoundedIcon /> },
  { text: 'Modelos', icon: <AssignmentRoundedIcon /> },
  { text: 'Divulgação', icon: <AssignmentRoundedIcon /> },
  { text: 'Remarketing', icon: <AssignmentRoundedIcon /> },
];

const secondaryListItems = [
  { text: 'Configurações', icon: <SettingsRoundedIcon /> },
  { text: 'Sobre', icon: <InfoRoundedIcon /> },
  { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

// Pequeno rótulo em maiúsculas acima de cada grupo do menu, no estilo
// "Dashboards" / "Apps" / "Pages" do template de referência.
function SectionLabel({ children }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        px: 1.5,
        pt: 1,
        pb: 0.5,
        color: 'text.secondary',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        fontSize: '0.6875rem',
      }}
    >
      {children}
    </Typography>
  );
}

export default function MenuContent() {
  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <div>
        <SectionLabel>Menu</SectionLabel>
        <List dense>
          {mainListItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton selected={index === 0}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
      <div>
        <SectionLabel>Sistema</SectionLabel>
        <List dense>
          {secondaryListItems.map((item, index) => (
            <ListItem key={index} disablePadding sx={{ display: 'block' }}>
              <ListItemButton>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </div>
    </Stack>
  );
}
