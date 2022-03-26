import { task, types } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('add-vote', 'Add vote to voting')
  .addParam(
    'voter',
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
  .addParam(
    'candidate',
    'The candidate identifier',
    false,
    types.int
  )
  .setAction(async ({ voter, voting, candidate }, hre) => {
    if (!process.env.CONTRACT_ADDRESS) {
      console.error('CONTRACT_ADDRESS is required!');
      return;
    }

    const artifact = await hre.artifacts.readArtifact('SmartVoting');
    const signer = await hre.ethers.getSigner(voter);
    const contract = new hre.ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      artifact.abi,
      signer
    );

    const result = await contract
      .connect(signer)
      .addVote(
        voting,
        candidate,
        {
          value: hre.ethers.utils.parseEther('0.01')
        }
      );

    console.log(result);
  });
