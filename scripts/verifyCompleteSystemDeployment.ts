import { ethers } from "hardhat";

async function main() {
  console.log("🔍 验证完整系统部署结果...");

  // 新部署的合约地址
  const NEW_ADDRESSES = {
    echoToken: '0x937f10827b9Ccd99033eFEeBA26d519992F4B1AF',
    register: '0x1F8dD0d186fd77F4F1B98067B031437e8025162C',
    taskEscrow: '0x69B200141cF9553C2D17834AF149248A035Dc52B',
    universalReward: '0x8fA4C878b22279C5f602c4e9B6EC85BD23EFC6b3'
  };

  console.log("📋 验证地址:");
  console.log("- ECHO Token:", NEW_ADDRESSES.echoToken);
  console.log("- Register:", NEW_ADDRESSES.register);
  console.log("- TaskEscrow:", NEW_ADDRESSES.taskEscrow);
  console.log("- UniversalReward:", NEW_ADDRESSES.universalReward);

  try {
    // 获取合约实例
    const echoToken = await ethers.getContractAt("EOCHOToken", NEW_ADDRESSES.echoToken);
    const register = await ethers.getContractAt("Register", NEW_ADDRESSES.register);
    const taskEscrow = await ethers.getContractAt("TaskEscrow", NEW_ADDRESSES.taskEscrow);

    console.log("\n🔍 验证合约配置...");

    // 验证ECHO Token配置
    console.log("\n1. ECHO Token配置验证:");
    const echoRegisterAddr = await echoToken.registerAddress();
    const echoTaskEscrowAddr = await echoToken.taskEscrowAddress();
    
    console.log("   Register地址:", echoRegisterAddr);
    console.log("   TaskEscrow地址:", echoTaskEscrowAddr);
    
    const echoRegisterCorrect = echoRegisterAddr.toLowerCase() === NEW_ADDRESSES.register.toLowerCase();
    const echoTaskEscrowCorrect = echoTaskEscrowAddr.toLowerCase() === NEW_ADDRESSES.taskEscrow.toLowerCase();
    
    console.log("   Register配置:", echoRegisterCorrect ? "✅ 正确" : "❌ 错误");
    console.log("   TaskEscrow配置:", echoTaskEscrowCorrect ? "✅ 正确" : "❌ 错误");

    // 验证Register配置
    console.log("\n2. Register配置验证:");
    const registerEchoAddr = await register.echoToken();
    console.log("   ECHO Token地址:", registerEchoAddr);
    
    const registerEchoCorrect = registerEchoAddr.toLowerCase() === NEW_ADDRESSES.echoToken.toLowerCase();
    console.log("   ECHO Token配置:", registerEchoCorrect ? "✅ 正确" : "❌ 错误");

    // 验证TaskEscrow配置
    console.log("\n3. TaskEscrow配置验证:");
    const taskEscrowEchoAddr = await taskEscrow.echoToken();
    const taskEscrowRegisterAddr = await taskEscrow.registerContract();
    
    console.log("   ECHO Token地址:", taskEscrowEchoAddr);
    console.log("   Register地址:", taskEscrowRegisterAddr);
    
    const taskEscrowEchoCorrect = taskEscrowEchoAddr.toLowerCase() === NEW_ADDRESSES.echoToken.toLowerCase();
    const taskEscrowRegisterCorrect = taskEscrowRegisterAddr.toLowerCase() === NEW_ADDRESSES.register.toLowerCase();
    
    console.log("   ECHO Token配置:", taskEscrowEchoCorrect ? "✅ 正确" : "❌ 错误");
    console.log("   Register配置:", taskEscrowRegisterCorrect ? "✅ 正确" : "❌ 错误");

    // 验证合约状态
    console.log("\n4. 合约状态验证:");
    const echoTotalSupply = await echoToken.totalSupply();
    const taskCounter = await taskEscrow.taskCounter();
    
    console.log("   ECHO Token总供应量:", ethers.formatEther(echoTotalSupply), "ECHO");
    console.log("   TaskEscrow任务计数器:", taskCounter.toString());
    
    const isCleanState = echoTotalSupply === 0n && taskCounter === 0n;
    console.log("   系统状态:", isCleanState ? "✅ 干净状态" : "⚠️ 非干净状态");

    // 总体验证结果
    const allCorrect = echoRegisterCorrect && echoTaskEscrowCorrect && 
                      registerEchoCorrect && taskEscrowEchoCorrect && 
                      taskEscrowRegisterCorrect;

    console.log("\n📊 验证结果总结:");
    console.log("┌─────────────────────────┬────────┐");
    console.log("│ 验证项目                │ 状态   │");
    console.log("├─────────────────────────┼────────┤");
    console.log(`│ ECHO Token → Register   │ ${echoRegisterCorrect ? '✅ 通过' : '❌ 失败'} │`);
    console.log(`│ ECHO Token → TaskEscrow │ ${echoTaskEscrowCorrect ? '✅ 通过' : '❌ 失败'} │`);
    console.log(`│ Register → ECHO Token   │ ${registerEchoCorrect ? '✅ 通过' : '❌ 失败'} │`);
    console.log(`│ TaskEscrow → ECHO Token │ ${taskEscrowEchoCorrect ? '✅ 通过' : '❌ 失败'} │`);
    console.log(`│ TaskEscrow → Register   │ ${taskEscrowRegisterCorrect ? '✅ 通过' : '❌ 失败'} │`);
    console.log(`│ 系统状态                │ ${isCleanState ? '✅ 干净' : '⚠️ 非干净'} │`);
    console.log("└─────────────────────────┴────────┘");

    if (allCorrect) {
      console.log("\n🎉 系统验证完全通过！所有合约配置正确！");
      console.log("✅ 系统已准备好使用");
    } else {
      console.log("\n❌ 系统验证失败！请检查合约配置");
      throw new Error("合约配置验证失败");
    }

    return {
      addresses: NEW_ADDRESSES,
      verification: {
        echoRegisterCorrect,
        echoTaskEscrowCorrect,
        registerEchoCorrect,
        taskEscrowEchoCorrect,
        taskEscrowRegisterCorrect,
        allCorrect,
        isCleanState
      }
    };

  } catch (error) {
    console.error("❌ 验证过程中出错:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });