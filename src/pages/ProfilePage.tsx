import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser } from '@/services/firestore';
import type { SchoolLevel } from '@/types';

const SCHOOL_LEVELS: { value: SchoolLevel; label: string }[] = [
  { value: 'elementary', label: '초등학교' },
  { value: 'middle', label: '중학교' },
  { value: 'high', label: '고등학교' },
  { value: 'university', label: '대학교' },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { firebaseUser, profile, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('elementary');
  const [grade, setGrade] = useState(1);
  const [classNumber, setClassNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setSchoolId(profile.schoolId);
      setSchoolLevel(profile.schoolLevel);
      setGrade(profile.grade);
      setClassNumber(profile.classNumber?.toString() ?? '');
    }
  }, [profile]);

  if (!firebaseUser) {
    return (
      <Container maxWidth="sm" sx={{ py: 3 }}>
        <Alert severity="info">프로필을 보려면 로그인해주세요.</Alert>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          로그인
        </Button>
      </Container>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    await updateUser(firebaseUser.uid, {
      name,
      schoolId,
      schoolLevel,
      grade,
      classNumber: classNumber ? Number(classNumber) : undefined,
    });
    await refreshProfile();
    setSaving(false);
    setSuccess(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>프로필 설정</Typography>

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>저장되었습니다.</Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          기본 정보
        </Typography>
        <TextField
          fullWidth
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="이메일"
          value={firebaseUser.email ?? ''}
          disabled
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          학교 정보
        </Typography>
        <TextField
          fullWidth
          label="학교명 (또는 학교 ID)"
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          placeholder="예: 서울초등학교"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          select
          label="학교급"
          value={schoolLevel}
          onChange={(e) => setSchoolLevel(e.target.value as SchoolLevel)}
          sx={{ mb: 2 }}
        >
          {SCHOOL_LEVELS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="학년"
            type="number"
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            slotProps={{ htmlInput: { min: 1, max: 6 } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="반 (선택)"
            type="number"
            value={classNumber}
            onChange={(e) => setClassNumber(e.target.value)}
            slotProps={{ htmlInput: { min: 1 } }}
            sx={{ flex: 1 }}
          />
        </Box>
      </Paper>

      <Button
        variant="contained"
        fullWidth
        size="large"
        onClick={handleSave}
        disabled={saving}
        sx={{ mb: 2 }}
      >
        {saving ? '저장 중...' : '저장'}
      </Button>

      <Button variant="outlined" fullWidth color="error" onClick={handleSignOut}>
        로그아웃
      </Button>
    </Container>
  );
}
