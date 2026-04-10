import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function LoginPage() {
  return (
    <Container maxWidth="sm" sx={{ py: 3, textAlign: 'center' }}>
      <Typography variant="h4" gutterBottom>
        로그인
      </Typography>
      <Box sx={{ color: 'text.secondary' }}>
        <Typography>로그인 / 회원가입 화면이 표시됩니다.</Typography>
      </Box>
    </Container>
  );
}
