import { ethers } from 'hardhat';
import { expect } from 'chai';
import { BigNumber } from 'ethers';

import { SmartVoting } from '../typechain';

describe('SmartVoting', function() {
  let contract: SmartVoting;

  beforeEach(async function() {
    const SmartVoting = await ethers.getContractFactory('SmartVoting');
    contract = await SmartVoting.deploy();
    await contract.deployed();
  });

  describe('addVoting method', function() {
    it('should add new voting from the owner', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      const result = await contract
        .connect(owner)
        .addVoting(
          60,
          'test 1',
          [owner.address, addr1.address, addr2.address]
        );
      expect(result.from).equal(owner.address);
    });

    it('should not add new voting from a non-owner', async function() {
      const [_, nonOwner] = await ethers.getSigners();
      await expect(contract.connect(nonOwner)
        .addVoting(
          60,
          'test 2',
          [nonOwner.address]
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'NotOwner()'`);
    });

    it('should not add new voting without title', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await expect(contract
        .addVoting(
          60,
          '',
          [owner.address, addr1.address, addr2.address]
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Voting title is required.'`);
    });

    it('should not add new voting without candidates', async function() {
      await expect(contract
        .addVoting(
          60,
          'test 4',
          []
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Candidates are required.'`);
    });
  });

  describe('getVotings method', function() {
    it('should return votings with candidates', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract.addVoting(60, 'test 1', [addr1.address]);
      await contract.addVoting(60, 'test 2', [addr2.address]);
      await contract.addVoting(60, 'test 3', [owner.address]);
      const result = await contract.getVotings();
      expect(result.length).equal(3);
      expect(result[0].title).equal('test 1');
      expect(result[2].id.toNumber()).equal(2);
      expect(result[1].candidates[0]).equal(addr2.address);
    });
  });

  describe('getVoting method', function() {
    it('should return voting', async function() {
      const [_, addr1] = await ethers.getSigners();
      await contract
        .addVoting(60, 'test 1', [addr1.address]);
      const result = await contract.getVoting(0);
      expect(result.title).equal('test 1');
    });

    it('should return error if voting does not exist', async function() {
      await expect(contract.getVoting(1))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'VotingDoesNotExist()'`);
    });
  });

  describe('addVote method', function() {
    it('should add vote to voting', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(60, 'test 1', [owner.address, addr1.address]);

      await contract
        .connect(addr2)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      const result = await contract.getVotings();
      expect(result[0].votes[0].voter).equal(addr2.address);
      expect(result[0].rewardSum).equal(ethers.utils.parseEther('0.01'));
    });

    it('should return error if voting does not exist', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await expect(contract
        .connect(addr2)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'VotingDoesNotExist()'`);
    });

    it('should return error if candidate does not exist', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(60, 'test 1', [owner.address, addr1.address]);

      await expect(contract
        .connect(addr2)
        .addVote(
          0,
          addr2.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'CandidateDoesNotExist()'`);
    });

    it('should return error if bid is incorrect', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(60, 'test 1', [owner.address, addr1.address]);

      await expect(contract
        .connect(addr2)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.001')
          }
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'IncorrectBid()'`);
    });

    it('should return error if vote is already counted', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(60, 'test 1', [owner.address, addr1.address]);

      await contract
        .connect(addr2)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      await expect(contract
        .connect(addr2)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        ))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'VoteAlreadyCounted()'`);
    });
  });

  describe('finishVoting method', function() {
    it('should finish the voting with the correct winner', async function() {
      const [owner, addr1, addr2, addr4] = await ethers.getSigners();
      await contract
        .addVoting(
          1,
          'test 1',
          [owner.address, addr1.address, addr2.address]
        );
      await contract
        .addVoting(
          60,
          'test 2',
          [addr1.address, addr2.address]
        );

      await contract
        .connect(owner)
        .addVote(
          0,
          owner.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr2)
        .addVote(
          0,
          addr2.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr4)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          contract.finishVoting(0)
            .then(() => contract.getVotings())
            .then((result) => {
              expect(result[0].finished).to.equal(true);
              expect(result[0].winner).to.equal(addr1.address);
              resolve();
            })
            .catch((e) => reject(e));
        }, 1000);
      });
    });

    it('should finish the voting with the random winner', async function() {
      const signers = await ethers.getSigners();
      const [owner, addr1, addr2, addr4, addr5] = signers;
      await contract
        .addVoting(
          1,
          'test 1',
          [owner.address, addr1.address, addr2.address]
        );

      await contract
        .connect(owner)
        .addVote(
          0,
          owner.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr5)
        .addVote(
          0,
          owner.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr2)
        .addVote(
          0,
          addr2.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr4)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          contract.finishVoting(0)
            .then(() => contract.getVotings())
            .then((result) => {
              expect(result[0].finished).to.equal(true);
              expect(signers
                .find(({ address }) => address === result[0].winner))
                .not
                .to
                .be
                .undefined;
              resolve();
            })
            .catch((e) => reject(e));
        }, 1000);
      });
    });

    it('should return error if it is too early', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(
          60,
          'test 1',
          [addr1.address, addr2.address]
        );

      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr2)
        .addVote(
          0,
          addr2.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      await expect(contract
        .finishVoting(0))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Voting hasn't ended yet.'`);
    });

    it('should return error if the voting is already finished', async function() {
      const [owner, addr1, addr2] = await ethers.getSigners();
      await contract
        .addVoting(
          1,
          'test 1',
          [addr1.address, addr2.address]
        );

      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr2)
        .addVote(
          0,
          addr2.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          try {
            await contract.finishVoting(0);
            await expect(contract.finishVoting(0))
              .to
              .be
              .revertedWith(`VM Exception while processing transaction: reverted with custom error 'VoteAlreadyFinished()'`);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    });
  });

  describe('withdrawReward method', function() {
    it('should withdraw reward', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      let currentBalance = await addr1.getBalance();
      let gasUsed: BigNumber;
      return new Promise((resolve, reject) => {
        setTimeout(function() {
          contract.finishVoting(0)
            .then(() => contract.connect(addr1).withdrawReward(0))
            .then((tx) => tx.wait())
            .then((receipt) => {
              gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            })
            .then(() => addr1.getBalance())
            .then((newBalance) => {
              const expectedBalance = ethers.utils
                .parseEther('0.018').add(currentBalance).sub(gasUsed);
              expect(newBalance).to.equal(expectedBalance);
              resolve();
            })
            .catch((e) => reject(e));
        }, 1000);
      });
    });

    it('should return error if voting does not exist', async function() {
      await expect(contract.withdrawReward(1))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'VotingDoesNotExist()'`);
    });

    it('should return error if voting hasn\'t ended', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      await expect(contract.withdrawReward(0))
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Voting hasn't ended yet.'`);
    });

    it('should return error if reward is already paid', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          try {
            await contract.finishVoting(0);
            await contract.connect(addr1).withdrawReward(0);

            await expect(contract.connect(addr1).withdrawReward(0))
              .to
              .be
              .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Reward is already paid.'`);

            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    });

    it('should return error if sender is not winner', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          try {
            await contract.finishVoting(0);
            await expect(contract.connect(owner).withdrawReward(0))
              .to
              .be
              .revertedWith(`VM Exception while processing transaction: reverted with reason string 'Only the winner can withdraw reward.'`);

            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    });
  });

  describe('getCommission method', function() {
    it('should return available commission', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );


      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          try {
            await contract.finishVoting(0);
            await contract.connect(addr1).withdrawReward(0);
            const expectedCommission = ethers.utils
              .parseEther('0.002');
            const commission = await contract.getCommission();
            expect(commission).equal(expectedCommission);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    });

    it('should return error if not owner', async function() {
      const [_, addr1] = await ethers.getSigners();
      await expect(contract.connect(addr1).getCommission())
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'NotOwner()'`);
    });
  });

  describe('withdrawCommission method', function() {
    it('should withdraw commission', async function() {
      const [owner, addr1] = await ethers.getSigners();
      await contract
        .addVoting(1, 'test 1', [addr1.address]);
      await contract
        .connect(owner)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );
      await contract
        .connect(addr1)
        .addVote(
          0,
          addr1.address,
          {
            value: ethers.utils.parseEther('0.01')
          }
        );

      let currentBalance = await owner.getBalance();
      return new Promise((resolve, reject) => {
        setTimeout(async function() {
          try {
            await contract.connect(addr1).finishVoting(0);
            await contract.connect(addr1).withdrawReward(0);
            const tx = await contract.withdrawCommission();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);
            const expectedBalance = ethers.utils
              .parseEther('0.002').add(currentBalance).sub(gasUsed);
            const newBalance = await owner.getBalance();
            expect(newBalance).to.equal(expectedBalance);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 1000);
      });
    });

    it('should return error if not owner', async function() {
      const [_, addr1] = await ethers.getSigners();
      await expect(contract.connect(addr1).withdrawCommission())
        .to
        .be
        .revertedWith(`VM Exception while processing transaction: reverted with custom error 'NotOwner()'`);
    });
  });
});
