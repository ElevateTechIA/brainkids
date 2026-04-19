import { Box } from '@mui/material';
import BottomNav from '@/components/layout/BottomNav';
import HamburgerMenu from '@/components/layout/HamburgerMenu';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: '80px' }}>
      {children}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1100 }}>
        <HamburgerMenu />
      </Box>
      <BottomNav />
    </Box>
  );
}
