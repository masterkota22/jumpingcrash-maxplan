import { useEffect, useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import { computeSchoolRankings, type SchoolRankEntry } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import type { EventType } from '@/types';

const EVENTS: EventType[] = ['moah', 'alternate', 'double'];

export default function SchoolRankingPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [rankings, setRankings] = useState<SchoolRankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedEvent = EVENTS[tab];

  useEffect(() => {
    let cancelled = false;
    computeSchoolRankings(selectedEvent).then((data) => {
      if (cancelled) return;
      setRankings(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [selectedEvent]);

  const getMedalColor = (rank: number) => {
    if (rank === 0) return '#FFD700';
    if (rank === 1) return '#C0C0C0';
    if (rank === 2) return '#CD7F32';
    return undefined;
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5">학교 대항전 순위</Typography>
        <Button size="small" onClick={() => navigate('/ranking/individual')}>
          개인 순위
        </Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        각 학교 상위 3명의 평균 기록으로 순위를 매깁니다.
      </Typography>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setLoading(true); }} variant="fullWidth" sx={{ mb: 2 }}>
        {EVENTS.map((evt) => (
          <Tab key={evt} label={EVENT_LABELS[evt]} />
        ))}
      </Tabs>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rankings.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
          아직 기록이 없습니다.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {rankings.map((entry, i) => {
            const medalColor = getMedalColor(i);
            return (
              <Card
                key={entry.schoolId}
                variant={i < 3 ? 'elevation' : 'outlined'}
                elevation={i < 3 ? 3 : 0}
                sx={i < 3 ? { borderLeft: `4px solid ${medalColor}` } : undefined}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${i + 1}위`}
                        size="small"
                        sx={medalColor
                          ? { bgcolor: medalColor, color: '#fff', fontWeight: 700 }
                          : { fontWeight: 600 }
                        }
                      />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {entry.schoolName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>
                        {entry.top3Average}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        평균 (상위 {entry.top3UserIds.length}명)
                      </Typography>
                    </Box>
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
