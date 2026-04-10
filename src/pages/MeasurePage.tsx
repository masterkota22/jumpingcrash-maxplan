import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function MeasurePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        줄넘기 측정
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>카메라 실행 → 종목 선택 → 30초 측정 → 결과 확인</Typography>
      </Box>
    </Container>
  );
}
