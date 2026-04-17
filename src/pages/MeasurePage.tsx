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
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import { useAuth } from '@/contexts/AuthContext';
import { saveRecord } from '@/services/firestore';
import { EVENT_LABELS } from '@/constants/awards';
import { judgeAward, getAgeGroup, getAwardLabel, getAwardColor } from '@/utils/awards';
import { useCamera } from '@/hooks/useCamera';
import { usePoseDetector } from '@/hooks/usePoseDetector';
import { useJumpCounter } from '@/hooks/useJumpCounter';
import type { EventType, AwardGrade } from '@/types';

type Phase = 'select' | 'ready' | 'measuring' | 'done';
type MeasureMode = 'ai' | 'manual';

const DURATION = 30;

export default function MeasurePage() {
  const { firebaseUser, profile } = useAuth();
  const [eventType, setEventType] = useState<EventType>('moah');
  const [phase, setPhase] = useState<Phase>('select');
  const [manualCount, setManualCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [resultOpen, setResultOpen] = useState(false);
  const [mode, setMode] = useState<MeasureMode>('ai');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // AI hooks
  const camera = useCamera();
  const poseDetector = usePoseDetector();
  const jumpCounter = useJumpCounter();

  const isAiMode = mode === 'ai';

  // Active count depends on mode
  const count = isAiMode ? jumpCounter.count : manualCount;

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

  const stopDetectionLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finishMeasure = useCallback(() => {
    stopTimer();
    stopDetectionLoop();
    if (isAiMode) {
      camera.stop();
    }
    setPhase('done');
    setResultOpen(true);
  }, [stopTimer, stopDetectionLoop, isAiMode, camera]);

  // AI detection loop
  const startDetectionLoop = useCallback(() => {
    const loop = () => {
      if (videoRef.current && poseDetector.modelStatus === 'ready') {
        const result = poseDetector.detectForVideo(
          videoRef.current,
          performance.now(),
        );
        if (result) {
          jumpCounter.processPose(result);

          // Draw skeleton on canvas
          if (canvasRef.current && videoRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const video = videoRef.current;
            if (ctx) {
              canvasRef.current.width = video.videoWidth;
              canvasRef.current.height = video.videoHeight;
              ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

              if (result.landmarks && result.landmarks.length > 0) {
                const landmarks = result.landmarks[0];
                const w = canvasRef.current.width;
                const h = canvasRef.current.height;
                const MIN_VIS = 0.5;

                // Full-body skeleton connections (MediaPipe Pose standard)
                const faceConns: Array<[number, number]> = [
                  [0, 1], [1, 2], [2, 3], [3, 7],
                  [0, 4], [4, 5], [5, 6], [6, 8],
                  [9, 10],
                ];
                const torsoConns: Array<[number, number]> = [
                  [11, 12], [11, 23], [12, 24], [23, 24],
                ];
                const armConns: Array<[number, number]> = [
                  [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
                  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
                ];
                const legConns: Array<[number, number]> = [
                  [23, 25], [25, 27], [27, 29], [27, 31], [29, 31],
                  [24, 26], [26, 28], [28, 30], [28, 32], [30, 32],
                ];

                const drawConns = (
                  conns: Array<[number, number]>,
                  color: string,
                  width: number,
                ) => {
                  ctx.strokeStyle = color;
                  ctx.lineWidth = width;
                  for (const [a, b] of conns) {
                    const la = landmarks[a];
                    const lb = landmarks[b];
                    if (!la || !lb) continue;
                    if ((la.visibility ?? 0) < MIN_VIS) continue;
                    if ((lb.visibility ?? 0) < MIN_VIS) continue;
                    ctx.beginPath();
                    ctx.moveTo(la.x * w, la.y * h);
                    ctx.lineTo(lb.x * w, lb.y * h);
                    ctx.stroke();
                  }
                };

                drawConns(faceConns, '#40C4FF', 2);   // face - light blue
                drawConns(torsoConns, '#FFFFFF', 3);  // torso - white
                drawConns(armConns, '#FFC400', 3);    // arms - amber
                drawConns(legConns, '#00E676', 3);    // legs - green

                // Draw all keypoints (only if visible enough)
                for (let i = 0; i < landmarks.length; i++) {
                  const lm = landmarks[i];
                  if (!lm) continue;
                  if ((lm.visibility ?? 0) < MIN_VIS) continue;
                  // Color-code by body part
                  let color = '#FFFFFF';
                  if (i <= 10) color = '#40C4FF';             // face
                  else if (i <= 22) color = '#FFC400';        // arms
                  else color = '#00E676';                      // legs
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(lm.x * w, lm.y * h, 4, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [poseDetector, jumpCounter]);

  const startMeasure = useCallback(() => {
    if (isAiMode) {
      jumpCounter.reset();
    } else {
      setManualCount(0);
    }
    setTimeLeft(DURATION);
    setPhase('measuring');

    if (isAiMode) {
      startDetectionLoop();
    }

    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, DURATION - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        finishMeasure();
      }
    }, 1000);
  }, [isAiMode, jumpCounter, startDetectionLoop, finishMeasure]);

  // Start camera and load model when AI mode enters ready phase
  const prepareAiMode = useCallback(async () => {
    await camera.start();
    if (poseDetector.modelStatus === 'idle') {
      await poseDetector.load();
    }
  }, [camera, poseDetector]);

  useEffect(() => () => {
    stopTimer();
    stopDetectionLoop();
  }, [stopTimer, stopDetectionLoop]);

  // Bind camera stream to the currently-mounted video element.
  // Re-runs on phase transitions (ready → measuring) because the video
  // element is remounted in a different container.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (camera.stream) {
      v.srcObject = camera.stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
    return () => {
      if (v) v.srcObject = null;
    };
  }, [camera.stream, phase]);

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

  const handleBackToSelect = () => {
    stopTimer();
    stopDetectionLoop();
    if (isAiMode) {
      camera.stop();
      poseDetector.close();
    }
    setPhase('select');
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

          {/* 측정 모드 선택 */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            측정 방식
          </Typography>
          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, v) => v && setMode(v)}
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="ai">
              <CameraAltIcon sx={{ mr: 0.5 }} /> AI 카메라
            </ToggleButton>
            <ToggleButton value="manual">
              <TouchAppIcon sx={{ mr: 0.5 }} /> 수동 카운트
            </ToggleButton>
          </ToggleButtonGroup>

          <Card sx={{ mb: 3, textAlign: 'center' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                30초 동안 줄넘기를 뛰고 횟수를 카운트합니다.
              </Typography>
              {isAiMode ? (
                <Typography variant="body2" color="text.secondary">
                  카메라로 전신이 보이도록 촬영하면 AI가 자동으로 점프를 감지합니다.
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  화면을 탭하여 횟수를 수동으로 카운트하세요.
                </Typography>
              )}
            </CardContent>
          </Card>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={() => setPhase('ready')}
          >
            측정 준비
          </Button>
        </>
      )}

      {/* 준비 */}
      {phase === 'ready' && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {EVENT_LABELS[eventType]} ({isAiMode ? 'AI 카메라' : '수동'})
          </Typography>

          {isAiMode && (
            <Box sx={{ mb: 3 }}>
              {/* Camera preview */}
              {camera.status === 'idle' && (
                <Button
                  variant="outlined"
                  onClick={prepareAiMode}
                  sx={{ mb: 2 }}
                >
                  카메라 시작
                </Button>
              )}

              {camera.status === 'starting' && (
                <Box sx={{ py: 3 }}>
                  <CircularProgress size={32} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    카메라 시작 중...
                  </Typography>
                </Box>
              )}

              {camera.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {camera.error}
                </Alert>
              )}

              {camera.status === 'active' && (
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      maxHeight: 360,
                      borderRadius: 8,
                      transform: camera.facing === 'user' ? 'scaleX(-1)' : 'none',
                      objectFit: 'cover',
                    }}
                    playsInline
                    muted
                  />
                  <IconButton
                    onClick={() => camera.toggleFacing()}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'rgba(0,0,0,0.5)',
                      color: '#fff',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                    }}
                  >
                    <CameraswitchIcon />
                  </IconButton>
                </Box>
              )}

              {/* Model loading status */}
              {poseDetector.modelStatus === 'loading' && (
                <Box sx={{ py: 2 }}>
                  <CircularProgress size={24} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    AI 모델 로딩 중...
                  </Typography>
                  <LinearProgress sx={{ mt: 1 }} />
                </Box>
              )}

              {poseDetector.modelError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {poseDetector.modelError}
                </Alert>
              )}

              {poseDetector.modelStatus === 'ready' && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  AI 모델 준비 완료
                </Alert>
              )}
            </Box>
          )}

          {(!isAiMode || (camera.status === 'active' && poseDetector.modelStatus === 'ready')) ? (
            <>
              <Typography variant="h3" sx={{ mb: 4 }}>준비되셨나요?</Typography>
              <Button
                variant="contained"
                size="large"
                onClick={startMeasure}
                sx={{ px: 6, py: 2 }}
              >
                시작!
              </Button>
            </>
          ) : !isAiMode ? null : (
            camera.status === 'idle' && !camera.error ? null : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                카메라와 AI 모델이 준비되면 시작할 수 있습니다.
              </Typography>
            )
          )}

          <Box sx={{ mt: 2 }}>
            <Button variant="text" onClick={handleBackToSelect}>뒤로</Button>
          </Box>
        </Box>
      )}

      {/* 측정 중 */}
      {phase === 'measuring' && (
        <Box
          onClick={!isAiMode ? () => setManualCount((c) => c + 1) : undefined}
          sx={{
            textAlign: 'center',
            py: isAiMode ? 2 : 4,
            cursor: !isAiMode ? 'pointer' : 'default',
            userSelect: 'none',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Typography variant="h6" color="text.secondary">
            {EVENT_LABELS[eventType]} ({isAiMode ? 'AI' : '수동'})
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

          {/* AI camera view during measurement */}
          {isAiMode && camera.stream && (
            <Box sx={{ position: 'relative', mb: 2 }}>
              <video
                ref={videoRef}
                style={{
                  width: '100%',
                  maxHeight: 280,
                  borderRadius: 8,
                  transform: camera.facing === 'user' ? 'scaleX(-1)' : 'none',
                  objectFit: 'cover',
                }}
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transform: camera.facing === 'user' ? 'scaleX(-1)' : 'none',
                  pointerEvents: 'none',
                }}
              />
              {/* Jump state indicator */}
              <Chip
                label={
                  jumpCounter.state === 'jumping'
                    ? '점프!'
                    : jumpCounter.state === 'standing'
                      ? '착지'
                      : jumpCounter.state === 'squatting'
                        ? '구부림'
                        : '대기'
                }
                size="small"
                color={jumpCounter.state === 'jumping' ? 'success' : 'default'}
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  fontWeight: 700,
                }}
              />
              {/* Confidence indicator */}
              <Chip
                label={`감지: ${Math.round(jumpCounter.confidence * 100)}%`}
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: '#fff',
                }}
              />
            </Box>
          )}

          <Typography
            variant="h1"
            sx={{ fontWeight: 900, fontSize: { xs: '4rem', sm: '6rem' }, my: 2 }}
          >
            {count}
          </Typography>

          {!isAiMode && (
            <Typography variant="body1" color="text.secondary">
              화면을 탭하여 카운트
            </Typography>
          )}

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
            {EVENT_LABELS[eventType]} | 30초 | {isAiMode ? 'AI 측정' : '수동 카운트'}
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
