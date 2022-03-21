//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract SmartVoting {
    struct Voting {
        uint256 id;
        string title;
        uint256 endTime;
        bool finished;
    }

    event VotingAdded(uint256 id, string title, uint256 endTime);

    address private owner;

    uint256 private currentId;

    mapping(uint256 => Voting) private votings;

    /// Only the owner can call this function.
    error onlyOwnerErr();

    modifier onlyOwner() {
        if (msg.sender != owner) revert onlyOwnerErr();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addVoting(string memory title) external onlyOwner {
        uint256 endTime = block.timestamp + 3 days;
        votings[currentId] = Voting({
            id: currentId,
            title: title,
            endTime: endTime,
            finished: false
        });

        emit VotingAdded(currentId, title, endTime);

        currentId++;
    }

    function getVotings() public view returns (Voting[] memory) {
        Voting[] memory res = new Voting[](currentId);
        for (uint i = 0; i < currentId; i++) {
            res[i] = votings[i];
        }
        return res;
    }
}
