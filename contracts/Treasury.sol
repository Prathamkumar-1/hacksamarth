// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title Treasury
 * @dev Holds platform fees; owner can withdraw for operational costs
 */
contract Treasury is Ownable, ReentrancyGuard {
    event FundsReceived(address indexed from, uint256 amount);
    event FundsWithdrawn(address indexed to, uint256 amount);

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function withdraw(address payable _to, uint256 _amount) external onlyOwner nonReentrant {
        require(_to != address(0), "Invalid address");
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdrawal failed");
        emit FundsWithdrawn(_to, _amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
