import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function RecordsPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        개인 기록
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>종목별 기록, 등급(금/은/동), 순위가 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
