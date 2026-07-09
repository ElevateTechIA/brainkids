import { Box } from '@mui/material';
import BottomNav from '@/components/layout/BottomNav';
import HamburgerMenu from '@/components/layout/HamburgerMenu';
import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          pb: { xs: '80px', md: 0 },
        }}
      >
        {children}
      </Box>
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1100,
          display: { xs: 'block', md: 'none' },
        }}
      >
        <HamburgerMenu />
      </Box>
      <BottomNav />
    </Box>
  );
}
