// ==========================================
// ⚽ Zelo Sport - Matches & Trading Module (Integrated In-App Swap)
// ==========================================

// رابط الباك إند الخاص بك على Render (استبدله برابطك الحقيقي)
const BACKEND_URL = 'https://YOUR-BACKEND-URL.com';

// بيانات تجريبية للمباريات المتاحة للتداول
window.sampleMatchesData = [
    { id: 'm1', teamA: 'Real Madrid', teamB: 'Barcelona' },
    { id: 'm2', teamA: 'Liverpool', teamB: 'Manchester City' },
    { id: 'm3', teamA: 'Bayern Munich', teamB: 'PSG' }
];

// حالة عملية الشراء الحالية
let activeSwapState = {
    matchId: null,
    teamName: null,
    teamChoice: null
};

// ==========================================
// 1. حقن التنسيقات (CSS Injection)
// ==========================================
function injectModuleStyles() {
    if (document.getElementById('zelo-swap-styles')) return;
    const style = document.createElement('style');
    style.id = 'zelo-swap-styles';
    style.innerHTML = `
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px);
            display: flex; justify-content: center; align-items: center;
            z-index: 9999; direction: rtl;
        }
        .modal-content {
            background: #18222d; border: 1px solid #2b394a; border-radius: 18px;
            width: 90%; max-width: 380px; padding: 20px; color: #fff;
            box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 10px;
        }
        .close-btn { background: none; border: none; color: #888; font-size: 24px; cursor: pointer; }
        .preset-container { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0; }
        .preset-btn {
            background: #232e3c; border: 1px solid #324458; color: #fff;
            padding: 8px 4px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer;
        }
        .preset-btn.active { background: #14F195; color: #000; }
        .custom-input-group { position: relative; margin-top: 10px; }
        .custom-input-group input {
            width: 100%; background: #0f1721; border: 1px solid #2b394a;
            color: #fff; padding: 12px 35px 12px 12px; border-radius: 10px; font-size: 16px; box-sizing: border-box;
        }
        .custom-input-group .symbol {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
            color: #14F195; font-weight: bold;
        }
        .confirm-swap-btn {
            width: 100%; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%);
            color: #000; border: none; padding: 14px; border-radius: 10px;
            font-size: 16px; font-weight: bold; margin-top: 15px; cursor: pointer;
        }
        .confirm-swap-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    `;
    document.head.appendChild(style);
}

// ==========================================
// 2. حقن هيكل الـ Modal في الصفحة تلقائياً
// ==========================================
function ensureSwapModalInDOM() {
    injectModuleStyles();
    if (document.getElementById('swapModal')) return;

    const modalHTML = `
        <div id="swapModal" class="modal-overlay" style="display: none;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 id="modalTeamTitle" style="margin: 0; font-size: 1.1rem; color: #fff;">شراء توكن الفريق</h3>
                    <button class="close-btn" onclick="window.closeSwapModal()">&times;</button>
                </div>
                
                <div class="modal-body">
                    <label style="font-size: 0.85rem; color: #aaa;">اختر المبلغ بـ SOL للشراء:</label>
                    
                    <div class="preset-container">
                        <button class="preset-btn" onclick="window.selectAmount(0.01)">0.01</button>
                        <button class="preset-btn active" onclick="window.selectAmount(0.05)">0.05</button>
                        <button class="preset-btn" onclick="window.selectAmount(0.1)">0.1</button>
                        <button class="preset-btn" onclick="window.selectAmount(0.5)">0.5</button>
                    </div>

                    <div class="custom-input-group">
                        <input type="number" id="solAmountInput" value="0.05" step="0.01" min="0.001" placeholder="أدخل مبلغ مخصص">
                        <span class="symbol">SOL</span>
                    </div>
                </div>

                <div class="modal-footer">
                    <button id="confirmSwapBtn" class="confirm-swap-btn" onclick="window.confirmSwap()">
                        تأكيد الشراء 🚀
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// ==========================================
// 3. محرك الشراء المباشر (Jupiter In-App Swap Engine)
// ==========================================
async function getUserWalletProvider() {
    const provider = window.solana || window.phantom?.solana;
    if (provider) {
        if (!provider.isConnected) await provider.connect();
        return provider;
    }
    throw new Error('لم يتم العثور على محفظة متصلة. يرجى فتح التطبيق من محفظة Phantom أو Solflare.');
}

async function executeInAppSwap(targetTokenMint, amountInSol) {
    const lamports = Math.round(amountInSol * 1000000000);
    const solMint = "So11111111111111111111111111111111111111112";

    const wallet = await getUserWalletProvider();
    const userPublicKey = wallet.publicKey.toString();

    // 1. جلب السعر من Jupiter Quote API
    const quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${solMint}&outputMint=${targetTokenMint}&amount=${lamports}&slippageBps=100`
    ).then(res => res.json());

    if (!quoteResponse || quoteResponse.error) {
        throw new Error('فشل في جلب تسعيرة السيولة للتداول');
    }

    // 2. طلب المعاملة غير الموقعة
    const swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            quoteResponse,
            userPublicKey,
            wrapAndUnwrapSol: true
        })
    }).then(res => res.json());

    // 3. فك وتوقيع المعاملة عبر محفظة المستخدم
    const swapTransactionBuf = Uint8Array.from(atob(swapResponse.swapTransaction), c => c.charCodeAt(0));
    const transaction = solanaWeb3.VersionedTransaction.deserialize(swapTransactionBuf);
    
    const { signature } = await wallet.signAndSendTransaction(transaction);
    return signature;
}

// ==========================================
// 4. إدارة النافذة المنبثقة والأحداث
// ==========================================
window.handleBuyMatchToken = function(matchId, teamName, teamChoice) {
    ensureSwapModalInDOM();
    activeSwapState = { matchId, teamName, teamChoice };

    document.getElementById('modalTeamTitle').innerText = `شراء توكن: ${teamName}`;
    document.getElementById('swapModal').style.display = 'flex';
};

window.closeSwapModal = function() {
    const modal = document.getElementById('swapModal');
    if (modal) modal.style.display = 'none';
};

window.selectAmount = function(val) {
    document.getElementById('solAmountInput').value = val;
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.trim() === String(val)) btn.classList.add('active');
    });
};

window.confirmSwap = async function() {
    const btn = document.getElementById('confirmSwapBtn');
    const amount = parseFloat(document.getElementById('solAmountInput').value);

    if (!amount || amount <= 0) {
        alert('⚠️ يرجى إدخال كمية SOL صحيحة');
        return;
    }

    try {
        btn.disabled = true;
        btn.innerText = '⏳ جاري إنشاء السوق...';

        // Step 1: إرسال الطلب للباك إند لضمان إنشاء التوكن وربطه بـ Meteora
        const response = await fetch(`${BACKEND_URL}/api/matches/create-market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: activeSwapState.matchId,
                teamA: activeSwapState.teamChoice === 'A' ? activeSwapState.teamName : 'Team A',
                teamB: activeSwapState.teamChoice === 'B' ? activeSwapState.teamName : 'Team B'
            })
        });

        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'فشل في إعداد السوق');

        const tokenMint = activeSwapState.teamChoice === 'A' ? data.tokenAMint : data.tokenBMint;

        // Step 2: تنفيذ الشراء الفعلي عبر المحفظة
        btn.innerText = '✍️ يرجى توقيع المعاملة بالمحفظة...';
        const txHash = await executeInAppSwap(tokenMint, amount);

        alert(`🎉 تمت عملية الشراء بنجاح!\nمعرف المعاملة (Tx Hash):\n${txHash}`);
        window.closeSwapModal();

    } catch (err) {
        console.error('Swap Error:', err);
        alert(`❌ فشلت عملية الشراء: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.innerText = 'تأكيد الشراء 🚀';
    }
};

// ==========================================
// 5. عرض البطاقات والصفحة
// ==========================================
window.renderMatchTradeCard = function(match) {
    return `
        <div class="card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px; background: rgba(28, 28, 34, 0.7); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.95rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.15); padding: 4px 8px; border-radius: 6px; font-weight: bold;">LIVE MARKET</span>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 8px;">
                <button 
                    onclick="window.handleBuyMatchToken('${match.id}', '${match.teamA}', 'A')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                    شراء ${match.teamA} 📈
                </button>
                <button 
                    onclick="window.handleBuyMatchToken('${match.id}', '${match.teamB}', 'B')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 10px; border-radius: 10px; font-weight: 800; font-size: 0.8rem; cursor: pointer;">
                    شراء ${match.teamB} 📈
                </button>
            </div>
        </div>
    `;
};

window.renderMeteoraPage = function(container) {
    if (!container) return;
    ensureSwapModalInDOM();

    const isAr = typeof userState !== 'undefined' && userState.lang === 'ar';
    const matchesList = window.sampleMatchesData.map(match => window.renderMatchTradeCard(match)).join('');

    container.innerHTML = `
        <div style="padding: 10px;">
            <div class="card" style="text-align: center; padding: 20px 15px; margin-bottom: 15px; background: linear-gradient(135deg, rgba(131, 58, 180, 0.2), rgba(253, 29, 29, 0.2)); border: 1px solid rgba(252, 176, 69, 0.3);">
                <div style="font-size: 3rem; margin-bottom: 5px;">☄️</div>
                <h2 style="font-size: 1.4rem; color: var(--accent-gold, #ffd700); margin-bottom: 5px;">
                    ${isAr ? 'منصة Meteora Launchpad' : 'Meteora Launchpad'}
                </h2>
                <p style="color: #aaa; font-size: 0.85rem; margin: 0;">
                    ${isAr ? 'تداول توكنات المباريات مباشرة عبر محفظتك داخل التليجرام' : 'Trade match tokens directly via your wallet in Telegram'}
                </p>
            </div>

            <h3 style="color: #fff; font-size: 1rem; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                🔥 ${isAr ? 'أسواق التداول المتاحة' : 'Available Trading Markets'}
            </h3>

            <div id="meteora-matches-list">
                ${matchesList}
            </div>
        </div>
    `;
};

window.openMatchesTradeModal = function() {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        window.renderMeteoraPage(mainContent);
    }
};
                
