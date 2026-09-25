// ==========================================
// 👛 Zelo Sport Wallet - Solana & TON Web3 Integration 💎
// ==========================================

const COINS_PER_ZELO_TOKEN = 100; // Conversion rate: 100 coins = 1 ZELOFC Token
const BACKEND_URL = "https://zelo-fc.onrender.com"; // Your Render backend URL
const TOKEN_NAME = "ZELOFC"; // Token symbol

// Ensure Solana and TON Web3 SDKs are accessible
function ensureWeb3LibrariesLoaded() {
    if (!window.solanaWeb3 && typeof solanaWeb3 === 'undefined') {
        const scriptSol = document.createElement('script');
        scriptSol.src = 'https://unpkg.com/@solana/web3.js@latest/lib/index.iife.min.js';
        document.head.appendChild(scriptSol);
    }
    
    if (typeof TON_CONNECT_UI === 'undefined') {
        const scriptTon = document.createElement('script');
        scriptTon.src = 'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js';
        document.head.appendChild(scriptTon);
    }
}
ensureWeb3LibrariesLoaded();

function renderWalletPage(container) {
    // Sync strictly with userState.points (or fallback to userState.coins / localStorage)
    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points)
        : ((typeof userState !== 'undefined' && userState.coins !== undefined)
            ? Number(userState.coins)
            : Number(localStorage.getItem('user_coins') || 0));
    
    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const tonWallet = (typeof userState !== 'undefined' && userState.walletAddress)
        ? userState.walletAddress
        : (localStorage.getItem('ton_wallet') || '');

    const isTonConnected = (typeof userState !== 'undefined' && userState.walletConnected) || Boolean(tonWallet);

    // Sync global state
    if (typeof userState !== 'undefined') {
        userState.points = userCoins;
        userState.coins = userCoins;
        userState.solanaWallet = solanaWallet;
        userState.walletAddress = tonWallet;
        userState.walletConnected = isTonConnected;
    }

    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.8), rgba(18, 18, 22, 0.9));
                backdrop-filter: blur(15px);
                -webkit-backdrop-filter: blur(15px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 18px;
                padding: 16px;
                text-align: center;
                box-shadow: 0 8px 25px rgba(0,0,0,0.4);
                margin-bottom: 14px;
            }
            .wallet-header-flex {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .wallet-logo-title {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .wallet-logo-sm {
                width: 30px; height: 30px;
                border-radius: 50%;
                background: rgba(255,255,255,0.05);
                display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .address-box-sm {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 8px 12px;
                border-radius: 10px;
                font-family: monospace;
                font-size: 0.82rem;
                margin-bottom: 10px;
                word-break: break-all;
            }
            .btn-glass-ton {
                background: linear-gradient(135deg, #0088cc, #005580);
                color: white; border: none; border-radius: 10px;
                padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 10px;
                padding: 12px 14px; font-weight: bold; font-size: 0.95rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(171, 159, 242, 0.3);
            }
            .btn-action-sm {
                background: rgba(255, 255, 255, 0.05); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px;
                padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-danger-sm {
                background: rgba(253, 29, 29, 0.12); color: #ff4d4d;
                border: 1px solid rgba(253, 29, 29, 0.3); border-radius: 8px;
                padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8);
                color: #000; border: none; border-radius: 12px;
                padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3);
                transition: transform 0.2s;
            }
            .btn-claim-main:active {
                transform: scale(0.98);
            }
        </style>
    `;

    container.innerHTML = `
        ${walletStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #0088cc;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:18px;height:18px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        TON Wallet
                    </span>
                </div>
                ${isTonConnected ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">● Connected</span>` : ''}
            </div>

            ${isTonConnected ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWallet.slice(0, 8)}...${tonWallet.slice(-8)}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWallet}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="triggerDisconnect()">🔌 Disconnect</button>
                </div>
            ` : `
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> Connect TON Wallet
                </button>
            `}
        </div>

        <!-- 2. REAL SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #AB9FF2;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width:18px;height:18px;" alt="Solana">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        Solana Wallet (Phantom)
                    </span>
                </div>
                ${solanaWallet ? `<span style="color:#14F195; font-size:0.75rem; font-weight:bold;">● Verified Real Connection</span>` : ''}
            </div>

            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">On-Chain SOL:</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">⏳ Checking...</span>
                </div>

                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">🔌 Disconnect</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    🟣 Connect Solana Wallet (Real Web3)
                </button>
            `}
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">
                        ${TOKEN_NAME} Balance
                    </span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">Total Earned:</span>
                <span style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ⚡ Claim ${TOKEN_NAME} Tokens
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// ==========================================
// 💎 TON Connect Handler Integration
// ==========================================
let tonConnectUI = null;

function initTonConnectInstance() {
    if (typeof TON_CONNECT_UI !== 'undefined' && !tonConnectUI) {
        try {
            tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: `${BACKEND_URL}/tonconnect-manifest.json`
            });

            tonConnectUI.onStatusChange(async (wallet) => {
                if (wallet) {
                    const rawAddress = wallet.account.address;
                    const userFriendlyAddress = TON_CONNECT_UI.toUserFriendlyAddress(rawAddress);
                    
                    if (typeof userState !== 'undefined') {
                        userState.walletConnected = true;
                        userState.walletAddress = userFriendlyAddress;
                    }
                    localStorage.setItem('ton_wallet', userFriendlyAddress);
                    
                    if (typeof showPage === 'function') showPage('wallet');
                } else {
                    if (typeof userState !== 'undefined') {
                        userState.walletConnected = false;
                        userState.walletAddress = '';
                    }
                    localStorage.removeItem('ton_wallet');
                    if (typeof showPage === 'function') showPage('wallet');
                }
            });
        } catch (err) {
            console.warn("TON Connect Init Warning:", err);
        }
    }
}

window.triggerConnect = async function() {
    initTonConnectInstance();
    if (tonConnectUI) {
        try {
            await tonConnectUI.openModal();
        } catch (err) {
            console.error("TON Connect Error:", err);
        }
    } else {
        alert("TON Connect SDK is loading, please try again in a moment.");
    }
};

window.triggerDisconnect = async function() {
    if (tonConnectUI && tonConnectUI.connected) {
        await tonConnectUI.disconnect();
    } else {
        if (typeof userState !== 'undefined') {
            userState.walletConnected = false;
            userState.walletAddress = '';
        }
        localStorage.removeItem('ton_wallet');
        if (typeof showPage === 'function') showPage('wallet');
    }
};

// ==========================================
// 🔮 Solana Network Functions
// ==========================================
async function fetchRealSolanaBalance(address) {
    const el = document.getElementById('real-solana-balance');
    try {
        const solanaWeb3Obj = window.solanaWeb3 || window.solana;
        if (solanaWeb3Obj && solanaWeb3Obj.Connection) {
            const connection = new solanaWeb3Obj.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
            const pubKey = new solanaWeb3Obj.PublicKey(address);
            const balance = await connection.getBalance(pubKey);
            const solVal = (balance / 1000000000).toFixed(4);
            if (el) el.innerText = `${solVal} SOL`;
            return;
        }
    } catch (err) {
        console.warn("Solana Balance Error:", err);
    }
    if (el) el.innerText = `0.0000 SOL`;
}

// ==========================================
// 🟣 Real Solana Connection Handler
// ==========================================
window.connectPhantomWallet = async function() {
    try {
        const isSolanaAvailable = "solana" in window;
        
        if (isSolanaAvailable) {
            const response = await window.solana.connect();
            const walletAddress = response.publicKey.toString();

            console.log("✅ Solana Real Wallet Connected:", walletAddress);
            await saveSolanaAddressToStateAndDB(walletAddress);
        } else {
            const currentUrl = encodeURIComponent(window.location.href);
            const phantomDeepLink = `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;
            window.open(phantomDeepLink, '_blank');
            alert('Please install Phantom Wallet or open this app inside Phantom Browser!');
        }
    } catch (err) {
        console.error("Solana Connection Error:", err);
        alert('Solana wallet connection request was rejected or cancelled.');
    }
};

async function saveSolanaAddressToStateAndDB(solAddress) {
    localStorage.setItem('solana_wallet', solAddress);
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const currentUserId = (typeof userState !== 'undefined' && userState.userId) ? userState.userId : null;
            if (currentUserId) {
                await supabaseClient
                    .from('users')
                    .update({ wallet_address: solAddress })
                    .eq('telegram_id', String(currentUserId));
            }
        } catch (dbErr) {
            console.error("Database save error:", dbErr);
        }
    }

    if (typeof showPage === 'function') {
        showPage('wallet');
    }
}

window.disconnectSolanaWallet = async function() {
    try {
        if ("solana" in window && window.solana.disconnect) {
            await window.solana.disconnect();
        }
    } catch (e) {
        console.log("Disconnect trace:", e);
    }

    localStorage.removeItem('solana_wallet');
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = '';
    }

    if (typeof supabaseClient !== 'undefined' && supabaseClient) {
        try {
            const currentUserId = (typeof userState !== 'undefined' && userState.userId) ? userState.userId : null;
            if (currentUserId) {
                await supabaseClient
                    .from('users')
                    .update({ wallet_address: null })
                    .eq('telegram_id', String(currentUserId));
            }
        } catch (dbErr) {
            console.error("Database disconnect update error:", dbErr);
        }
    }

    if (typeof showPage === 'function') {
        showPage('wallet');
    }
};

// ==========================================
// ⚡ Claim Action Handler
// ==========================================
window.claimCoinsToSolanaWallet = async function() {
    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem('solana_wallet') || '');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined) 
        ? Number(userState.points) 
        : Number(localStorage.getItem('user_coins') || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert('⚠️ Please connect your verified Solana wallet first!');
        return;
    }

    if (userCoins <= 0) {
        alert(`⚠️ You do not have enough ${TOKEN_NAME} balance to claim.`);
        return;
    }

    const tokenAmountToReceive = (userCoins / COINS_PER_ZELO_TOKEN).toFixed(2);

    const confirmClaim = confirm(
        `Confirm deducting ${userCoins.toLocaleString()} points to receive ${tokenAmountToReceive} ${TOKEN_NAME} tokens on your wallet?`
    );

    if (!confirmClaim) return;

    try {
        if (claimBtn) {
            claimBtn.disabled = true;
            claimBtn.innerText = '⏳ Connecting to backend & sending tokens...';
        }

        const response = await fetch(`${BACKEND_URL}/api/claim`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userWalletAddress: solWallet,
                userCoins: userCoins
            })
        });

        const result = await response.json().catch(() => null);

        if (response.ok && result && result.success) {
            localStorage.setItem('user_coins', 0);
            if (typeof userState !== 'undefined') {
                userState.points = 0;
                userState.coins = 0;
            }

            if (typeof showPage === 'function') {
                showPage('wallet');
            }

            alert(`✅ Claim successful!\n\nTx Hash: ${result.txHash}`);
        } else {
            let errorDetails = "Unknown error";
            if (result && result.error) {
                errorDetails = typeof result.error === 'object' ? JSON.stringify(result.error) : result.error;
            } else if (result && result.message) {
                errorDetails = result.message;
            } else {
                errorDetails = `HTTP ${response.status}: ${response.statusText || 'Server Error'}`;
            }

            alert(`❌ Claim transaction failed:\n${errorDetails}`);
        }

    } catch (error) {
        console.error("Claim Error:", error);
        alert(`❌ Connection error:\n${error.message}`);
    } finally {
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.innerText = `⚡ Claim ${TOKEN_NAME} Tokens`;
        }
    }
};

window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => alert('Wallet address copied to clipboard
