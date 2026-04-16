import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { getCompetitions } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import type { Competition, EventType } from '@/types';

const STATUS_CONFIG = {
  upcoming: { label: '예정', color: 'info' as const },
  active: { label: '진행 중', color: 'success' as const },
  ended: { label: '종료', color: 'default' as const },
};

export default function CompetitionPage() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCompetitions()
      .then(setCompetitions)
      .catch(() => setError('대회 목록을 불러오는데 실패했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (timestamp: { toDate?: () => Date }) => {
    try {
      return timestamp.toDate?.()?.toLocaleDateString('ko-KR') ?? '';
    } catch {
      return '';
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>대회</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : competitions.length === 0 ? (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              현재 등록된 대회가 없습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              대회가 등록되면 이곳에 표시됩니다.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => navigate('/measure')}
            >
              연습 측정하기
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {competitions.map((comp) => {
            const statusConfig = STATUS_CONFIG[comp.status];
            return (
              <Card key={comp.id} elevation={comp.status === 'active' ? 2 : 0} variant={comp.status === 'active' ? 'elevation' : 'outlined'}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {comp.title}
                    </Typography>
                    <Chip
                      label={statusConfig.label}
                      size="small"
                      color={statusConfig.color}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {formatDate(comp.startDate)} ~ {formatDate(comp.endDate)}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5 }}>
                    {comp.description}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                    {comp.events.map((evt) => (
                      <Chip
                        key={evt}
                        label={EVENT_LABELS[evt as EventType] ?? evt}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {comp.status === 'active' && (
                      <Button variant="contained" size="small" onClick={() => navigate('/measure')}>
                        참가하기
                      </Button>
                    )}
                    <Button variant="outlined" size="small" onClick={() => navigate('/ranking/school')}>
                      순위 보기
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
