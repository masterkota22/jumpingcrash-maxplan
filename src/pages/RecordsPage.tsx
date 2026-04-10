import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRecords } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import { judgeAward, getAgeGroup, getAwardLabel, getAwardColor } from '@/utils/awards';
import type { JumpRecord, EventType } from '@/types';

const EVENTS: EventType[] = ['moah', 'alternate', 'double'];

export default function RecordsPage() {
  const navigate = useNavigate();
  const { firebaseUser, profile } = useAuth();
  const [records, setRecords] = useState<JumpRecord[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(!!firebaseUser);

  useEffect(() => {
    if (firebaseUser) {
      getUserRecords(firebaseUser.uid)
        .then(setRecords)
        .finally(() => setLoading(false));
    }
  }, [firebaseUser]);

  if (!firebaseUser) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Alert severity="info">기록을 보려면 로그인해주세요.</Alert>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          로그인
        </Button>
      </Container>
    );
  }

  const selectedEvent = EVENTS[tab];
  const filtered = records.filter((r) => r.eventType === selectedEvent);
  const ageGroup = profile ? getAgeGroup(profile.schoolLevel, profile.grade) : null;

  // 개인 최고 기록
  const best = filtered.length > 0 ? Math.max(...filtered.map((r) => r.count)) : null;
  const bestAward = best !== null && ageGroup ? judgeAward(selectedEvent, ageGroup, best) : 'none';

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>내 기록</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        {EVENTS.map((evt) => (
          <Tab key={evt} label={EVENT_LABELS[evt]} />
        ))}
      </Tabs>

      {/* 최고 기록 카드 */}
      {best !== null && (
        <Card sx={{ mb: 2, bgcolor: 'primary.main', color: '#fff' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>최고 기록</Typography>
            <Typography variant="h3" sx={{ fontWeight: 900 }}>{best}회</Typography>
            {bestAward !== 'none' && (
              <Chip
                label={`${getAwardLabel(bestAward)}메달`}
                size="small"
                sx={{ bgcolor: getAwardColor(bestAward), color: '#fff', fontWeight: 700, mt: 1 }}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* 기록 목록 */}
      {loading ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          불러오는 중...
        </Typography>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography color="text.secondary" gutterBottom>
            {EVENT_LABELS[selectedEvent]} 기록이 없습니다.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/measure')}>
            측정하러 가기
          </Button>
        </Box>
      ) : (
        <Stack spacing={1}>
          {filtered.map((rec, i) => {
            const award = ageGroup ? judgeAward(rec.eventType, ageGroup, rec.count) : 'none';
            return (
              <Card key={rec.id} variant="outlined">
                <CardContent sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      #{i + 1} | {rec.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {award !== 'none' && (
                      <Chip
                        label={getAwardLabel(award)}
                        size="small"
                        sx={{ bgcolor: getAwardColor(award), color: '#fff', fontWeight: 700, minWidth: 32 }}
                      />
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{rec.count}회</Typography>
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
