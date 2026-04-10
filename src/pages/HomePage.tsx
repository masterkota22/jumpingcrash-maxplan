import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        홈
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>현재 진행 중인 대회, 내 학교 순위 요약이 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
