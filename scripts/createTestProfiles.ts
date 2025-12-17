import axios from 'axios';

async function main() {
  console.log("👤 创建测试账户 Profile 信息");
  console.log("=====================================");
  
  const backendUrl = 'http://localhost:3001';
  
  // 测试账户 Profile 数据
  const testProfiles = [
    {
      address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      nickname: "TestCreator1",
      city: "Beijing",
      skills: ["Task Creation", "Project Management", "Testing"],
      encryptionPubKey: "test_pubkey_creator1_mock",
      contacts: "Telegram: @testcreator1, Email: creator1@test.com"
    },
    {
      address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      nickname: "TestHelper1", 
      city: "Shanghai",
      skills: ["Development", "Testing", "Problem Solving"],
      encryptionPubKey: "test_pubkey_helper1_mock",
      contacts: "Telegram: @testhelper1, Email: helper1@test.com"
    },
    {
      address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
      nickname: "TestCreator2",
      city: "Shenzhen", 
      skills: ["Cross-chain", "DeFi", "Testing"],
      encryptionPubKey: "test_pubkey_creator2_mock",
      contacts: "Telegram: @testcreator2, Email: creator2@test.com"
    },
    {
      address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
      nickname: "TestHelper2",
      city: "Hangzhou",
      skills: ["Cross-chain", "Token Management", "Testing"], 
      encryptionPubKey: "test_pubkey_helper2_mock",
      contacts: "Telegram: @testhelper2, Email: helper2@test.com"
    }
  ];

  console.log(`🔗 后端 API: ${backendUrl}`);
  console.log("");

  for (const profile of testProfiles) {
    try {
      console.log(`📝 创建 ${profile.nickname} (${profile.address})...`);
      
      // 创建 Profile
      const response = await axios.post(`${backendUrl}/api/profile`, {
        address: profile.address,
        nickname: profile.nickname,
        city: profile.city,
        skills: profile.skills,
        encryptionPubKey: profile.encryptionPubKey,
        contacts: profile.contacts
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ ${profile.nickname} Profile 创建成功`);
        console.log(`      昵称: ${profile.nickname}`);
        console.log(`      城市: ${profile.city}`);
        console.log(`      联系方式: ${profile.contacts}`);
        console.log(`      技能: ${profile.skills.join(", ")}`);
      } else {
        console.log(`   ⚠️ ${profile.nickname} 创建响应: ${response.status}`);
      }
      
    } catch (error: any) {
      if (error.response) {
        console.log(`   ❌ ${profile.nickname} 创建失败: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
        if (error.response.data) {
          console.log(`      详细信息: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        console.log(`   ❌ ${profile.nickname} 网络错误: ${error.message}`);
      }
    }
    
    console.log("");
  }

  console.log("🔍 验证创建结果...");
  console.log("=====================================");
  
  // 验证每个 Profile 是否创建成功
  for (const profile of testProfiles) {
    try {
      const response = await axios.get(`${backendUrl}/api/profile/${profile.address}`);
      
      if (response.status === 200) {
        const data = response.data;
        console.log(`✅ ${profile.nickname}: Profile 读取成功`);
        console.log(`   昵称: ${data.nickname}`);
        console.log(`   城市: ${data.city}`);
        console.log(`   联系方式: ${data.contacts}`);
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`❌ ${profile.nickname}: Profile 未找到 (404)`);
      } else {
        console.log(`❌ ${profile.nickname}: 读取失败 (${error.response?.status || 'Network Error'})`);
      }
    }
  }

  console.log("");
  console.log("🎯 测试指南:");
  console.log("=====================================");
  console.log("现在你可以:");
  console.log("1. 访问 http://localhost:5173/");
  console.log("2. 连接 MetaMask (localhost, ChainId: 31337)");
  console.log("3. 导入任意测试账户私钥");
  console.log("4. 前端应该能正确显示 Profile 信息");
  console.log("5. 发布任务时联系信息会自动填充");
  console.log("");
  console.log("✅ Profile 信息设置完成！");
}

// 安装 axios 如果没有的话
main().catch((error) => {
  if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('axios')) {
    console.log("❌ 需要安装 axios:");
    console.log("请运行: npm install axios");
    console.log("然后重新执行此脚本");
  } else {
    console.error("脚本执行失败:", error);
  }
  process.exitCode = 1;
});