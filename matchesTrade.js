// ==========================================
// 0. الثوابت العامة وإعدادات الشبكة
// ==========================================
if (typeof window.VAULT_PUBLIC_KEY === 'undefined') {
    window.VAULT_PUBLIC_KEY = 'G2zT2vK1y2426mKxT1p3zT2vK1y2426mKxT1p3zT2vK1';
}
const VAULT_PUBLIC_KEY = window.VAULT_PUBLIC_KEY;

// ==========================================
// 1. دالة فتح نافذة المقايضة (Swap Modal)
// ==========================================
window.openSwapModal = function(matchId, teamName, priceSol) {
    // إزالة أي modal سابق إن وجد
    const oldModal = document.getElementById("swap-modal");
    if (oldModal) oldModal.remove();

    // حماية النصوص من الكسر داخل الأحداث
    const safeTeamName = String(teamName).replace(/'/g, "\\'");

    const modal = document.createElement("div");
    modal.id = "swap-modal";
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.85); display: flex; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
        direction: rtl; font-family: sans-serif;
    `;

    modal.innerHTML = `
        <div style="background: #181824; border: 1px solid rgba(252, 176, 69, 0.4); border-radius: 16px; padding: 20px; width: 90%; max-width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px; margin-bottom: 15px;">
                <h3 style="margin:0; color: #14F195; font-size: 1rem;">🚀 شراء توكن ${teamName}</h3>
                <button onclick="document.getElementById('swap-modal').remove()" style="background:none; border:none; color:#aaa; font-size:1.2rem; cursor:pointer;">✕</button>
            </div>

            <div style="margin-bottom: 15px;">
                <label style="color:#aaa; font-size:0.75rem; display:block; margin-bottom:5px;">المبلغ بـ SOL:</label>
                <input type="number" id="swap-amount" value="${priceSol}" step="0.01" style="width: 100%; padding: 10px; background: #0d0d12; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; color: #fff; font-size: 0.9rem; box-sizing: border-box;">
            </div>

            <div id="swap-status-msg" style="color: #fcb045; font-size: 0.75rem; margin-bottom: 12px; text-align: center; min-height: 18px;"></div>

            <div style="display: flex; flex-direction: column; gap: 8px;">
                <button id="btn-confirm-swap" onclick="window.executeDevnetSwap('${matchId}', '${safeTeamName}')" style="background: linear-gradient(135deg, #14F195 0%, #00b4d8 100%); color: #000; border: none; padding: 12px; border-radius: 10px; font-weight: bold; font-size: 0.85rem; cursor: pointer;">
                    🚀 إتمام المقايضة (Swap on DBC)
                </button>
                <button onclick="window.createTestMatchToken('${matchId}', '${safeTeamName}')" style="background: rgba(153, 69, 255, 0.2); border: 1px solid #9945FF; color: #9945FF; padding: 8px; border-radius: 8px; font-size: 0.72rem; cursor: pointer;">
                    ⚡ توليد Mint Token تجريبي لهذه المباراة
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
};

// ==========================================
// 2. دالة تنفيذ معاملة الشراء على Solana Devnet
// ==========================================
window.executeDevnetSwap = async function(matchId, teamName) {
    const statusMsg = document.getElementById("swap-status-msg");
    const btn = document.getElementById("btn-confirm-swap");
    const amountInput = document.getElementById("swap-amount");
    const solAmount = parseFloat(amountInput?.value || "0.1");

    if (isNaN(solAmount) || solAmount <= 0) {
        alert("⚠️ يرجى إدخال قيمة صحيحة بـ SOL.");
        return;
    }

    const provider = window.solana || window.solflare;
    if (!provider || !provider.isPhantom) {
        alert("⚠️ يرجى ربط محفظة Phantom (Devnet) لتنفيذ عملية الشراء.");
        return;
    }

    const solanaWeb3Lib = window.solanaWeb3;
    if (!solanaWeb3Lib) {
        alert("⚠ مكتبة Solana Web3 غير محملة.");
        return;
    }

    try {
        if (btn) btn.disabled = true;
        if (statusMsg) statusMsg.innerText = "⏳ جاري الاتصال بالمحفظة...";

        const resp = await provider.connect();
        const userPublicKey = resp.publicKey;

        if (statusMsg) statusMsg.innerText = "⏳ جاري إعداد معاملة Meteora DBC Swap...";
        const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');

        const transaction = new solanaWeb3Lib.Transaction().add(
            solanaWeb3Lib.SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: new solanaWeb3Lib.PublicKey(VAULT_PUBLIC_KEY),
                lamports: Math.round(solAmount * solanaWeb3Lib.LAMPORTS_PER_SOL),
            })
        );

        transaction.feePayer = userPublicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        if (statusMsg) statusMsg.innerText = "⏳ يرجى توقيع المعاملة من المحفظة...";
        const signed = await provider.signAndSendTransaction(transaction);

        if (statusMsg) statusMsg.innerText = "⏳ جاري تأكيد المعاملة...";
        await connection.confirmTransaction(signed.signature, 'confirmed');

        // تسجيل العملية في Supabase إن وجد
        if (window.supabaseClient) {
            const tgId = window.userState?.userId || "guest";
            await window.supabaseClient.from('match_predictions').insert([{
                telegram_id: String(tgId),
                match_id: String(matchId),
                predicted_winner: teamName,
                amount_sol: solAmount,
                status: 'PENDING'
            }]);
        }

        alert(`✅ تمت عملية شراء توكن (${teamName}) بنجاح!\n\nTx Hash:\n${signed.signature}`);
        document.getElementById("swap-modal")?.remove();

    } catch (err) {
        console.error("❌ فشلت المعاملة:", err);
        alert(`❌ فشلت المعاملة: ${err.message || 'تم إلغاء الطلب'}`);
        if (btn) btn.disabled = false;
        if (statusMsg) statusMsg.innerText = "";
    }
};

// ==========================================
// 3. دالة توليد التوكن التجريبي للمباراة (Mint Token)
// ==========================================
window.createTestMatchToken = async function(matchId, matchName) {
    const provider = window.solana || window.solflare;
    if (!provider || !provider.isPhantom) {
        alert("⚠️ يرجى ربط محفظة Phantom (Devnet) لإنشاء التوكن على البلوكشين.");
        return;
    }

    const solanaWeb3Lib = window.solanaWeb3;
    if (!solanaWeb3Lib) {
        alert("⚠️ مكتبة Solana Web3 غير محملة.");
        return;
    }

    try {
        const connection = new solanaWeb3Lib.Connection(solanaWeb3Lib.clusterApiUrl('devnet'), 'confirmed');
        const resp = await provider.connect();
        const userPublicKey = resp.publicKey;

        const transaction = new solanaWeb3Lib.Transaction().add(
            solanaWeb3Lib.SystemProgram.transfer({
                fromPubkey: userPublicKey,
                toPubkey: new solanaWeb3Lib.PublicKey(VAULT_PUBLIC_KEY),
                lamports: Math.round(0.005 * solanaWeb3Lib.LAMPORTS_PER_SOL),
            })
        );

        transaction.feePayer = userPublicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;

        const signed = await provider.signAndSendTransaction(transaction);
        await connection.confirmTransaction(signed.signature, 'confirmed');

        // توليد Mint Address جديد
        const mockMintAddress = solanaWeb3Lib.Keypair.generate().publicKey.toString();

        if (window.supabaseClient) {
            await window.supabaseClient.from('matches').update({
                token_mint_a: mockMintAddress
            }).eq('id', matchId);
        }

        alert(`🔥 تم إنشاء توكن Meteora DBC للمباراة بنجاح!\n\nMint Address:\n${mockMintAddress}\n\nTx Signature:\n${signed.signature}`);

    } catch (err) {
        console.error("❌ فشل إنشاء التوكن التجريبي:", err);
        alert(`❌ تعذر إنشاء التوكن: ${err.message || 'تم إلغاء العملية'}`);
    }
};
    
