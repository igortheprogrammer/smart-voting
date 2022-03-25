import { ethers } from 'hardhat';

async function main() {
  const SmartVoting = await ethers.getContractFactory('SmartVoting');
  const smartVoting = await SmartVoting.deploy();

  await smartVoting.deployed();

  console.log('SmartVoting deployed to:', smartVoting.address);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
