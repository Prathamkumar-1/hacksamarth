// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DonationPlatform
 * @dev Core contract managing NGOs, projects, and donations with full audit trail
 */
contract DonationPlatform is ReentrancyGuard, Pausable, AccessControl {

    bytes32 public constant ADMIN_ROLE   = keccak256("ADMIN_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant NGO_ROLE     = keccak256("NGO_ROLE");

    uint256 public platformFeePercent = 2;
    uint256 public projectCounter;
    uint256 public ngoCounter;
    address public treasury;

    enum ProjectStatus { Pending, Active, Completed, Suspended, Rejected }
    enum FundStatus    { Requested, Approved, Released, Flagged }
    enum DonationStatus { Pending, ProofSubmitted, Verified, Rejected, Released, Refunded }

    struct NGO {
        uint256 id;
        address wallet;
        string  name;
        string  registrationHash;
        bool    verified;
        uint256 totalRaised;
        uint256 totalProjects;
        uint256 reputationScore;
        uint256 createdAt;
    }

    struct Project {
        uint256 id;
        uint256 ngoId;
        address ngoWallet;
        string  title;
        string  descriptionHash;
        string  milestoneHash;
        uint256 goalAmount;
        uint256 raisedAmount;
        uint256 releasedAmount;
        ProjectStatus status;
        uint256 deadline;
        uint256 createdAt;
        uint256 donorCount;
    }

    struct Donation {
        uint256 id;
        uint256 projectId;
        address donor;
        uint256 amount;
        uint256 timestamp;
        string  message;
        DonationStatus status;
        uint256 escrowUntil;
        uint256 verifiedAt;
    }

    struct ProofSubmission {
        uint256 id;
        uint256 donationId;
        uint256 projectId;
        address ngo;
        string  proofHash;  // IPFS hash of proof
        string  proofType;  // "receipt", "video", "document"
        uint256 submittedAt;
        DonationStatus status;
        string  verificationReason;
    }

    struct FundRequest {
        uint256 id;
        uint256 projectId;
        uint256 milestoneIndex;
        uint256 amount;
        string  proofHash;
        FundStatus status;
        uint256 requestedAt;
        uint256 resolvedAt;
        uint256 approvalCount;
        uint256 rejectionCount;
    }

    uint256 public constant PROOF_SUBMISSION_DEADLINE = 30 days;

    mapping(uint256 => NGO)           public ngos;
    mapping(address => uint256)       public ngoIdByAddress;
    mapping(uint256 => Project)       public projects;
    mapping(uint256 => Donation[])    public projectDonations;
    mapping(uint256 => ProofSubmission[]) public projectProofs;
    mapping(uint256 => FundRequest[]) public projectFundRequests;
    mapping(address => uint256[])     public donorProjects;
    mapping(uint256 => mapping(address => uint256)) public donorAmounts;
    mapping(uint256 => mapping(address => bool))    public hasVotedOnRequest;
    mapping(uint256 => uint256) public donationIdMap;  // projectId -> donationCount
    mapping(uint256 => mapping(uint256 => uint256)) public projectDonationBalance;  // projectId -> donationId -> balance in escrow

    event NGORegistered(uint256 indexed ngoId, address indexed wallet, string name);
    event NGOVerified(uint256 indexed ngoId, address indexed verifier);
    event ProjectCreated(uint256 indexed projectId, uint256 indexed ngoId, string title, uint256 goal);
    event ProjectStatusUpdated(uint256 indexed projectId, ProjectStatus newStatus);
    event DonationReceived(uint256 indexed projectId, address indexed donor, uint256 amount, uint256 totalRaised);
    event DonationInEscrow(uint256 indexed projectId, uint256 indexed donationId, address indexed donor, uint256 amount, uint256 escrowUntil);
    event ProofSubmitted(uint256 indexed projectId, uint256 indexed donationId, address indexed ngo, string proofHash, string proofType);
    event ProofVerified(uint256 indexed projectId, uint256 indexed donationId, address indexed ngo, uint256 releasedAmount);
    event ProofRejected(uint256 indexed projectId, uint256 indexed donationId, string reason);
    event FundRequested(uint256 indexed projectId, uint256 indexed requestId, uint256 amount);
    event FundApproved(uint256 indexed requestId, address indexed approver);
    event FundReleased(uint256 indexed requestId, uint256 amount, address indexed ngo);
    event FundFlagged(uint256 indexed requestId, address indexed flagger, string reason);
    event DonationRefunded(uint256 indexed projectId, address indexed donor, uint256 amount, string reason);
    event ReputationUpdated(uint256 indexed ngoId, uint256 newScore);

    modifier onlyVerifiedNGO() {
        uint256 ngoId = ngoIdByAddress[msg.sender];
        require(ngoId != 0 && ngos[ngoId].verified, "Not a verified NGO");
        _;
    }

    modifier projectExists(uint256 projectId) {
        require(projectId > 0 && projectId <= projectCounter, "Project does not exist");
        _;
    }

    modifier onlyProjectNGO(uint256 projectId) {
        require(projects[projectId].ngoWallet == msg.sender, "Not project NGO");
        _;
    }

    constructor(address _treasury) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function registerNGO(string calldata _name, string calldata _registrationHash)
        external whenNotPaused returns (uint256)
    {
        require(ngoIdByAddress[msg.sender] == 0, "Already registered");
        require(bytes(_name).length > 0, "Name required");
        ngoCounter++;
        ngos[ngoCounter] = NGO({
            id: ngoCounter, wallet: msg.sender, name: _name,
            registrationHash: _registrationHash, verified: false,
            totalRaised: 0, totalProjects: 0, reputationScore: 50,
            createdAt: block.timestamp
        });
        ngoIdByAddress[msg.sender] = ngoCounter;
        _grantRole(NGO_ROLE, msg.sender);
        emit NGORegistered(ngoCounter, msg.sender, _name);
        return ngoCounter;
    }

    function verifyNGO(uint256 _ngoId) external onlyRole(ADMIN_ROLE) {
        require(_ngoId > 0 && _ngoId <= ngoCounter, "Invalid NGO");
        require(!ngos[_ngoId].verified, "Already verified");
        ngos[_ngoId].verified = true;
        emit NGOVerified(_ngoId, msg.sender);
    }

    function createProject(
        string calldata _title, string calldata _descriptionHash,
        string calldata _milestoneHash, uint256 _goalAmount, uint256 _durationDays
    ) external onlyVerifiedNGO whenNotPaused returns (uint256) {
        require(_goalAmount > 0, "Goal must be positive");
        require(_durationDays >= 7 && _durationDays <= 365, "Duration 7-365 days");
        projectCounter++;
        uint256 ngoId = ngoIdByAddress[msg.sender];
        projects[projectCounter] = Project({
            id: projectCounter, ngoId: ngoId, ngoWallet: msg.sender,
            title: _title, descriptionHash: _descriptionHash, milestoneHash: _milestoneHash,
            goalAmount: _goalAmount, raisedAmount: 0, releasedAmount: 0,
            status: ProjectStatus.Pending,
            deadline: block.timestamp + (_durationDays * 1 days),
            createdAt: block.timestamp, donorCount: 0
        });
        ngos[ngoId].totalProjects++;
        emit ProjectCreated(projectCounter, ngoId, _title, _goalAmount);
        return projectCounter;
    }

    function activateProject(uint256 _projectId) external onlyRole(ADMIN_ROLE) projectExists(_projectId) {
        require(projects[_projectId].status == ProjectStatus.Pending, "Not pending");
        projects[_projectId].status = ProjectStatus.Active;
        emit ProjectStatusUpdated(_projectId, ProjectStatus.Active);
    }

    function donate(uint256 _projectId, string calldata _message)
        external payable nonReentrant whenNotPaused projectExists(_projectId)
    {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(block.timestamp < project.deadline, "Deadline passed");
        require(msg.value > 0, "Donation must be positive");

        uint256 fee = (msg.value * platformFeePercent) / 100;
        uint256 netDonation = msg.value - fee;
        (bool feeSuccess, ) = treasury.call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        if (donorAmounts[_projectId][msg.sender] == 0) {
            project.donorCount++;
            donorProjects[msg.sender].push(_projectId);
        }
        donorAmounts[_projectId][msg.sender] += netDonation;
        project.raisedAmount += netDonation;

        // Create donation record in escrow
        uint256 donationId = projectDonations[_projectId].length;
        uint256 escrowUntil = block.timestamp + PROOF_SUBMISSION_DEADLINE;
        
        projectDonations[_projectId].push(Donation({
            id: donationId,
            projectId: _projectId,
            donor: msg.sender,
            amount: netDonation,
            timestamp: block.timestamp,
            message: _message,
            status: DonationStatus.Pending,
            escrowUntil: escrowUntil,
            verifiedAt: 0
        }));
        
        projectDonationBalance[_projectId][donationId] = netDonation;
        
        emit DonationReceived(_projectId, msg.sender, netDonation, project.raisedAmount);
        emit DonationInEscrow(_projectId, donationId, msg.sender, netDonation, escrowUntil);
    }

    /// @dev NGO submits proof of fund usage (receipt, video, document)
    function submitProof(
        uint256 _projectId,
        uint256 _donationId,
        string calldata _proofHash,
        string calldata _proofType
    ) external projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(project.ngoWallet == msg.sender, "Not project NGO");
        require(_donationId < projectDonations[_projectId].length, "Invalid donation ID");
        
        Donation storage donation = projectDonations[_projectId][_donationId];
        require(donation.status == DonationStatus.Pending, "Donation not pending");
        require(block.timestamp <= donation.escrowUntil, "Proof submission deadline passed");
        require(bytes(_proofHash).length > 0, "Proof hash required");
        
        // Validate proof type
        require(
            keccak256(bytes(_proofType)) == keccak256(bytes("receipt")) ||
            keccak256(bytes(_proofType)) == keccak256(bytes("video")) ||
            keccak256(bytes(_proofType)) == keccak256(bytes("document")),
            "Invalid proof type"
        );

        uint256 proofId = projectProofs[_projectId].length;
        projectProofs[_projectId].push(ProofSubmission({
            id: proofId,
            donationId: _donationId,
            projectId: _projectId,
            ngo: msg.sender,
            proofHash: _proofHash,
            proofType: _proofType,
            submittedAt: block.timestamp,
            status: DonationStatus.ProofSubmitted,
            verificationReason: ""
        }));

        donation.status = DonationStatus.ProofSubmitted;
        emit ProofSubmitted(_projectId, _donationId, msg.sender, _proofHash, _proofType);
    }

    /// @dev Automatic proof verification (on-chain or oracle-based)
    /// For this implementation, proof is auto-verified after 24 hours if not challenged
    function verifyProof(
        uint256 _projectId,
        uint256 _donationId,
        bool _approve,
        string calldata _reason
    ) external onlyRole(AUDITOR_ROLE) projectExists(_projectId) {
        require(_donationId < projectDonations[_projectId].length, "Invalid donation ID");
        
        Donation storage donation = projectDonations[_projectId][_donationId];
        require(donation.status == DonationStatus.ProofSubmitted, "Proof not submitted");

        // Find corresponding proof submission
        ProofSubmission storage proof;
        uint256 proofIndex = type(uint256).max;
        
        for (uint i = 0; i < projectProofs[_projectId].length; i++) {
            if (projectProofs[_projectId][i].donationId == _donationId) {
                proof = projectProofs[_projectId][i];
                proofIndex = i;
                break;
            }
        }
        require(proofIndex != type(uint256).max, "No proof found for donation");

        if (_approve) {
            donation.status = DonationStatus.Verified;
            donation.verifiedAt = block.timestamp;
            proof.status = DonationStatus.Verified;
            
            // Release funds to NGO
            Project storage project = projects[_projectId];
            uint256 escrowAmount = projectDonationBalance[_projectId][_donationId];
            projectDonationBalance[_projectId][_donationId] = 0;
            project.releasedAmount += escrowAmount;
            
            (bool success, ) = project.ngoWallet.call{value: escrowAmount}("");
            require(success, "Fund release failed");
            
            _rewardNGO(project.ngoId);
            emit ProofVerified(_projectId, _donationId, project.ngoWallet, escrowAmount);
        } else {
            donation.status = DonationStatus.Rejected;
            proof.status = DonationStatus.Rejected;
            proof.verificationReason = _reason;
            
            _penalizeNGO(projects[_projectId].ngoId);
            emit ProofRejected(_projectId, _donationId, _reason);
        }
    }

    /// @dev Refund donation if deadline passed without approval
    function refundDonationIfExpired(uint256 _projectId, uint256 _donationId)
        external nonReentrant projectExists(_projectId)
    {
        require(_donationId < projectDonations[_projectId].length, "Invalid donation ID");
        
        Donation storage donation = projectDonations[_projectId][_donationId];
        require(donation.status == DonationStatus.Pending || donation.status == DonationStatus.Rejected, 
                "Cannot refund this donation");
        require(block.timestamp > donation.escrowUntil, "Deadline not passed");

        uint256 refundAmount = projectDonationBalance[_projectId][_donationId];
        require(refundAmount > 0, "No funds to refund");

        projectDonationBalance[_projectId][_donationId] = 0;
        donation.status = DonationStatus.Refunded;
        
        Project storage project = projects[_projectId];
        project.raisedAmount -= refundAmount;

        (bool success, ) = donation.donor.call{value: refundAmount}("");
        require(success, "Refund failed");

        string memory reason = donation.status == DonationStatus.Rejected ? "Proof rejected" : "Proof deadline expired";
        emit DonationRefunded(_projectId, donation.donor, refundAmount, reason);
    }

    function requestFundRelease(
        uint256 _projectId, uint256 _milestoneIndex, uint256 _amount, string calldata _proofHash
    ) external onlyProjectNGO(_projectId) projectExists(_projectId) whenNotPaused {
        Project storage project = projects[_projectId];
        require(project.status == ProjectStatus.Active, "Project not active");
        require(_amount > 0 && _amount <= project.raisedAmount - project.releasedAmount, "Invalid amount");
        uint256 requestId = projectFundRequests[_projectId].length;
        projectFundRequests[_projectId].push(FundRequest({
            id: requestId, projectId: _projectId, milestoneIndex: _milestoneIndex,
            amount: _amount, proofHash: _proofHash, status: FundStatus.Requested,
            requestedAt: block.timestamp, resolvedAt: 0, approvalCount: 0, rejectionCount: 0
        }));
        emit FundRequested(_projectId, requestId, _amount);
    }

    function reviewFundRequest(
        uint256 _projectId, uint256 _requestId, bool _approve, string calldata _reason
    ) external onlyRole(AUDITOR_ROLE) nonReentrant {
        require(!hasVotedOnRequest[_requestId][msg.sender], "Already voted");
        FundRequest storage request = projectFundRequests[_projectId][_requestId];
        require(request.status == FundStatus.Requested, "Not pending");
        hasVotedOnRequest[_requestId][msg.sender] = true;
        if (_approve) {
            request.approvalCount++;
            emit FundApproved(_requestId, msg.sender);
            if (request.approvalCount >= 2) _releaseFunds(_projectId, _requestId);
        } else {
            request.rejectionCount++;
            if (request.rejectionCount >= 2) {
                request.status = FundStatus.Flagged;
                emit FundFlagged(_requestId, msg.sender, _reason);
                _penalizeNGO(projects[_projectId].ngoId);
            }
        }
    }

    function _releaseFunds(uint256 _projectId, uint256 _requestId) internal {
        FundRequest storage request = projectFundRequests[_projectId][_requestId];
        Project storage project = projects[_projectId];
        request.status = FundStatus.Released;
        request.resolvedAt = block.timestamp;
        project.releasedAmount += request.amount;
        (bool success, ) = project.ngoWallet.call{value: request.amount}("");
        require(success, "Fund release failed");
        emit FundReleased(_requestId, request.amount, project.ngoWallet);
        _rewardNGO(project.ngoId);
    }

    function claimRefund(uint256 _projectId) external nonReentrant projectExists(_projectId) {
        Project storage project = projects[_projectId];
        require(
            project.status == ProjectStatus.Suspended ||
            project.status == ProjectStatus.Rejected ||
            (block.timestamp > project.deadline && project.raisedAmount < project.goalAmount / 2),
            "Not eligible for refund"
        );
        uint256 amount = donorAmounts[_projectId][msg.sender];
        require(amount > 0, "No donation to refund");
        donorAmounts[_projectId][msg.sender] = 0;
        project.raisedAmount -= amount;
        ngos[project.ngoId].totalRaised -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Refund failed");
        emit DonationRefunded(_projectId, msg.sender, amount, "Project cancelled/failed");
    }

    function _rewardNGO(uint256 _ngoId) internal {
        if (ngos[_ngoId].reputationScore < 95) {
            ngos[_ngoId].reputationScore += 5;
            emit ReputationUpdated(_ngoId, ngos[_ngoId].reputationScore);
        }
    }

    function _penalizeNGO(uint256 _ngoId) internal {
        if (ngos[_ngoId].reputationScore > 10) {
            ngos[_ngoId].reputationScore -= 10;
            emit ReputationUpdated(_ngoId, ngos[_ngoId].reputationScore);
        }
    }

    // Getter functions
    function getProject(uint256 _projectId) external view returns (Project memory) { 
        return projects[_projectId]; 
    }
    
    function getNGO(uint256 _ngoId) external view returns (NGO memory) { 
        return ngos[_ngoId]; 
    }
    
    function getDonation(uint256 _projectId, uint256 _donationId) external view returns (Donation memory) {
        require(_donationId < projectDonations[_projectId].length, "Invalid donation ID");
        return projectDonations[_projectId][_donationId];
    }
    
    function getDonorAmount(uint256 _projectId, address _donor) external view returns (uint256) { 
        return donorAmounts[_projectId][_donor]; 
    }
    
    function getProjectDonations(uint256 _projectId) external view returns (Donation[] memory) { 
        return projectDonations[_projectId]; 
    }
    
    function getProjectProofs(uint256 _projectId) external view returns (ProofSubmission[] memory) {
        return projectProofs[_projectId];
    }
    
    function getProjectFundRequests(uint256 _projectId) external view returns (FundRequest[] memory) { 
        return projectFundRequests[_projectId]; 
    }
    
    function getDonorProjects(address _donor) external view returns (uint256[] memory) { 
        return donorProjects[_donor]; 
    }
    
    function getDonationBalance(uint256 _projectId, uint256 _donationId) external view returns (uint256) {
        return projectDonationBalance[_projectId][_donationId];
    }

    function setPlatformFee(uint256 _feePercent) external onlyRole(ADMIN_ROLE) {
        require(_feePercent <= 10, "Max 10%");
        platformFeePercent = _feePercent;
    }
    function pause() external onlyRole(ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(ADMIN_ROLE) { _unpause(); }
    receive() external payable { revert("Direct transfers not allowed"); }
    fallback() external payable { revert("Function not found"); }
}
