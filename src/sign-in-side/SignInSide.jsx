import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import SignInCard from './components/SignInCard';
import Content from './components/Content';
import { FloatingPathsBackground } from '../components/ui/floating-paths';

export default function SignInSide(props) {
  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />

      <FloatingPathsBackground
        position={-1}
        className="min-h-screen flex items-center justify-center"
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
      </FloatingPathsBackground>
    </AppTheme>
  );
}