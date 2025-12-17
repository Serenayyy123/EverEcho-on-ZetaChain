import { ethers } from 'ethers';

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend Connection...');
  
  try {
    // Test RPC connection
    const provider = new ethers.JsonRpcProvider('http://localhost:8545');
    const network = await provider.getNetwork();
    console.log('✅ RPC Connection successful');
    console.log('📋 Network:', network.chainId.toString());
    
    // Test backend connection
    const backendResponse = await fetch('http://localhost:3001/healthz');
    if (backendResponse.ok) {
      const healthData = await backendResponse.json() as any;
      console.log('✅ Backend Connection successful');
      console.log('📋 Backend Status:', healthData.status);
    } else {
      console.log('❌ Backend Connection failed:', backendResponse.status);
    }
    
    // Test frontend
    const frontendResponse = await fetch('http://localhost:5173');
    if (frontendResponse.ok) {
      console.log('✅ Frontend accessible');
    } else {
      console.log('❌ Frontend not accessible:', frontendResponse.status);
    }
    
    console.log('🎉 All connections tested!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testFrontendConnection();