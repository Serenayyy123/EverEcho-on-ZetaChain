import { ethers } from 'ethers';

async function testSimpleDeployment() {
  console.log('🔍 Testing Simple Deployment...');
  
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  const signer = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', provider);
  
  console.log('📋 Signer address:', await signer.getAddress());
  console.log('📋 Signer balance:', ethers.formatEther(await provider.getBalance(signer.address)), 'ETH');
  
  // Deploy a simple contract
  const contractCode = `
    pragma solidity ^0.8.0;
    contract SimpleTest {
      uint256 public value = 42;
      function setValue(uint256 _value) public {
        value = _value;
      }
    }
  `;
  
  try {
    // Compile and deploy
    const factory = new ethers.ContractFactory(
      ['function value() view returns (uint256)', 'function setValue(uint256)'],
      '0x608060405234801561001057600080fd5b50602a60008190555060c8806100276000396000f3fe6080604052348015600f57600080fd5b506004361060325760003560e01c80633fa4f245146037578063552410771460535b600080fd5b60005460405190815260200160405180910390f35b606260043603810190605f9190606a565b6064565b005b60008190555050565b600080fd5b6000819050919050565b6082816071565b8114608c57600080fd5b50565b600081359050609e81607b565b92915050565b60008060208385031215609b5760ba565b600060a7858286016091565b9250506020830135915050925092905056fea2646970667358221220f7a8b0c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b264736f6c63430008110033',
      signer
    );
    
    console.log('📝 Deploying simple test contract...');
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log('✅ Contract deployed at:', address);
    
    // Test the contract
    const value = await contract.value();
    console.log('📋 Contract value:', value.toString());
    
    // Check block number after deployment
    const blockNumber = await provider.getBlockNumber();
    console.log('📋 Block number after deployment:', blockNumber);
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

testSimpleDeployment();