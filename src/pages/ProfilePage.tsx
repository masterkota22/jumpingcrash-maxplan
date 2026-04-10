import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function ProfilePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        프로필 설정
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>학교, 학년, 반 등 프로필 설정 화면이 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
