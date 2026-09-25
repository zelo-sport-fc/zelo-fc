// ==========================================
// 👛 ملف قسم المحفظة - الربط الحقيقي المباشر بـ Phantom و TON 💎
// ==========================================

function renderWalletPage(container) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    const walletStyles = `
        <style>
            .wallet-glass-card {
                background: linear-gradient(135deg, rgba(28, 28, 34, 0.7), rgba(18, 18, 22, 0.8));
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 24px;
                padding: 25px 20px;
                text-align: center;
                box-shadow: 0 15px 35px rgba(0,0,0,0.5), inset 0 2px 20px rgba(255,255,255,0.02);
                position: relative;
                overflow: hidden;
                margin-bottom: 20px;
            }
            .wallet-logo-container {
                position: relative;
                width: 60px; height: 60px;
                margin: 0 auto 12px auto;
                background: rgba(255,255,255,0.05);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 0 20px rgba(0, 136, 204, 0.2);
                border: 2px solid rgba(0, 136, 204, 0.3);
                z-index: 1;
            }
            .address-box-glass {
                background: rgba(0, 0, 0, 0.4);
                border: 1px solid rgba(0, 136, 204, 0.2);
                padding: 10px 16px;
                border-radius: 12px;
                margin-bottom: 15px;
                display: inline-block;
            }
            .balance-box-glass {
                background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                border: 1px solid rgba(255,255,255,0.05);
                padding: 12px;
                border-radius: 16px;
                margin-bottom: 15px;
            }
            .btn-glass-ton {
                background: linear-gradient(135deg, #0088cc, #005580);
                color: white; border: none; border-radius: 14px;
                padding: 14px 20px; font-weight: 900; font-size: 1rem;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                width: 100%; transition: all 0.3s;
            }
            .btn-glass-solana {
                background: linear-gradient(135deg, #AB9FF2, #512DA8);
                color: white; border: none; border-radius: 14px;
                padding: 14px 20px; font-weight: 900; font-size: 1rem;
                cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
                width: 100%; transition: all 0.3s; box-shadow: 0 8px 20px rgba(171, 159, 242, 0.3);
            }
            .solana-input {
                width: 100%; padding: 12px; background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(171, 159, 242, 0.4); border-radius: 12px;
                color: #fff; font-family: monospace; font-size: 0.85rem;
                box-sizing: border-box; margin-bottom: 10px; text-align: center;
            }
            .btn-glass-danger {
                background: rgba(253, 29, 29, 0.1); color: #fd1d1d;
                border: 1px solid rgba(253, 29, 29, 0.3); border-radius: 12px;
                padding: 10px 15px; font-weight: bold; cursor: pointer;
            }
            .btn-glass-copy {
                background: rgba(255, 255, 255, 0.05); color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;
                padding: 10px 15px; font-weight: bold; cursor: pointer;
            }
        </style>
    `;

    const solanaWallet = (typeof userState !== 'undefined' && userState.solanaWallet) ? userState.solanaWallet : '';

    container.innerHTML = `
        ${walletStyles}
        
        <!-- TON WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid rgba(0, 136, 204, 0.5);">
            <div class="wallet-logo-container">
                <img src="https://cryptologos.cc/logos/toncoin-ton-logo.png" alt="TON" style="width: 35px; height: 35px;">
            </div>
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 900;">
                ${isAr ? 'محفظة تليجرام (TON Network)' : 'Telegram Wallet (TON)'}
            </h3>
            
            ${userState.walletConnected ? `
                <div class="address-box-glass">
                    <span style="font-family: monospace; font-size: 0.9rem; color: #0088cc; font-weight: 900;">
                        ${userState.walletAddress.slice(0, 6)}...${userState.walletAddress.slice(-6)}
                    </span>
                </div>
                <div class="balance-box-glass">
                    <span style="font-size: 0.75rem; color: #94a3b8; display: block; margin-bottom: 5px;">
                        ${isAr ? 'رصيد TON' : 'TON Balance'}
                    </span>
                    <h2 id="real-ton-balance" style="margin: 0; font-size: 1.8rem; color: #fff; font-family: monospace;">⏳</h2>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-glass-copy" onclick="copyToClipboard('${userState.walletAddress}')">📋 ${isAr ? 'نسخ' : 'Copy'}</button>
                    <button class="btn-glass-danger" onclick="triggerDisconnect()">🔌 ${isAr ? 'فصل' : 'Disconnect'}</button>
                </div>
            ` : `
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">
                    ${isAr ? 'ربط محفظة تليجرام المدمجة لشبكة TON' : 'Connect Telegram Wallet via TON Connect'}
                </p>
                <button class="btn-glass-ton" onclick="triggerConnect()">
                    <span>💎</span> ${isAr ? 'ربط TON Wallet' : 'Connect TON Wallet'}
                </button>
            `}
        </div>

        <!-- SOLANA REAL WALLET CARD -->
        <div class="wallet-glass-card" style="border-top: 2px solid rgba(171, 159, 242, 0.8);">
            <div class="wallet-logo-container" style="border-color: rgba(171, 159, 242, 0.4); box-shadow: 0 0 20px rgba(171, 159, 242, 0.2);">
                <img src="https://cryptologos.cc/logos/solana-sol-logo.png" alt="Solana" style="width: 35px; height: 35px;">
            </div>
            <h3 style="color: #fff; margin: 0 0 10px 0; font-size: 1.2rem; font-weight: 900;">
                ${isAr ? 'محفظة سولانا (Phantom Wallet)' : 'Solana (Phantom Wallet)'}
            </h3>
            
            ${solanaWallet ? `
                <div class="address-box-glass" style="border-color: rgba(171, 159, 242, 0.4);">
                    <span style="font-family: monospace; font-size: 0.9rem; color: #AB9FF2; font-weight: 900;">
                        ${solanaWallet.slice(0, 6)}...${solanaWallet.slice(-6)}
                    </span>
                </div>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-glass-copy" onclick="copyToClipboard('${solanaWallet}')">📋 ${isAr ? 'نسخ' : 'Copy'}</button>
                    <button class="btn-glass-danger" onclick="disconnectSolanaWallet()">🔌 ${isAr ? 'فصل' : 'Disconnect'}</button>
                </div>
            ` : `
                <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 15px;">
                    ${isAr ? 'ربط مباشر بمحفظة Phantom لتلقي المكافآت' : 'Direct connect with Phantom Wallet to receive rewards'}
                </p>

                <!-- زر الاتصال المباشر بـ Phantom -->
                <button class="btn-glass-solana" onclick="connectPhantomWallet()">
                    <img src="https://phantom.app/img/phantom-logo.svg" style="width:20px; height:20px;" alt="">
                    ${isAr ? 'اتصال بمحفظة Phantom' : 'Connect Phantom Wallet'}
                </button>

                <div style="margin: 15px 0 10px 0; color: #64748b; font-size: 0.8rem;">— ${isAr ? 'أو أدخل العنوان يدوياً' : 'OR Enter Address Manually'} —</div>

                <input type="text" id="solana-address-input" class="solana-input" 
                       placeholder="${isAr ? 'أدخل عنوان Solana SPL...' : 'Enter Solana SPL address...'}">

                <button class="btn-glass-copy" style="width: 100%; border-color: rgba(171, 159, 242, 0.3);" onclick="saveSolanaWalletAddress()">
                    💾 ${isAr ? 'حفظ العنوان' : 'Save Address'}
                </button>
            `}
        </div>
        
        <div style="height: 30px;"></div>
    `;

    if (userState.walletConnected) {
        fetchRealTonBalance(userState.walletAddress);
    }
}

// ==========================================
// 👻 دالة الربط المباشر مع محفظة Phantom
// ==========================================
window.connectPhantomWallet = function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    // التحقق مما إذا كان تطبيق Phantom متاحاً كـ Web3 Provider في المتصفح
    if ("solana" in window && window.solana.isPhantom) {
        window.solana.connect().then((res) => {
            const pubKey = res.publicKey.toString();
            saveSolanaAddressToStateAndDB(pubKey);
        }).catch((err) => {
            console.error("Phantom Error:", err);
        });
    } else {
        // في حال عدم توفره مباشرة (داخل تليجرام)، يتم فتح Phantom عبر Deep Link
        const appUrl = encodeURIComponent(window.location.href);
        const phantomDeepLink = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&dapp_encryption_public_key=`;
        
        // توجيه المستخدم لمحفظة Phantom
        window.open(phantomDeepLink, '_blank');
    }
};

// ==========================================
// 💾 حفظ وحذف عنوان Solana في Supabase والتطبيق
// ==========================================
async function saveSolanaAddressToStateAndDB(solAddress) {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    
    if (typeof userState !== 'undefined') {
        userState.solanaWallet = solAddress;
    }

    try {
        if (typeof supabaseClient !== 'undefined' && userState.userId) {
            await supabaseClient
                .from('users')
                .update({ solana_wallet: solAddress })
                .eq('telegram_id', userState.userId);
        }
        alert(isAr ? '✅ تم ربط محفظة Solana بنجاح!' : '✅ Solana Wallet Connected Successfully!');
        showPage('wallet');
    } catch (err) {
        console.error("Save Error:", err);
    }
}

window.saveSolanaWalletAddress = function() {
    const input = document.getElementById('solana-address-input');
    if (!input) return;
    const solAddress = input.value.trim();
    if (solAddress.length >= 32) {
        saveSolanaAddressToStateAndDB(solAddress);
    } else {
        alert('Please enter a valid Solana address');
    }
};

window.disconnectSolanaWallet = async function() {
    const isAr = (typeof userState !== 'undefined' && userState.lang === 'ar');
    if (confirm(isAr ? 'هل تريد فصل محفظة سولانا؟' : 'Disconnect Solana Wallet?')) {
        if (typeof userState !== 'undefined') userState.solanaWallet = null;
        if (typeof supabaseClient !== 'undefined' && userState.userId) {
            await supabaseClient.from('users').update({ solana_wallet: null }).eq('telegram_id', userState.userId);
        }
        showPage('wallet');
    }
};
