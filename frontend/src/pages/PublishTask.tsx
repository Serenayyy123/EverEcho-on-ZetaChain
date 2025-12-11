import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useProfile } from '../hooks/useProfile';
import { useCreateTask } from '../hooks/useCreateTask';
import { DarkPageLayout } from '../components/layout/DarkPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { NetworkGuard } from '../components/ui/NetworkGuard';
import { CATEGORY_OPTIONS, TaskCategoryKey } from '../types/category';

/**
 * 发布任务页面（P0-F4）
 * 冻结点 2.2-P0-F4：先链下后链上
 * 冻结点 1.2-10：MAX_REWARD 硬限制
 * 冻结点 1.3-14：余额前置检查
 * 联系方式流程：自动从 Profile 获取，不再手动输入
 */

export function PublishTask() {
  const navigate = useNavigate();
  const { address, chainId, signer, provider } = useWallet();
  const { profile, loading: profileLoading } = useProfile(address, provider);
  const { createTask, loading, error, txHash, step, MAX_REWARD } = useCreateTask(signer, provider);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('');
  const [category, setCategory] = useState<TaskCategoryKey | ''>(''); // Category is optional

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 表单验证
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required';
    }

    if (!description.trim()) {
      errors.description = 'Description is required';
    }

    // 验证联系方式（从 Profile 获取）
    if (!profile?.contacts) {
      errors.contacts = 'Please add contact info in your Profile first';
    }

    if (!reward.trim()) {
      errors.reward = 'Reward is required';
    } else {
      const rewardNum = parseFloat(reward);
      if (isNaN(rewardNum) || rewardNum <= 0) {
        errors.reward = 'Reward must be a positive number';
      } else if (rewardNum > MAX_REWARD) {
        errors.reward = `Reward cannot exceed ${MAX_REWARD} ECHO`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // 使用 Profile 中的联系方式
    const txHash = await createTask({
      title,
      description,
      contactsPlaintext: profile!.contacts!, // 传递明文联系方式
      reward,
      category: category || undefined, // Optional category
    });

    if (txHash) {
      // 成功后跳转到任务广场
      setTimeout(() => {
        navigate('/tasks');
      }, 2000);
    }
  };

  if (!address) {
    return (
      <DarkPageLayout title="Publish Task" theme="light">
        <Card>
          <Alert variant="warning">
            Please connect your wallet to publish a task.
          </Alert>
        </Card>
      </DarkPageLayout>
    );
  }

  return (
    <DarkPageLayout title="Publish New Task" theme="light">
      <NetworkGuard chainId={chainId}>
        <Card>
          <div style={styles.content}>
            <p style={styles.subtitle}>
              Create a new task and find helpers in the EverEcho marketplace
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <Input
                label="Title *"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (formErrors.title) {
                    setFormErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                placeholder="Enter task title"
                error={formErrors.title}
                disabled={loading}
              />

              <TextArea
                label="Description *"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description) {
                    setFormErrors(prev => ({ ...prev, description: '' }));
                  }
                }}
                placeholder="Describe the task in detail"
                rows={4}
                error={formErrors.description}
                disabled={loading}
              />

              <Input
                label="Reward (ECHO) *"
                type="number"
                value={reward}
                onChange={(e) => {
                  setReward(e.target.value);
                  if (formErrors.reward) {
                    setFormErrors(prev => ({ ...prev, reward: '' }));
                  }
                }}
                placeholder="Enter reward amount"
                hint={`Maximum: ${MAX_REWARD} ECHO`}
                error={formErrors.reward}
                disabled={loading}
                step="0.01"
                min="0"
                max={MAX_REWARD}
              />

              {/* Category Selection (Optional) */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Category (optional)</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TaskCategoryKey | '')}
                  style={styles.select}
                  disabled={loading}
                >
                  <option value="">-- Select a category --</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p style={styles.hint}>
                  Helps others find your task more easily
                </p>
              </div>

              {/* 联系方式预览（从 Profile 自动获取） */}
              <div style={styles.contactsSection}>
                <label style={styles.label}>Contact information *</label>
                {profileLoading ? (
                  <div style={styles.contactsLoading}>
                    <p style={styles.loadingText}>Loading profile...</p>
                  </div>
                ) : profile?.contacts ? (
                  <div style={styles.contactsPreview}>
                    <div style={styles.contactsHeader}>
                      <span style={styles.contactsIcon}>📱</span>
                      <span style={styles.contactsValue}>{profile.contacts}</span>
                    </div>
                    <p style={styles.contactsHint}>
                      This will be encrypted and shared with the Helper after they accept the task
                    </p>
                  </div>
                ) : (
                  <div style={styles.contactsWarning}>
                    <Alert variant="warning">
                      ⚠️ No contact info in your profile.{' '}
                      <Link to="/profile" style={styles.link}>
                        Add contact info in Profile
                      </Link>
                    </Alert>
                  </div>
                )}
                {formErrors.contacts && (
                  <p style={styles.errorText}>{formErrors.contacts}</p>
                )}
              </div>

              {/* Status Messages */}
              {step && (
                <Alert variant="info">
                  {step}
                </Alert>
              )}

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              {txHash && (
                <Alert variant="success">
                  Transaction sent: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  <br />
                  <small>Redirecting to Task Square...</small>
                </Alert>
              )}

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                fullWidth
                loading={loading}
                disabled={loading || !profile?.contacts}
                theme="light"
              >
                Publish Task
              </Button>
            </form>
          </div>
        </Card>
      </NetworkGuard>
    </DarkPageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    maxWidth: '650px',
    margin: '0 auto',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center',
    color: '#D1D5DB',
    fontWeight: 500,
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  contactsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: '#1A1A1A',
    marginBottom: '5px',
    letterSpacing: '0.02em',
  },
  contactsLoading: {
    padding: '16px',
    backgroundColor: 'rgba(26, 26, 26, 0.03)',
    borderRadius: '10px',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: '14px',
    color: '#D1D5DB',
    fontWeight: 500,
    margin: 0,
  },
  contactsPreview: {
    padding: '16px',
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    border: '1px solid rgba(37, 99, 235, 0.2)',
    borderRadius: '10px',
  },
  contactsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  contactsIcon: {
    fontSize: '20px',
  },
  contactsValue: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1d4ed8',
  },
  contactsHint: {
    fontSize: '13px',
    color: '#2D2D2D',
    fontWeight: 500,
    margin: 0,
    lineHeight: '1.5',
  },
  contactsWarning: {
    marginTop: '4px',
  },
  link: {
    color: '#2563eb',
    textDecoration: 'underline',
    fontWeight: 500,
  },
  errorText: {
    fontSize: '13px',
    color: '#dc2626',
    margin: '4px 0 0 0',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  select: {
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: 500,
    border: '1px solid rgba(26, 26, 26, 0.12)',
    borderRadius: '10px',
    backgroundColor: 'rgba(26, 26, 26, 0.05)',
    color: '#1A1A1A',
    cursor: 'pointer',
    outline: 'none',
  },
  hint: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontWeight: 500,
    margin: 0,
  },
};
