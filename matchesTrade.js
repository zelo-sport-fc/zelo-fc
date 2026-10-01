// ==========================================
// ⚽ Zelo Sport - Matches & Trading Module
// ==========================================

// دالة تنفيذ الشراء والتداول عبر Meteora
window.handleBuyMatchToken = async function(matchId, teamName, teamChoice) {
    try {
        const userWallet = localStorage.getItem('solana_wallet');
        if (!userWallet) {
            alert('⚠️ يرجى ربط محفظة Solana أولاً من صفحة المحفظة!');
            return;
        }

        const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || 'guest';
        
        // إظهار تنبيه أو مؤشر جاري التحميل
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
        <div class="glass-club-card" style="flex-direction: column; align-items: stretch; gap: 10px; padding: 14px; margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
                <span style="font-weight: 800; color: #fff; font-size: 0.9rem;">⚽ ${match.teamA} VS ${match.teamB}</span>
                <span style="font-size: 0.7rem; color: #14F195; background: rgba(20,241,149,0.1); padding: 3px 8px; border-radius: 6px;">LIVE MARKET</span>
            </div>
            
            <div style="display: flex; gap: 8px; margin-top: 4px;">
                <button 
                    onclick="window.handleBuyMatchToken('${match.id}', '${match.teamA}', 'A')" 
                    style="flex: 1; background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 8px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
                    شراء ${match.teamA} 📈
                </button>
                <button 
                    onclick="window.handleBuyMatchToken('${match.id}', '${match.teamB}', 'B')" 
                    style="flex: 1; background: linear-gradient(135deg, #9945FF 0%, #f72585 100%); color: #fff; border: none; padding: 8px; border-radius: 10px; font-weight: 800; font-size: 0.75rem; cursor: pointer;">
                    شراء ${match.teamB} 📈
                </button>
            </div>
        </div>
    `;
};
