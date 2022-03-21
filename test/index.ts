import { ethers } from 'hardhat';
import { expect } from 'chai';

import { SmartVoting } from '../typechain';

describe('SmartVoting', function() {
  let contract: SmartVoting;

  beforeEach(async function() {
    const SmartVoting = await ethers.getContractFactory('SmartVoting');
    contract = await SmartVoting.deploy();
    await contract.deployed();
  });

  it('Should add new voting from the owner', async function() {
    const [owner] = await ethers.getSigners();
    const result = await contract.connect(owner).addVoting('test 1');
    expect(result.from).equal(owner.address);
  });

  it('Should not add new voting from a non-owner', async function() {
    const [_, nonOwner] = await ethers.getSigners();
    await expect(contract.connect(nonOwner)
      .addVoting('test 2'))
      .to
      .be
      .revertedWith(`VM Exception while processing transaction: reverted with custom error 'onlyOwnerErr()'`);
  });

  it('Should returns votings', async function() {
    await contract.addVoting('test 1');
    await contract.addVoting('test 2');
    await contract.addVoting('test 3');
    const result = await contract.getVotings();
    expect(result.length).equal(3);
    expect(result[0].title).equal('test 1');
    expect(result[2].id.toNumber()).equal(2);
  });
});
