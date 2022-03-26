import { task } from 'hardhat/config';
import '@nomiclabs/hardhat-waffle';

export default task('voting-list', 'Show all votings')
  .setAction(async (_, hre) => {
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

    const result = await contract.getVotings();

    console.log(result);
  });
