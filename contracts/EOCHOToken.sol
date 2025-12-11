// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EOCHOToken
 * @notice EverEcho 生态系统内部 Token，支持 CAP 上限、首次注册 mint、手续费 burn
 * @dev 继承 OpenZeppelin ERC20，不重复声明标准变量
 */
contract EOCHOToken is ERC20, Ownable {
    // ============ 常量（与 PRD 1.4 完全一致）============
    uint256 public constant INITIAL_MINT = 100 * 10**18;
    uint256 public constant CAP = 10_000_000 * 10**18;
    uint256 public constant FEE_BPS = 200; // 2%

    // ============ 状态变量 ============
    /// @notice 是否已首次 mint（防重复）
    mapping(address => bool) public hasMintedInitial;

    /// @notice Register 合约地址（仅该地址可调用 mintInitial）
    address public registerAddress;

    /// @notice TaskEscrow 合约地址（仅该地址可调用 burn）
    address public taskEscrowAddress;

    // ============ 事件（与薄片 3.3 完全一致）============
    event InitialMinted(address indexed to, uint256 amount);
    event CapReached(address indexed attemptedBy);
    event Burned(uint256 amount);

    // ============ 错误 ============
    error OnlyRegister();
    error OnlyTaskEscrow();
    error AlreadyMinted();
    error AddressAlreadySet();
    error ZeroAddress();

    // ============ 构造函数 ============
    constructor() ERC20("ECHO Token", "ECHO") Ownable(msg.sender) {
        // 初始化时不设置 registerAddress 和 taskEscrowAddress
        // 需要部署后通过 setter 设置
    }

    // ============ 一次性 Setter（仅 Owner 可调用）============
    /**
     * @notice 设置 Register 合约地址（仅一次）
     * @param _registerAddress Register 合约地址
     */
    function setRegisterAddress(address _registerAddress) external onlyOwner {
        if (registerAddress != address(0)) revert AddressAlreadySet();
        if (_registerAddress == address(0)) revert ZeroAddress();
        registerAddress = _registerAddress;
    }

    /**
     * @notice 设置 TaskEscrow 合约地址（仅一次）
     * @param _taskEscrowAddress TaskEscrow 合约地址
     */
    function setTaskEscrowAddress(address _taskEscrowAddress) external onlyOwner {
        if (taskEscrowAddress != address(0)) revert AddressAlreadySet();
        if (_taskEscrowAddress == address(0)) revert ZeroAddress();
        taskEscrowAddress = _taskEscrowAddress;
    }

    // ============ 核心函数 ============
    /**
     * @notice 首次注册时 mint EOCHO（仅 Register 合约可调用）
     * @param to 接收地址
     * @dev 冻结点 #2: 仅 registerAddress 可调用
     * @dev 冻结点 #8: CAP 已满时 mint 0 但不 revert，触发 CapReached 事件
     */
    function mintInitial(address to) external {
        // 权限检查
        if (msg.sender != registerAddress) revert OnlyRegister();
        
        // 防重复检查
        if (hasMintedInitial[to]) revert AlreadyMinted();
        
        // 标记已 mint
        hasMintedInitial[to] = true;
        
        // 计算 mint 数量
        uint256 mintAmount;
        if (totalSupply() < CAP) {
            // 未达到 CAP，mint INITIAL_MINT
            uint256 remaining = CAP - totalSupply();
            mintAmount = remaining >= INITIAL_MINT ? INITIAL_MINT : remaining;
            _mint(to, mintAmount);
        } else {
            // 已达到 CAP，mint 0
            mintAmount = 0;
            emit CapReached(to);
        }
        
        // 触发事件（mintAmount 可能为 0）
        emit InitialMinted(to, mintAmount);
    }

    /**
     * @notice 销毁 Token（用于手续费销毁，仅 TaskEscrow 合约可调用）
     * @param amount 销毁数量
     * @dev 冻结点 #3: 仅 taskEscrowAddress 可调用
     * @dev 冻结点 1.2-12（修订版）: 从 TaskEscrow 合约托管余额销毁 _burn(msg.sender, amount)
     * @dev 资金托管模型：TaskEscrow 持有手续费，直接调用 burn 从自身余额销毁
     */
    function burn(uint256 amount) external {
        // 权限检查
        if (msg.sender != taskEscrowAddress) revert OnlyTaskEscrow();
        
        // 从 TaskEscrow 合约托管余额销毁（冻结点 1.2-12 修订版）
        // msg.sender 恒为 TaskEscrow，直接从其余额销毁
        _burn(msg.sender, amount);
        
        emit Burned(amount);
    }

    /**
     * @notice 查询地址是否已首次 mint
     * @param account 查询地址
     * @return 是否已 mint
     */
    function hasReceivedInitialMint(address account) external view returns (bool) {
        return hasMintedInitial[account];
    }
}
