import { ethers } from "hardhat";

async function main() {
  console.log("🔍 检查ECHO Token合约的所有权和权限...");

  const [deployer] = await ethers.getSigners();
  console.log("当前账户:", deployer.address);

  const ECHO_TOKEN_ADDRESS = "0x650AAE045552567df9eb0633afd77D44308D3e6D";
  const echoToken = await ethers.getContractAt("EOCHOToken", ECHO_TOKEN_ADDRESS);

  try {
    // 检查owner
    const owner = await echoToken.owner();
    console.log("ECHO Token owner:", owner);
    console.log("当前账户是owner:", owner.toLowerCase() === deployer.address.toLowerCase());

    // 检查当前的TaskEscrow地址
    const currentTaskEscrow = await echoToken.taskEscrowAddress();
    console.log("当前TaskEscrow地址:", currentTaskEscrow);

    // 尝试调用setTaskEscrowAddress看看具体错误
    const newTaskEscrowAddress = "0x9D4180d4D97f4Db37d1f7c460f8cEfF0bf6bD03f";
    console.log("尝试设置新TaskEscrow地址:", newTaskEscrowAddress);

    // 先估算gas
    try {
      const gasEstimate = await echoToken.setTaskEscrowAddress.estimateGas(newTaskEscrowAddress);
      console.log("Gas估算成功:", gasEstimate.toString());
    } catch (error) {
      console.error("Gas估算失败:", error);
    }

  } catch (error) {
    console.error("检查失败:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });