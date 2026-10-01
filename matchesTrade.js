// ==========================================
// ⚽ Zelo Sport - Matches & Trading Module
// ==========================================

// بيانات تجريبية للمباريات المتاحة للتداول
window.sampleMatchesData = [
    { id: 'm1', teamA: 'Real Madrid', teamB: 'Barcelona' },
    { id: 'm2', teamA: 'Liverpool', teamB: 'Manchester City' },
    { id: 'm3', teamA: 'Bayern Munich', teamB: 'PSG' }
];

// دالة تنفيذ الشراء والتداول عبر Meteora
window.handleBuyMatchToken = async function(matchId, teamName, teamChoice) {
    try {
        const userWallet = localStorage.getItem('solana_wallet');
        if (!userWallet) {
            alert('⚠️ يرجى ربط محفظة Solana أولاً من صفحة المحفظة!');
            return;
        }

        const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest';
        
        console.log(`جاري طلب التداول لفريق: ${teamName} (Match: ${matchId})...`);

        // رابط الباك إند الخاص بك على Render أو السيرفر الخاص بك
        const BACKEND_URL = 'https://YOUR-BACKEND-URL.com'; 

        const response = await fetch(`${BACKEND_URL}/api/matches/create-market`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchId: matchId,
                teamA: teamChoice === 'A' ? teamName : 'Team A',
                teamB: teamChoice === 'B' ? teamName : 'Team B'
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ تم إنشاء/تفعيل سوق التوكن لفريق ${teamName} بنجاح!\nMint: ${teamChoice === 'A' ? data.tokenAMint : data.tokenBMint}`);
        } else {
            alert(`❌ فشل التداول: ${data.error}`);
        }
    } catch (err) {
        console.error('Trading Error:', err);
        alert('حدث خطأ أثناء الاتصال بالباك إند');
    }
};

// دالة توليد بطاقة مباراة تحتوي على أزرار التداول
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

// ==========================================
// 🚀 الدوال المطلوبة للربط مع الصفحة الرئيسية
// ==========================================

// دالة عرض الصفحة الرئيسية لـ Meteora
window.renderMeteoraPage = function(container) {
    if (!container) return;
    
    const isAr = typeof userState !== 'undefined' && userState.lang === 'ar';
    const matchesList = window.sampleMatchesData.map(match => window.renderMatchTradeCard(match)).join('');

    container.innerHTML = `
        <div style="padding: 10px;">
            <div class="card" style="text-align: center; padding: 20px 15px; margin-bottom: 15px; background: linear-gradient(135deg, rgba(131, 58, 180, 0.2), rgba(253, 29, 29, 0.2)); border: 1px solid rgba(252, 176, 69, 0.3);">
                <div style="font-size: 3rem; margin-bottom: 5px;">☄️</div>
                <h2 style="font-size: 1.4rem; color: var(--accent-gold); margin-bottom: 5px;">
                    ${isAr ? 'منصة Meteora Launchpad' : 'Meteora Launchpad'}
                </h2>
                <p style="color: #aaa; font-size: 0.85rem; margin: 0;">
                    ${isAr ? 'تداول توكنات المباريات عبر نظام السيولة الديناميكي DBC' : 'Trade match tokens via Dynamic Bonding Curve'}
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

// دالة النافذة المنبثقة (Fallback)
window.openMatchesTradeModal = function() {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
        window.renderMeteoraPage(mainContent);
    }
};
