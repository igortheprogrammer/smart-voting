import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('add-voting', 'Add new voting')
  .addParam(
    'duration',
    'The voting duration in seconds',
    '',
    types.int
  )
  .addParam(
    'title',
    'The voting title',
    '',
    types.string
  )
  .addParam(
    'candidates',
    'Comma separated list of addresses',
    '',
    types.string
  )
  .setAction(async ({ duration, title, candidates }, hre) => {
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

    const result = await contract.addVoting(
      duration,
      title.trim(),
      candidates.split(',')
    );

    console.log(result);
  });
