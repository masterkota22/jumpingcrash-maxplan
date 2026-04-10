import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function RankingPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        개인 전체 순위
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>전체 개인 기록 순위가 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
