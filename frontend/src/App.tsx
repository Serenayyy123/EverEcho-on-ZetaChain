import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { TaskSquare } from './pages/TaskSquare';
import { TaskSquareV2 } from './pages/TaskSquareV2';
import { TaskDetail } from './pages/TaskDetail';
import { Profile } from './pages/Profile';
import { PublishTask } from './pages/PublishTask';
import { ToastContainer } from './components/ui/ToastContainer';

/**
 * 主应用组件
 * P0-F1：钱包连接与注册
 * P0-F2：任务广场与详情
 * P0-F3：Profile 页面
 * P0-F4：发布任务
 */

function App() {
  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tasks" element={<TaskSquareV2 />} />
        <Route path="/tasks-old" element={<TaskSquare />} />
        <Route path="/tasks/:taskId" element={<TaskDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/publish" element={<PublishTask />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
