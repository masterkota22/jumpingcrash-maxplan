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
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser, getAllSchools, createSchool } from '@/services/firestore';
import type { School, SchoolLevel } from '@/types';

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
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>('elementary');
  const [grade, setGrade] = useState(1);
  const [classNumber, setClassNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // School search
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [schoolsLoading, setSchoolsLoading] = useState(true);

  // New school dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolLevel, setNewSchoolLevel] = useState<SchoolLevel>('elementary');
  const [newSchoolRegion, setNewSchoolRegion] = useState('');
  const [dialogSaving, setDialogSaving] = useState(false);

  // Load schools list
  useEffect(() => {
    getAllSchools()
      .then(setSchools)
      .catch(() => setError('학교 목록을 불러오는데 실패했습니다.'))
      .finally(() => setSchoolsLoading(false));
  }, []);

  // Sync form with profile
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile !== prevProfile) {
    setPrevProfile(profile);
    if (profile) {
      setName(profile.name);
      setSchoolLevel(profile.schoolLevel);
      setGrade(profile.grade);
      setClassNumber(profile.classNumber?.toString() ?? '');
      // Match selected school
      const matched = schools.find((s) => s.id === profile.schoolId);
      if (matched) setSelectedSchool(matched);
    }
  }

  // Also match school once schools are loaded
  useEffect(() => {
    if (profile && schools.length > 0 && !selectedSchool) {
      const matched = schools.find((s) => s.id === profile.schoolId);
      if (matched) setSelectedSchool(matched);
    }
  }, [schools, profile, selectedSchool]);

  const handleSave = async () => {
    if (!firebaseUser) return;
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      await updateUser(firebaseUser.uid, {
        name,
        schoolId: selectedSchool?.id ?? '',
        schoolLevel,
        grade,
        classNumber: classNumber ? Number(classNumber) : undefined,
      });
      await refreshProfile();
      setSuccess(true);
    } catch {
      setError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSchool = async () => {
    if (!newSchoolName.trim()) return;
    setDialogSaving(true);
    try {
      const id = await createSchool({
        name: newSchoolName.trim(),
        level: newSchoolLevel,
        region: newSchoolRegion.trim(),
      });
      const newSchool: School = {
        id,
        name: newSchoolName.trim(),
        level: newSchoolLevel,
        region: newSchoolRegion.trim(),
      };
      setSchools((prev) => [...prev, newSchool]);
      setSelectedSchool(newSchool);
      setDialogOpen(false);
      setNewSchoolName('');
      setNewSchoolRegion('');
    } catch {
      setError('학교 등록에 실패했습니다.');
    } finally {
      setDialogSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>프로필 설정</Typography>

      {success && <Alert severity="success" sx={{ mb: 2 }}>저장되었습니다.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
          value={firebaseUser?.email ?? ''}
          disabled
          sx={{ mb: 2 }}
        />

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          학교 정보
        </Typography>

        <Autocomplete
          options={schools}
          getOptionLabel={(option) => `${option.name} (${option.region || '지역 미설정'})`}
          value={selectedSchool}
          onChange={(_, value) => setSelectedSchool(value)}
          loading={schoolsLoading}
          noOptionsText="검색 결과 없음"
          renderInput={(params) => (
            <TextField
              {...params}
              label="학교 검색"
              placeholder="학교명을 입력하세요"
            />
          )}
          sx={{ mb: 1 }}
        />
        <Button size="small" onClick={() => setDialogOpen(true)} sx={{ mb: 2 }}>
          학교가 목록에 없나요? 새로 등록
        </Button>

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

      {/* 새 학교 등록 Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>새 학교 등록</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="학교명"
            value={newSchoolName}
            onChange={(e) => setNewSchoolName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="학교급"
            value={newSchoolLevel}
            onChange={(e) => setNewSchoolLevel(e.target.value as SchoolLevel)}
            sx={{ mb: 2 }}
          >
            {SCHOOL_LEVELS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="지역"
            value={newSchoolRegion}
            onChange={(e) => setNewSchoolRegion(e.target.value)}
            placeholder="예: 서울, 경기"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>취소</Button>
          <Button
            variant="contained"
            onClick={handleCreateSchool}
            disabled={dialogSaving || !newSchoolName.trim()}
          >
            {dialogSaving ? '등록 중...' : '등록'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
