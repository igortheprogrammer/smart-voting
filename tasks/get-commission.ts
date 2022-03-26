import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('get-commission', 'Information about available commission')
  .setAction(async (_, hre) => {
    if (!process.env.CONTRACT_ADDRESS) {
      console.error('CONTRACT_ADDRESS is required!');
      return;
    }

    const artifact = await hre.artifacts.readArtifact('SmartVoting');
    const [owner] = await hre.ethers.getSigners();
    const contract = new hre.ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      artifact.abi,
      owner
    );

    const result = await contract.getCommission();

    console.log(result);
  });
