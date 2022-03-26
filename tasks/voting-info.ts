import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('voting-info', 'Information about voting')
  .addParam(
    'voting',
    'The voting identifier',
    '',
    types.int
  )
  .setAction(async ({ voting }, hre) => {
    if (!process.env.CONTRACT_ADDRESS) {
      console.error('CONTRACT_ADDRESS is required!');
      return;
    }

    const artifact = await hre.artifacts.readArtifact('SmartVoting');
    const [signer] = await hre.ethers.getSigners();
    const contract = new hre.ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      artifact.abi,
      signer
    );

    const result = await contract.getVoting(voting);

    console.log(result);
  });
