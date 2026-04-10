import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function CompetitionPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        대회
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>대회 목록, 참가 신청, 대회 결과가 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
