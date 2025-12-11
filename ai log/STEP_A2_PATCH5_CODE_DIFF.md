# Step A2 Patch-5 代码 Diff

## 修改文件列表
1. `frontend/src/hooks/useTasks.ts`
2. `frontend/src/pages/TaskSquare.tsx`
3. `frontend/src/pages/TaskDetail.tsx`

---

## 1. useTasks.ts

### Diff 1.1: Task 接口添加 metadataError 字段

```diff
  export interface Task {
    taskId: number;
    creator: string;
    helper: string;
    reward: string;
    taskURI: string;
    status: TaskStatus;
    createdAt: number;
    acceptedAt: number;
    submittedAt: number;
    terminateRequestedBy: string;
    terminateRequestedAt: number;
    fixRequested: boolean;
    fixRequestedAt: number;
    metadata?: TaskData;
+   metadataError?: boolean; // 元数据加载失败标记
  }
```

### Diff 1.2: loadSingleTask 设置 metadataError

```diff
    const loadSingleTask = async (
      contract: ethers.Contract,
      taskId: number
    ): Promise<Task | null> => {
      try {
        const taskData = await contract.tasks(taskId);
        
        // 加载元数据
        let metadata: TaskData | undefined;
+       let metadataError = false;
        try {
          metadata = await apiClient.getTask(taskData.taskURI);
        } catch (err) {
-         console.warn(`Failed to load metadata for task ${taskId}`);
+         console.warn(`Failed to load metadata for task ${taskId}:`, err);
+         metadataError = true; // 标记元数据加载失败
        }

        return {
          taskId,
          creator: taskData.creator,
          helper: taskData.helper,
          reward: ethers.formatEther(taskData.reward),
          taskURI: taskData.taskURI,
          status: Number(taskData.status),
          createdAt: Number(taskData.createdAt),
          acceptedAt: Number(taskData.acceptedAt),
          submittedAt: Number(taskData.submittedAt),
          terminateRequestedBy: taskData.terminateRequestedBy,
          terminateRequestedAt: Number(taskData.terminateRequestedAt),
          fixRequested: taskData.fixRequested,
          fixRequestedAt: Number(taskData.fixRequestedAt),
          metadata,
+         metadataError,
        };
      } catch (err) {
        console.error(`Failed to load task ${taskId}:`, err);
        return null;
      }
    };
```

### Diff 1.3: useTask 设置 metadataError

```diff
        const taskData = await contract.tasks(taskId);
        
        // 加载元数据
        let metadata: TaskData | undefined;
+       let metadataError = false;
        try {
          metadata = await apiClient.getTask(taskData.taskURI);
        } catch (err) {
-         console.warn(`Failed to load metadata for task ${taskId}`);
+         console.warn(`Failed to load metadata for task ${taskId}:`, err);
+         metadataError = true; // 标记元数据加载失败
        }

        setTask({
          taskId,
          creator: taskData.creator,
          helper: taskData.helper,
          reward: ethers.formatEther(taskData.reward),
          taskURI: taskData.taskURI,
          status: Number(taskData.status),
          createdAt: Number(taskData.createdAt),
          acceptedAt: Number(taskData.acceptedAt),
          submittedAt: Number(taskData.submittedAt),
          terminateRequestedBy: taskData.terminateRequestedBy,
          terminateRequestedAt: Number(taskData.terminateRequestedAt),
          fixRequested: taskData.fixRequested,
          fixRequestedAt: Number(taskData.fixRequestedAt),
          metadata,
+         metadataError,
        });
```

---

## 2. TaskSquare.tsx

### Diff 2.1: 添加元数据加载失败提示

```diff
        {!loading && !error && filteredTasks.length > 0 && (
+         <>
+           {/* 元数据加载失败提示 */}
+           {filteredTasks.some(task => task.metadataError) && (
+             <div style={styles.metadataWarning}>
+               ⚠️ Some task metadata failed to load. Task details may be incomplete.
+             </div>
+           )}
+           
            <div style={styles.taskGrid}>
              {filteredTasks.map(task => (
                <TaskCard key={task.taskId} task={task} />
              ))}
            </div>
+         </>
        )}
```

### Diff 2.2: 添加警告样式

```diff
  const styles: Record<string, React.CSSProperties> = {
    // ... 其他样式
    
    taskGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '20px',
    },
+   metadataWarning: {
+     backgroundColor: '#fff3cd',
+     color: '#856404',
+     padding: '12px 16px',
+     borderRadius: '8px',
+     marginBottom: '20px',
+     border: '1px solid #ffeaa7',
+     fontSize: '14px',
+   },
    card: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '40px',
      maxWidth: '600px',
      margin: '0 auto',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      textAlign: 'center',
    },
    
    // ... 其他样式
  };
```

---

## 3. TaskDetail.tsx

### Diff 3.1: 添加 metadataError 状态

```diff
  export function TaskDetail() {
    const { taskId } = useParams<{ taskId: string }>();
    const navigate = useNavigate();
    const { address, chainId, provider, signer } = useWallet();
    
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
+   const [metadataError, setMetadataError] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [txHash, setTxHash] = useState<string | null>(null);
```

### Diff 3.2: 设置 metadataError 状态

```diff
          // 获取元数据
          try {
            const response = await fetch(taskData.taskURI);
            if (response.ok) {
              onChainTask.metadata = await response.json();
+             setMetadataError(false);
+           } else {
+             setMetadataError(true);
            }
          } catch (e) {
            console.error('Failed to fetch metadata:', e);
+           setMetadataError(true);
          }

          setTask(onChainTask);
```

### Diff 3.3: 显示元数据加载失败警告

```diff
        {/* Status Badge */}
        <div style={{...styles.statusBadge, ...getStatusStyle(task.status)}}>
          {TaskStatusLabels[task.status]}
        </div>

+       {/* Metadata Error Warning */}
+       {metadataError && (
+         <div style={styles.metadataWarning}>
+           ⚠️ Failed to load task metadata. Title and description may be unavailable.
+         </div>
+       )}

        {/* Description */}
        {task.metadata?.description && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Description</h3>
            <p style={styles.description}>{task.metadata.description}</p>
          </div>
        )}
```

### Diff 3.4: 添加警告样式

```diff
  const styles: Record<string, React.CSSProperties> = {
    // ... 其他样式
    
    statusBadge: {
      display: 'inline-block',
      padding: '6px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      marginBottom: '24px',
    },
+   metadataWarning: {
+     backgroundColor: '#fff3cd',
+     color: '#856404',
+     padding: '12px 16px',
+     borderRadius: '8px',
+     marginBottom: '20px',
+     border: '1px solid #ffeaa7',
+     fontSize: '14px',
+   },
    section: {
      marginBottom: '32px',
    },
    
    // ... 其他样式
  };
```

---

## 修改统计

**新增代码**：
- Task 接口：1 个字段
- useTasks.ts：2 处 metadataError 设置
- TaskSquare.tsx：1 个警告组件 + 1 个样式
- TaskDetail.tsx：1 个状态 + 1 个警告组件 + 1 个样式

**修改代码**：
- console.warn 增加错误参数（2 处）
- fetch 错误处理增强（1 处）

**总计**：
- 新增行数：~40 行
- 修改行数：~10 行
- 修改文件：3 个

---

## 验收结果

✅ **通过**

- 编译无错误
- 类型定义正确
- UI 提示清晰
- 不影响现有功能
