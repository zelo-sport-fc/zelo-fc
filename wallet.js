// ==========================================
// 👛 Zelo Sport Wallet - Frontend Script (Fixed & Fully Functional) 💎
// ==========================================

const COINS_PER_ZELO_TOKEN = 100; // Conversion rate: 100 coins = 1 ZELOFC Token
const BACKEND_URL = "https://zelo-fc.onrender.com"; // Render backend URL
const TOKEN_NAME = "ZELOFC"; // Token symbol

// Fast Public RPC Node for Solana
const SOLANA_RPC_URL = "https://solana-mainnet.rpc.extrnode.com";

// 1. Preload Solana Web3 Library safely
if (!window.solanaWeb3 && !document.getElementById('solana-web3-script')) {
    const script = document.createElement('script');
    script.id = 'solana-web3-script';
    script.src = 'https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js';
    document.head.appendChild(script);
}

// 2. Preload TON Connect UI Library safely
if (!window.TON_CONNECT_UI && !document.getElementById('ton-connect-script')) {
    const script = document.createElement('script');
    script.id = 'ton-connect-script';
    script.src = 'https://unpkg.com/@tonconnect/ui@latest/dist/tonconnect-ui.min.js';
    document.head.appendChild(script);
}

let tonConnectUIInstance = null;

async function renderWalletPage(container) {
    if (!container) return;

    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest';

    // ⚡ 1. Read Cached Local Data First (Instant Display)
    const cachedCoins = Number(localStorage.getItem(`user_coins_${telegramId}`) || 0);
    const cachedSolana = localStorage.getItem(`solana_wallet_${telegramId}`) || '';
    const cachedTon = localStorage.getItem(`ton_wallet_${telegramId}`) || '';

    let userCoins = (typeof userState !== 'undefined' && userState.points !== undefined)
        ? Number(userState.points) : cachedCoins;
    
    let solanaWallet = cachedSolana || (typeof userState !== 'undefined' ? userState.solanaWallet : '');
    let tonWallet = cachedTon || (typeof userState !== 'undefined' ? userState.walletAddress : '');

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
            .wallet-header-flex { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
            .wallet-logo-title { display: flex; align-items: center; gap: 8px; }
            .wallet-logo-sm {
                width: 30px; height: 30px; border-radius: 50%;
                background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center;
                border: 1px solid rgba(255,255,255,0.1);
            }
            .address-box-sm {
                background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.1);
                padding: 8px 12px; border-radius: 10px; font-family: monospace; font-size: 0.82rem;
                margin-bottom: 10px; word-break: break-all;
            }
            .btn-glass-ton {
                background: linear-gradient(135deg, #0088cc, #005580); color: white; border: none;
                border-radius: 10px; padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
            }
            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8); color: white; border: none;
                border-radius: 10px; padding: 10px 14px; font-weight: bold; font-size: 0.88rem;
                cursor: pointer; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;
                margin-bottom: 8px;
            }
            .solana-input-sm {
                width: 100%; padding: 8px 10px; background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(171, 159, 242, 0.3); border-radius: 8px; color: #fff;
                font-family: monospace; font-size: 0.8rem; box-sizing: border-box; margin-bottom: 8px; text-align: center;
            }
            .btn-action-sm {
                background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-danger-sm {
                background: rgba(253, 29, 29, 0.12); color: #ff4d4d; border: 1px solid rgba(253, 29, 29, 0.3);
                border-radius: 8px; padding: 6px 12px; font-size: 0.8rem; font-weight: bold; cursor: pointer;
            }
            .btn-claim-main {
                background: linear-gradient(135deg, #14F195, #00B4D8); color: #000; border: none;
                border-radius: 12px; padding: 12px 16px; font-size: 0.95rem; font-weight: 900; cursor: pointer;
                width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;
                box-shadow: 0 4px 15px rgba(20, 241, 149, 0.3); transition: transform 0.2s;
            }
            .btn-claim-main:active { transform: scale(0.98); }
            
            /* Skeleton Pulse Animation */
            .skeleton-pulse {
                animation: pulse 1.5s infinite ease-in-out;
                background: rgba(255, 255, 255, 0.08);
                border-radius: 6px;
                display: inline-block;
            }
            @keyframes pulse {
                0% { opacity: 0.4; }
                50% { opacity: 0.8; }
                100% { opacity: 0.4; }
            }
        </style>
    `;

    // ⚡ 2. Render Full Page Instantly using local/cached values
    container.innerHTML = `
        ${walletStyles}
        
        <!-- 1. TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #0088cc;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm">
                        <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" style="width:18px;height:18px;" alt="TON">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">TON Wallet</span>
                </div>
                <div id="ton-status-tag">
                    ${tonWallet ? `<span style="color:#0088cc; font-size:0.75rem; font-weight:bold;">● Connected</span>` : ''}
                </div>
            </div>

            <div id="ton-card-content">
            ${tonWallet ? `
                <div class="address-box-sm" style="color:#0088cc;">
                    ${tonWallet.slice(0, 8)}...${tonWallet.slice(-8)}
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${tonWallet}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="disconnectTonWallet()">🔌 Disconnect</button>
                </div>
            ` : `
                <button class="btn-glass-ton" onclick="connectTonWallet()">
                    <span>💎</span> Connect TON Wallet
                </button>
            `}
            </div>
        </div>

        <!-- 2. SOLANA WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #AB9FF2;">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(171, 159, 242, 0.4);">
                        <img src="https://cryptologos.cc/logos/solana-sol-logo.png" style="width:18px;height:18px;" alt="Solana">
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">Solana Wallet</span>
                </div>
            </div>

            <div id="solana-card-content">
            ${solanaWallet ? `
                <div class="address-box-sm" style="color:#AB9FF2;">
                    ${solanaWallet.slice(0, 8)}...${solanaWallet.slice(-8)}
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.3); padding:8px 12px; border-radius:8px; margin-bottom:10px;">
                    <span style="color:#8e8e93; font-size:0.8rem;">On-Chain SOL:</span>
                    <span id="real-solana-balance" style="color:#14F195; font-weight:bold; font-size:0.95rem;">
                        <span class="skeleton-pulse" style="width: 60px; height: 16px;"></span>
                    </span>
                </div>
                <div style="display: flex; gap: 8px; justify-content: center;">
                    <button class="btn-action-sm" onclick="copyToClipboard('${solanaWallet}')">📋 Copy</button>
                    <button class="btn-danger-sm" onclick="disconnectSolanaWallet()">🔌 Disconnect</button>
                </div>
            ` : `
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:16px; height:16px;" alt="">
                    Auto Connect Phantom
                </button>
                <input type="text" id="solana-address-input" class="solana-input-sm" placeholder="Or paste Solana address...">
                <button class="btn-action-sm" style="width: 100%; border-color: rgba(171, 159, 242, 0.4); background: rgba(171, 159, 242, 0.15);" onclick="saveSolanaWalletAddress()">
                    💾 Save Address
                </button>
            `}
            </div>
        </div>

        <!-- 3. TOKEN BALANCE & CLAIM CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid #facc15; background: linear-gradient(135deg, rgba(35, 30, 20, 0.85), rgba(18, 18, 22, 0.95));">
            <div class="wallet-header-flex">
                <div class="wallet-logo-title">
                    <div class="wallet-logo-sm" style="border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1);">
                        <span style="font-size: 1.1rem;">🪙</span>
                    </div>
                    <span style="color:#fff; font-weight:bold; font-size:0.95rem;">${TOKEN_NAME} Balance</span>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.35); padding: 12px; border-radius: 12px; margin-bottom: 12px; border: 1px solid rgba(250, 204, 21, 0.2);">
                <span style="color: #aaa; font-size: 0.85rem;">Total Earned:</span>
                <span id="user-coins-display" style="color: #facc15; font-weight: 900; font-size: 1.2rem; font-family: monospace;">
                    ${userCoins.toLocaleString()} ${TOKEN_NAME}
                </span>
            </div>

            <button class="btn-claim-main" id="btn-claim-action" onclick="claimCoinsToSolanaWallet()">
                ⚡ Claim ${TOKEN_NAME} Tokens
            </button>
        </div>
        
        <div style="height: 20px;"></div>
    `;

    // ⚡ 3. Background Sync (Async Non-Blocking Fetch)
    if (telegramId !== 'guest') {
        fetch(`${BACKEND_URL}/api/user-info?telegramId=${telegramId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.success) {
                    const serverCoins = Number(data.coins || 0);
                    const serverSolana = data.solanaWallet || '';
                    const serverTon = data.tonWallet || '';

                    // Save latest to Cache
                    localStorage.setItem(`user_coins_${telegramId}`, serverCoins);
                    if (serverSolana) localStorage.setItem(`solana_wallet_${telegramId}`, serverSolana);
                    if (serverTon) localStorage.setItem(`ton_wallet_${telegramId}`, serverTon);

                    // Update UI live if value changed
                    const coinsEl = document.getElementById('user-coins-display');
                    if (coinsEl) coinsEl.innerText = `${serverCoins.toLocaleString()} ${TOKEN_NAME}`;

                    if (typeof userState !== 'undefined') {
                        userState.points = serverCoins;
                        userState.coins = serverCoins;
                        if (serverSolana) userState.solanaWallet = serverSolana;
                        if (serverTon) userState.walletAddress = serverTon;
                    }
                }
            })
            .catch(err => console.warn("⚠️ Background sync delayed:", err));
    }

    // ⚡ 4. Fetch Solana Balance Parallelly
    if (solanaWallet) {
        fetchRealSolanaBalance(solanaWallet);
    }
}

// Global Export for App Routing
window.renderWalletPage = renderWalletPage;

// Helper to Copy Text
window.copyToClipboard = function(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
    } else {
        const input = document.createElement('input');
        input.value = text;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        alert('Copied to clipboard!');
    }
};

// ==========================================
// 🔮 Fast Solana RPC Balance Fetcher
// ==========================================
async function fetchRealSolanaBalance(address) {
    const el = document.getElementById('real-solana-balance');
    
    // Retry loop until solanaWeb3 script is loaded
    let attempts = 0;
    while (!window.solanaWeb3 && attempts < 10) {
        await new Promise(r => setTimeout(r, 300));
        attempts++;
    }

    try {
        if (window.solanaWeb3) {
            const connection = new window.solanaWeb3.Connection(SOLANA_RPC_URL, 'confirmed');
            const pubKey = new window.solanaWeb3.PublicKey(address);
            const balance = await connection.getBalance(pubKey);
            const solVal = (balance / window.solanaWeb3.LAMPORTS_PER_SOL).toFixed(4);
            if (el) el.innerText = `${solVal} SOL`;
            return;
        }
    } catch (err) {
        console.warn("Solana RPC Error:", err);
    }
    if (el) el.innerText = `0.0000 SOL`;
}

// ==========================================
// 💾 Save Wallet to LocalStorage & Backend
// ==========================================
async function saveWalletToDB(walletType, walletAddress) {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    // 1. Local storage save
    if (walletType === 'solana') {
        localStorage.setItem(`solana_wallet_${telegramId || 'guest'}`, walletAddress);
        if (typeof userState !== 'undefined') userState.solanaWallet = walletAddress;
    } else if (walletType === 'ton') {
        localStorage.setItem(`ton_wallet_${telegramId || 'guest'}`, walletAddress);
        if (typeof userState !== 'undefined') {
            userState.walletAddress = walletAddress;
            userState.walletConnected = true;
        }
    }

    // 2. Database update
    if (telegramId) {
        try {
            await fetch(`${BACKEND_URL}/api/save-wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegramId: telegramId,
                    walletType: walletType,
                    walletAddress: walletAddress
                })
            });
        } catch (err) {
            console.error("❌ Failed to sync wallet with backend:", err);
        }
    }

    if (typeof showPage === 'function') showPage('wallet');
}

// ==========================================
// 🔌 TON Wallet Handlers
// ==========================================
window.connectTonWallet = async function() {
    try {
        let attempts = 0;
        while (!window.TON_CONNECT_UI && attempts < 10) {
            await new Promise(r => setTimeout(r, 200));
            attempts++;
        }

        if (!tonConnectUIInstance && window.TON_CONNECT_UI) {
            tonConnectUIInstance = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: `${BACKEND_URL}/tonconnect-manifest.json`,
                buttonRootId: null
            });
        }

        if (tonConnectUIInstance) {
            await tonConnectUIInstance.openModal();

            tonConnectUIInstance.onStatusChange(async (wallet) => {
                if (wallet && wallet.account && wallet.account.address) {
                    const tonAddress = wallet.account.address;
                    await saveWalletToDB('ton', tonAddress);
                }
            });
        } else {
            const promptAddress = prompt("Enter your TON Wallet Address:");
            if (promptAddress && promptAddress.trim().length > 10) {
                await saveWalletToDB('ton', promptAddress.trim());
            }
        }
    } catch (e) {
        console.error("TON Connect Error:", e);
    }
};

window.disconnectTonWallet = async function() {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    localStorage.removeItem(`ton_wallet_${telegramId || 'guest'}`);
    
    if (tonConnectUIInstance) {
        try {
            await tonConnectUIInstance.disconnect();
        } catch (e) {
            console.warn("TON Disconnect error:", e);
        }
    }

    if (typeof userState !== 'undefined') {
        userState.walletAddress = '';
        userState.walletConnected = false;
    }

    await saveWalletToDB('ton', '');
};

// ==========================================
// 🟣 Solana Wallet Handlers
// ==========================================
window.connectPhantomWallet = function() {
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            saveWalletToDB('solana', res.publicKey.toString());
        }).catch((err) => console.error(err));
    } else {
        alert('Please copy your wallet address from the Phantom app and paste it in the field.');
    }
};

window.saveSolanaWalletAddress = function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    if (solAddress.length >= 32) {
        saveWalletToDB('solana', solAddress);
    } else {
        alert('Please enter a valid Solana address');
    }
};

window.disconnectSolanaWallet = async function() {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
    localStorage.removeItem(`solana_wallet_${telegramId || 'guest'}`);
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = '';
    }

    await saveWalletToDB('solana', '');
};

// ==========================================
// ⚡ Claim Action Handler
// ==========================================
window.claimCoinsToSolanaWallet = async function() {
    const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest';

    const solWallet = (typeof userState !== 'undefined' && userState.solanaWallet) 
        ? userState.solanaWallet 
        : (localStorage.getItem(`solana_wallet_${telegramId}`) || '');

    const userCoins = (typeof userState !== 'undefined' && userState.points !== undefined) 
        ? Number(userState.points) 
        : Number(localStorage.getItem(`user_coins_${telegramId}`) || 0);

    const claimBtn = document.getElementById('btn-claim-action');

    if (!solWallet) {
        alert('⚠️ Please connect or save your Solana Wallet first!');
        return;
    }

    if (userCoins <= 0) {
        ale
