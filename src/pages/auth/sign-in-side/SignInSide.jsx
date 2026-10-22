import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import SignInCard from './components/SignInCard';
import Content from './components/Content';

export default function SignInSide(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ColorModeSelect
          sx={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 10 }}
        />

        <Stack
          direction={{ xs: 'column-reverse', md: 'row' }}
          sx={{
            justifyContent: 'center',
            gap: { xs: 6, sm: 12 },
            p: { xs: 2, sm: 4 },
            m: 'auto',
            width: '100%',
            maxWidth: '1200px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <Content />
          <SignInCard />
        </Stack>
      </Box>
    </AppTheme>
  );
}