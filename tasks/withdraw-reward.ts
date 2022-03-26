import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('withdraw-reward', 'Withdraw reward from finished voting')
  .addParam(
    'winner',
    'The account\'s address',
    '',
    types.string
  )
  .addParam(
    'voting',
    'The voting identifier',
    '',
    types.int
  )
  .setAction(async ({ winner, voting }, hre) => {
    if (!process.env.CONTRACT_ADDRESS) {
      console.error('CONTRACT_ADDRESS is required!');
      return;
    }

    const artifact = await hre.artifacts.readArtifact('SmartVoting');
    const signer = await hre.ethers.getSigner(winner);
    const contract = new hre.ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      artifact.abi,
      signer
    );

    const result = await contract.withdrawReward(voting);

    console.log(result);
  });
