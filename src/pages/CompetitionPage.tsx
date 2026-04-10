import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

const COMPETITIONS = [
  {
    id: '1',
    title: '2026 전국 학교 대항 줄넘기 대회',
    period: '2026.04.01 ~ 2026.05.31',
    status: 'active' as const,
    events: ['모아뛰기', '번갈아뛰기', '이중뛰기'],
    description: '전국 초/중/고/대학교 대상 온라인 줄넘기 대회',
  },
];

export default function CompetitionPage() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>대회</Typography>

      <Stack spacing={2}>
        {COMPETITIONS.map((comp) => (
          <Card key={comp.id} elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {comp.title}
                </Typography>
                <Chip
                  label={comp.status === 'active' ? '진행 중' : '종료'}
                  size="small"
                  color={comp.status === 'active' ? 'success' : 'default'}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {comp.period}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                {comp.description}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                {comp.events.map((evt) => (
                  <Chip key={evt} label={evt} size="small" variant="outlined" />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button variant="contained" size="small" onClick={() => navigate('/measure')}>
                  참가하기
                </Button>
                <Button variant="outlined" size="small" onClick={() => navigate('/ranking/school')}>
                  순위 보기
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card variant="outlined" sx={{ mt: 3, textAlign: 'center', py: 3 }}>
        <Typography variant="body2" color="text.secondary">
          더 많은 대회가 곧 추가됩니다.
        </Typography>
      </Card>
    </Container>
  );
}
