import { ethers } from 'hardhat';
import { expect } from 'chai';

import { SmartVoting } from '../typechain';
import * as timers from 'timers';

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
    it('should returns votings with candidates', async function() {
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

    it('should return error if vote already counted', async function() {
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

    describe('finishVoting method', function() {
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
  });
});
