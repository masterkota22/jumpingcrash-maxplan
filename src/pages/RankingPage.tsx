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
import CircularProgress from '@mui/material/CircularProgress';
import { getRecordsByEvent } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import type { JumpRecord, EventType } from '@/types';

const EVENTS: EventType[] = ['moah', 'alternate', 'double'];

interface RankEntry {
  userId: string;
  count: number;
}

export default function RankingPage() {
  const [tab, setTab] = useState(0);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const selectedEvent = EVENTS[tab];

  useEffect(() => {
    setLoading(true);
    getRecordsByEvent(selectedEvent).then((records) => {
      // Best record per user
      const best = new Map<string, JumpRecord>();
      for (const r of records) {
        const existing = best.get(r.userId);
        if (!existing || r.count > existing.count) {
          best.set(r.userId, r);
        }
      }
      const sorted = [...best.values()]
        .sort((a, b) => b.count - a.count)
        .map((r) => ({ userId: r.userId, count: r.count }));
      setRankings(sorted);
      setLoading(false);
    });
  }, [selectedEvent]);

  const getMedalEmoji = (rank: number) => {
    if (rank === 0) return { label: '1위', color: '#FFD700' };
    if (rank === 1) return { label: '2위', color: '#C0C0C0' };
    if (rank === 2) return { label: '3위', color: '#CD7F32' };
    return null;
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>개인 전체 순위</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
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
        <Stack spacing={1}>
          {rankings.map((entry, i) => {
            const medal = getMedalEmoji(i);
            return (
              <Card key={entry.userId} variant={i < 3 ? 'elevation' : 'outlined'} elevation={i < 3 ? 2 : 0}>
                <CardContent sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 1.5 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {medal ? (
                      <Chip
                        label={medal.label}
                        size="small"
                        sx={{ bgcolor: medal.color, color: '#fff', fontWeight: 700, minWidth: 40 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40, textAlign: 'center' }}>
                        {i + 1}위
                      </Typography>
                    )}
                    <Typography variant="body1">
                      {entry.userId.slice(0, 8)}...
                    </Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{entry.count}회</Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
