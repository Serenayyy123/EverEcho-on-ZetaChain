// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEOCHOToken {
    function mintInitial(address to) external;
    function balanceOf(address account) external view returns (uint256);
}

/**
 * @title Register
 * @notice EverEcho 用户注册合约，管理注册状态与 profileURI
 * @dev 冻结点 1.1-5：register() 是唯一注册入口，前端不得绕过
 */
contract Register {
    // ============ 状态变量 ============
    /// @notice EOCHOToken 合约实例
    IEOCHOToken public immutable echoToken;

    /// @notice 用户注册状态（冻结点 1.1-4：注册状态只由 Register 维护）
    mapping(address => bool) public isRegistered;

    /// @notice 用户 profileURI（冻结点 3.1：命名必须完全一致）
    mapping(address => string) public profileURI;

    // ============ 事件（冻结点 3.3：命名必须完全一致）============
    /// @notice 用户注册成功事件
    /// @param user 注册用户地址
    /// @param profileURI 用户资料 URI
    /// @param mintedAmount 实际 mint 的 EOCHO 数量（CAP 满时可能为 0）
    event UserRegistered(address indexed user, string profileURI, uint256 mintedAmount);

    // ============ 错误 ============
    error AlreadyRegistered();
    error EmptyProfileURI();

    // ============ 构造函数 ============
    /**
     * @notice 初始化 Register 合约
     * @param _echoToken EOCHOToken 合约地址
     * @dev 冻结点 1.1-1：Register 为独立合约，通过构造函数注入依赖
     */
    constructor(address _echoToken) {
        require(_echoToken != address(0), "Invalid token address");
        echoToken = IEOCHOToken(_echoToken);
    }

    // ============ 核心函数 ============
    /**
     * @notice 用户注册函数（冻结点 1.1-5：唯一注册入口）
     * @param _profileURI 用户资料 URI（IPFS/Arweave 等）
     * @dev 冻结点 1.2-8：CAP 满时 register 仍成功，mintedAmount 可能为 0
     * @dev 冻结点 1.2-11：CapReached 事件仅 EOCHOToken 触发，Register 不重复触发
     */
    function register(string calldata _profileURI) external {
        // 防重复注册检查
        if (isRegistered[msg.sender]) revert AlreadyRegistered();
        
        // profileURI 非空检查
        if (bytes(_profileURI).length == 0) revert EmptyProfileURI();
        
        // 记录用户余额变化前的状态（用于计算 mintedAmount）
        uint256 balanceBefore = echoToken.balanceOf(msg.sender);
        
        // 调用 EOCHOToken.mintInitial（冻结点 1.1-2：仅 Register 可调用）
        // 冻结点 1.2-7：INITIAL_MINT = 100e18 由 EOCHOToken 内部实现
        echoToken.mintInitial(msg.sender);
        
        // 计算实际 mint 数量（通过余额差额）
        // 注意：mintInitial 内部已处理 CAP 满的情况，mintedAmount 可能为 0
        uint256 balanceAfter = echoToken.balanceOf(msg.sender);
        uint256 mintedAmount = balanceAfter - balanceBefore;
        
        // 更新注册状态
        isRegistered[msg.sender] = true;
        profileURI[msg.sender] = _profileURI;
        
        // 触发注册事件（冻结点 3.3：事件命名必须完全一致）
        emit UserRegistered(msg.sender, _profileURI, mintedAmount);
    }
}
