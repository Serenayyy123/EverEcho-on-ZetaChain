import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../hooks/useWallet';
import { useRegister } from '../hooks/useRegister';
import { ProfileData } from '../api/client';
import { DarkPageLayout } from '../components/layout/DarkPageLayout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { NetworkGuard } from '../components/ui/NetworkGuard';
import { addEchoTokenToWallet } from '../utils/addEchoTokenToWallet';
import * as nacl from 'tweetnacl';

/**
 * 注册页面
 * 冻结点 2.2-P0-B1：POST profile → register(profileURI)
 */

export function Register() {
  const navigate = useNavigate();
  const { address, chainId, signer } = useWallet();
  const { isRegistering, error, txHash, register, capReached } = useRegister(
    signer,
    chainId,
    (mintedAmount) => {
      console.log('Registration successful, minted:', mintedAmount);
    }
  );

  const [nickname, setNickname] = useState('');
  const [city, setCity] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [telegram, setTelegram] = useState('');
  const [customTag, setCustomTag] = useState(''); // 新增：自定义 tag 输入
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Add Token Modal state
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);
  const [addTokenStatus, setAddTokenStatus] = useState<'idle' | 'adding' | 'success' | 'error'>('idle');
  const [addTokenError, setAddTokenError] = useState('');

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证表单
    const errors: Record<string, string> = {};
    
    if (!nickname.trim()) {
      errors.nickname = 'Nickname is required';
    }
    
    if (!city.trim()) {
      errors.city = 'City is required';
    }
    
    if (selectedSkills.length === 0) {
      errors.skills = 'Please select at least one skill';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      // 生成 NaCl 加密密钥对（32 字节公钥）
      const keyPair = nacl.box.keyPair();
      
      // 将 Uint8Array 转换为十六进制字符串（浏览器兼容）
      const publicKeyHex = Array.from(keyPair.publicKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      const encryptionPubKey = '0x' + publicKeyHex;
      
      // 保存私钥到 localStorage（仅用于演示，生产环境应使用更安全的方式）
      const privateKeyHex = Array.from(keyPair.secretKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(`encryptionPrivateKey_${address}`, privateKeyHex);
      
      console.log('[Register] Generated encryption key pair');
      console.log('  Public key:', encryptionPubKey);
      console.log('  Public key length:', keyPair.publicKey.length, 'bytes');
      
      // 格式化 telegram（如果填写）
      const telegramValue = telegram.trim();
      const contacts = telegramValue ? (telegramValue.startsWith('@') ? telegramValue : `@${telegramValue}`) : '';

      const profileData: ProfileData = {
        address: address!, // 后端需要 address 字段
        nickname: nickname.trim(),
        city: city.trim(),
        skills: selectedSkills, // 后端需要数组格式
        contacts, // 新增 telegram 联系方式
        encryptionPubKey,
      };
      
      const success = await register(profileData);
      if (success) {
        // Always show add token modal after successful registration
        setShowAddTokenModal(true);
        // Don't auto-navigate, let user interact with modal
      }
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  // 处理技能选择
  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => {
      const newSkills = prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill];
      
      // 清除技能错误
      if (newSkills.length > 0 && formErrors.skills) {
        setFormErrors(prev => ({ ...prev, skills: '' }));
      }
      
      return newSkills;
    });
  };

  // 新增：处理自定义 tag 添加
  const handleAddCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedSkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedSkills(prev => [...prev, trimmed]);
      setCustomTag('');
      // 清除技能错误
      if (formErrors.skills) {
        setFormErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  // 新增：处理自定义 tag 输入（支持回车和逗号）
  const handleCustomTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  // 新增：删除单个 tag
  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills(prev => prev.filter(s => s !== skill));
  };

  // Handle Add ECHO Token to Wallet
  const handleAddToken = async () => {
    const tokenAddress = import.meta.env.VITE_EOCHO_TOKEN_ADDRESS;
    if (!tokenAddress) {
      setAddTokenError('Token address not configured');
      setAddTokenStatus('error');
      return;
    }

    setAddTokenStatus('adding');
    setAddTokenError('');

    try {
      const added = await addEchoTokenToWallet(tokenAddress);
      if (added) {
        setAddTokenStatus('success');
        localStorage.setItem('everecho_hasWatchedECHO', 'true');
        setTimeout(() => {
          setShowAddTokenModal(false);
          navigate('/tasks');
        }, 1500);
      } else {
        setAddTokenStatus('error');
        setAddTokenError('User rejected the request');
        localStorage.setItem('everecho_hasWatchedECHO', 'true');
      }
    } catch (error: any) {
      setAddTokenStatus('error');
      setAddTokenError(error.message || 'Failed to add token');
      localStorage.setItem('everecho_hasWatchedECHO', 'true');
    }
  };

  const handleSkipAddToken = () => {
    localStorage.setItem('everecho_hasWatchedECHO', 'true');
    setShowAddTokenModal(false);
    navigate('/tasks');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const availableSkills = [
    'Web Development',
    'Mobile Development',
    'UI/UX Design',
    'Content Writing',
    'Translation',
    'Data Entry',
    'Marketing',
    'Customer Support',
  ];

  if (!address) {
    return (
      <DarkPageLayout title="Register" theme="light">
        <Card>
          <Alert variant="warning">
            Please connect your wallet first to register.
          </Alert>
        </Card>
      </DarkPageLayout>
    );
  }

  return (
    <DarkPageLayout title="Create Your Profile" theme="light">
      <NetworkGuard chainId={chainId}>
        <Card>
          <div style={styles.content}>
            <p style={styles.subtitle}>
              Complete your registration to start using EverEcho
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <Input
                label="Nickname *"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (formErrors.nickname) {
                    setFormErrors(prev => ({ ...prev, nickname: '' }));
                  }
                }}
                placeholder="Enter your nickname"
                error={formErrors.nickname}
                disabled={isRegistering}
              />

              <Input
                label="City *"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  if (formErrors.city) {
                    setFormErrors(prev => ({ ...prev, city: '' }));
                  }
                }}
                placeholder="Enter your city"
                error={formErrors.city}
                disabled={isRegistering}
              />

              <div style={styles.skillsSection}>
                <label style={styles.label}>Tags *</label>
                
                {/* 预置 tags 快捷按钮 */}
                <div style={styles.skillsGrid}>
                  {availableSkills.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      disabled={isRegistering}
                      style={{
                        ...styles.skillButton,
                        ...(selectedSkills.includes(skill) ? styles.skillButtonActive : {}),
                      }}
                    >
                      {skill}
                    </button>
                  ))}
                </div>

                {/* 自定义 tag 输入 */}
                <div style={styles.customTagInput}>
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={handleCustomTagKeyDown}
                    placeholder="Add custom tag (e.g., ENTJ, Travel)"
                    disabled={isRegistering}
                    style={styles.input}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={isRegistering || !customTag.trim()}
                    style={{
                      ...styles.addButton,
                      ...(isRegistering || !customTag.trim() ? styles.addButtonDisabled : {}),
                    }}
                  >
                    ➕ Add
                  </button>
                </div>

                {/* 已选择的 tags */}
                {selectedSkills.length > 0 && (
                  <div style={styles.selectedTagsContainer}>
                    {selectedSkills.map((skill, index) => (
                      <div key={index} style={styles.selectedTag}>
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          disabled={isRegistering}
                          style={styles.removeTagButton}
                        >
                          ✖
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formErrors.skills && (
                  <p style={styles.errorText}>{formErrors.skills}</p>
                )}
                <p style={styles.hint}>
                  Selected: {selectedSkills.length} tag{selectedSkills.length !== 1 ? 's' : ''}
                </p>
              </div>

              <Input
                label="Telegram (Optional)"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username or username"
                disabled={isRegistering}
              />

              {error && (
                <Alert variant="error">
                  {error}
                </Alert>
              )}

              {txHash && !capReached && (
                <Alert variant="success">
                  Registration successful! Minted 100 ECHO.
                  <br />
                  <small>Transaction: {txHash.slice(0, 10)}...</small>
                </Alert>
              )}

              {txHash && capReached && (
                <Alert variant="info">
                  Registration transaction submitted: {txHash.slice(0, 10)}...
                  <br />
                  <small>Please wait for confirmation...</small>
                </Alert>
              )}

              {capReached && (
                <Alert variant="warning" title="CAP Reached">
                  CAP reached, no ECHO minted. Please earn ECHO by completing tasks.
                </Alert>
              )}

              <Button
                type="submit"
                loading={isRegistering}
                fullWidth
                size="lg"
                variant="secondary"
                theme="light"
              >
                Register
              </Button>
            </form>
          </div>
        </Card>
      </NetworkGuard>

      {/* Add ECHO Token Modal */}
      {showAddTokenModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>🎉 You received 100 ECHO!</h3>
            <p style={styles.modalText}>Add ECHO to your wallet for easy access?</p>

            {addTokenStatus === 'idle' && (
              <>
                <Button
                  onClick={handleAddToken}
                  fullWidth
                  style={{ marginBottom: '12px' }}
                >
                  Add ECHO to Wallet
                </Button>
                <Button
                  onClick={handleSkipAddToken}
                  variant="secondary"
                  fullWidth
                >
                  Skip
                </Button>
              </>
            )}

            {addTokenStatus === 'adding' && (
              <p style={styles.modalText}>Opening wallet...</p>
            )}

            {addTokenStatus === 'success' && (
              <Alert variant="success">ECHO added to wallet ✅</Alert>
            )}

            {addTokenStatus === 'error' && (
              <>
                <Alert variant="warning">
                  {addTokenError || "Your wallet doesn't support one-click add. Please add manually."}
                </Alert>
                <div style={styles.manualInfo}>
                  <p style={styles.manualTitle}>Manual Import Info:</p>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Address:</span>
                    <div style={styles.infoValue}>
                      <code style={styles.code}>{import.meta.env.VITE_EOCHO_TOKEN_ADDRESS}</code>
                      <button
                        onClick={() => copyToClipboard(import.meta.env.VITE_EOCHO_TOKEN_ADDRESS)}
                        style={styles.copyButton}
                      >
                        📋
                      </button>
                    </div>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Symbol:</span>
                    <span style={styles.infoValue}>ECHO</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Decimals:</span>
                    <span style={styles.infoValue}>18</span>
                  </div>
                </div>
                <Button
                  onClick={handleSkipAddToken}
                  variant="secondary"
                  fullWidth
                  style={{ marginTop: '12px' }}
                >
                  Close
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </DarkPageLayout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  content: {
    maxWidth: '550px',
    margin: '0 auto',
  },
  subtitle: {
    fontSize: '16px',
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  skillsSection: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
  },
  skillsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '8px',
    marginBottom: '8px',
  },
  skillButton: {
    padding: '10px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
    fontWeight: 500,
  },
  skillButtonActive: {
    backgroundColor: '#2563eb',
    color: 'white',
    borderColor: '#2563eb',
  },
  errorText: {
    marginTop: '4px',
    fontSize: '14px',
    color: '#ef4444',
  },
  hint: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '8px',
  },
  customTagInput: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  input: {
    flex: 1,
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
  },
  addButton: {
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: 500,
    color: 'white',
    backgroundColor: '#2563eb',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  addButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
  },
  selectedTagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '12px',
  },
  selectedTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    backgroundColor: '#2563eb',
    color: 'white',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
  },
  removeTagButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 4px',
    opacity: 0.8,
    transition: 'opacity 0.2s',
  },
  // Add Token Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 600,
    marginBottom: '12px',
    color: '#FFFFFF',
  },
  modalText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px',
  },
  manualInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
  },
  manualTitle: {
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#374151',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '13px',
  },
  infoLabel: {
    fontWeight: 500,
    color: '#6b7280',
  },
  infoValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#111827',
  },
  code: {
    fontSize: '11px',
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  copyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
  },
};
