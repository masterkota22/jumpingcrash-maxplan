import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useAuth } from '@/contexts/AuthContext';
import { getUserRecords } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import { judgeAward, getAgeGroup, getAwardLabel, getAwardColor } from '@/utils/awards';
import type { JumpRecord } from '@/types';

export default function HomePage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, loading: authLoading } = useAuth();
  const [recentRecords, setRecentRecords] = useState<JumpRecord[]>([]);
  const [loading, setLoading] = useState(!!firebaseUser);
  const [error, setError] = useState('');

  useEffect(() => {
    if (firebaseUser) {
      getUserRecords(firebaseUser.uid)
        .then((recs) => setRecentRecords(recs.slice(0, 5)))
        .catch(() => setError('최근 기록을 불러오는데 실패했습니다.'))
        .finally(() => setLoading(false));
    }
  }, [firebaseUser]);

  if (authLoading) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {profile ? `${profile.name}님, 안녕하세요!` : '환영합니다!'}
        </Typography>
        {!firebaseUser && (
          <Button variant="outlined" onClick={() => navigate('/login')} sx={{ mt: 1 }}>
            로그인하고 시작하기
          </Button>
        )}
        {firebaseUser && !profile?.schoolId && (
          <Button variant="outlined" size="small" onClick={() => navigate('/profile')}>
            프로필을 설정해주세요
          </Button>
        )}
      </Box>

      {/* Quick Actions */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Card sx={{ flex: '1 1 0', minWidth: 100 }}>
          <CardActionArea onClick={() => navigate('/measure')} sx={{ p: 2, textAlign: 'center' }}>
            <TimerIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>측정 시작</Typography>
          </CardActionArea>
        </Card>
        <Card sx={{ flex: '1 1 0', minWidth: 100 }}>
          <CardActionArea onClick={() => navigate('/ranking/school')} sx={{ p: 2, textAlign: 'center' }}>
            <LeaderboardIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>학교 순위</Typography>
          </CardActionArea>
        </Card>
        <Card sx={{ flex: '1 1 0', minWidth: 100 }}>
          <CardActionArea onClick={() => navigate('/competition')} sx={{ p: 2, textAlign: 'center' }}>
            <EmojiEventsIcon sx={{ fontSize: 40, mb: 1, color: '#FFD700' }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>대회</Typography>
          </CardActionArea>
        </Card>
      </Box>

      {/* 종목 소개 */}
      <Typography variant="h6" sx={{ mb: 2 }}>30초 스피드 줄넘기</Typography>
      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {(['moah', 'alternate', 'double'] as const).map((evt) => (
          <Card key={evt} variant="outlined">
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography sx={{ fontWeight: 600 }}>{EVENT_LABELS[evt]}</Typography>
              <Typography variant="body2" color="text.secondary">
                {evt === 'moah' && '두 발을 모아서 뛰는 기본 줄넘기'}
                {evt === 'alternate' && '양 발을 번갈아 뛰는 줄넘기'}
                {evt === 'double' && '한 번 점프에 줄을 두 번 돌리는 줄넘기'}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* 최근 기록 */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : recentRecords.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="h6">최근 기록</Typography>
            <Button size="small" onClick={() => navigate('/records')}>전체 보기</Button>
          </Box>
          <Stack spacing={1}>
            {recentRecords.map((rec) => {
              const ageGroup = profile ? getAgeGroup(profile.schoolLevel, profile.grade) : null;
              const award = ageGroup ? judgeAward(rec.eventType, ageGroup, rec.count) : 'none';
              return (
                <Card key={rec.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', '&:last-child': { pb: 1.5 } }}>
                    <Box>
                      <Typography sx={{ fontWeight: 600 }}>{EVENT_LABELS[rec.eventType]}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {rec.createdAt?.toDate?.().toLocaleDateString('ko-KR') ?? ''}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6">{rec.count}회</Typography>
                      {award !== 'none' && (
                        <Chip
                          label={getAwardLabel(award)}
                          size="small"
                          sx={{ bgcolor: getAwardColor(award), color: '#fff', fontWeight: 700 }}
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </>
      )}
    </Container>
  );
}
