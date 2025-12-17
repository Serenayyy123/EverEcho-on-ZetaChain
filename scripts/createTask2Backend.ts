import axios from 'axios';

async function main() {
  console.log("🔧 在后端创建任务2数据");
  console.log("=====================================");
  
  const backendUrl = 'http://localhost:3001';
  
  // 任务2的数据
  const task2Data = {
    title: "test",
    description: "test", 
    contactsEncryptedPayload: "test contact info", // 这会被当作明文处理
    createdAt: Date.now(),
    creatorAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Creator1地址
    category: "coffeechat"
  };
  
  try {
    console.log("📤 发送任务2数据到后端...");
    const response = await axios.post(`${backendUrl}/api/task`, task2Data);
    
    console.log("✅ 任务2创建成功:");
    console.log(`   TaskURI: ${response.data.taskURI}`);
    console.log(`   Success: ${response.data.success}`);
    
    // 验证任务2是否可以读取
    console.log("\n📤 验证任务2数据...");
    const getResponse = await axios.get(`${backendUrl}/api/task/2`);
    
    console.log("✅ 任务2数据验证成功:");
    console.log(`   Title: ${getResponse.data.title}`);
    console.log(`   Creator: ${getResponse.data.creator}`);
    console.log(`   CreatorNickname: ${getResponse.data.creatorNickname}`);
    console.log(`   Category: ${getResponse.data.category}`);
    
  } catch (error) {
    console.error("❌ 创建任务2失败:", error.response?.data || error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});