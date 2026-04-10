import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { useAuth } from '@/contexts/AuthContext';
import { saveRecord } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import { judgeAward, getAgeGroup, getAwardLabel, getAwardColor } from '@/utils/awards';
import type { EventType, AwardGrade } from '@/types';

type Phase = 'select' | 'ready' | 'measuring' | 'done';

const DURATION = 30;

export default function MeasurePage() {
  const { firebaseUser, profile } = useAuth();
  const [eventType, setEventType] = useState<EventType>('moah');
  const [phase, setPhase] = useState<Phase>('select');
  const [count, setCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const award = useMemo<AwardGrade>(() => {
    if (phase !== 'done') return 'none';
    const ageGroup = profile ? getAgeGroup(profile.schoolLevel, profile.grade) : null;
    return ageGroup ? judgeAward(eventType, ageGroup, count) : 'none';
  }, [phase, profile, eventType, count]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const finishMeasure = useCallback(() => {
    stopTimer();
    setPhase('done');
    setResultOpen(true);
  }, [stopTimer]);

  const startMeasure = () => {
    setCount(0);
    setTimeLeft(DURATION);
    setPhase('measuring');
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishMeasure();
      }
    }, 1000);
  };

  useEffect(() => () => stopTimer(), [stopTimer]);

  const handleSave = async () => {
    if (!firebaseUser || !profile) return;
    setSaving(true);
    setSaveError('');
    try {
      await saveRecord({
        userId: firebaseUser.uid,
        schoolId: profile.schoolId,
        eventType,
        count,
        duration: 30,
      });
      setResultOpen(false);
      setPhase('select');
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      {/* 종목 선택 */}
      {phase === 'select' && (
        <>
          <Typography variant="h5" gutterBottom>종목 선택</Typography>
          <ToggleButtonGroup
            value={eventType}
            exclusive
            onChange={(_, v) => v && setEventType(v)}
            fullWidth
            sx={{ mb: 3 }}
          >
            {(['moah', 'alternate', 'double'] as const).map((evt) => (
              <ToggleButton key={evt} value={evt}>{EVENT_LABELS[evt]}</ToggleButton>
            ))}
          </ToggleButtonGroup>

          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                30초 동안 줄넘기를 뛰고 횟수를 카운트합니다.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                화면을 탭하여 횟수를 수동으로 카운트하세요.
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                (카메라 AI 자동 측정은 추후 업데이트 예정)
              </Typography>
            </CardContent>
          </Card>

          <Button variant="contained" fullWidth size="large" onClick={() => setPhase('ready')}>
            측정 준비
          </Button>
        </>
      )}

      {/* 준비 */}
      {phase === 'ready' && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {EVENT_LABELS[eventType]}
          </Typography>
          <Typography variant="h3" sx={{ mb: 4 }}>준비되셨나요?</Typography>
          <Button variant="contained" size="large" onClick={startMeasure} sx={{ px: 6, py: 2 }}>
            시작!
          </Button>
          <Box sx={{ mt: 2 }}>
            <Button variant="text" onClick={() => setPhase('select')}>뒤로</Button>
          </Box>
        </Box>
      )}

      {/* 측정 중 */}
      {phase === 'measuring' && (
        <Box
          onClick={() => setCount((c) => c + 1)}
          sx={{
            textAlign: 'center',
            py: 4,
            cursor: 'pointer',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {EVENT_LABELS[eventType]}
          </Typography>

          <Box sx={{ my: 2 }}>
            <LinearProgress
              variant="determinate"
              value={((DURATION - timeLeft) / DURATION) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>

          <Typography variant="h2" color="primary" sx={{ fontWeight: 800, mb: 1 }}>
            {timeLeft}초
          </Typography>

          <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '4rem', sm: '6rem' }, my: 2 }}>
            {count}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            화면을 탭하여 카운트
          </Typography>

          <Button
            variant="outlined"
            color="error"
            sx={{ mt: 3 }}
            onClick={finishMeasure}
          >
            중단
          </Button>
        </Box>
      )}

      {/* 결과 다이얼로그 */}
      <Dialog open={resultOpen} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center' }}>측정 완료!</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            {EVENT_LABELS[eventType]} | 30초
          </Typography>
          <Typography variant="h2" sx={{ fontWeight: 900, my: 2 }}>
            {count}회
          </Typography>
          {award !== 'none' && (
            <Chip
              label={`${getAwardLabel(award)}메달`}
              sx={{ bgcolor: getAwardColor(award), color: '#fff', fontWeight: 700, fontSize: '1rem', py: 2, px: 1 }}
            />
          )}
          {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleSave}
            disabled={saving || !profile}
          >
            {saving ? '저장 중...' : '기록 저장'}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setResultOpen(false);
              setPhase('select');
            }}
          >
            저장하지 않기
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
