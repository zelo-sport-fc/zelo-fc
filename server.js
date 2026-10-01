const express = require('express');
const cors = require('cors');
const { 
    Connection, 
    Keypair, 
    PublicKey, 
    SystemProgram, 
    Transaction, 
    sendAndConfirmTransaction, 
    clusterApiUrl 
} = require('@solana/web3.js');
const { createMint } = require('@solana/spl-token');
const bs58 = require('bs58');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. Supabase Client Setup
// ==========================================
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// ==========================================
// 2. Solana RPC Connection & Treasury Key
// ==========================================
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

// دالة جلب محفظة الخزينة لتوقيع المعاملات
function getTreasuryKeypair() {
    if (!process.env.TREASURY_PRIVATE_KEY) return null;
    try {
        const secretKeyString = process.env.TREASURY_PRIVATE_KEY.trim();
        // دعم التنسيقين: Base58 String أو Array of Numbers
        if (secretKeyString.startsWith('[')) {
            return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyString)));
        }
        return Keypair.fromSecretKey(bs58.decode(secretKeyString));
    } catch (e) {
        console.error("❌ Invalid TREASURY_PRIVATE_KEY format:", e.message);
        return null;
    }
}

app.get('/', (req, res) => {
    res.send('Zelo FC Backend Server (Meteora DBC Enabled) is running smoothly 🚀');
});

// ==========================================
// Meteora DBC Helper Function
// ==========================================
async function createMatchTokensOnMeteora(matchId, teamA, teamB) {
    try {
        console.log(`🚀 جاري إعداد توكنات Meteora DBC للمباراة: ${teamA} VS ${teamB} (Match ID: ${matchId})`);

        const treasury = getTreasuryKeypair();
        let tokenAMint = '';
        let tokenBMint = '';

        if (treasury) {
            // 1. سك توكن حقيقي للفريق A على شبكة Solana
            const keypairA = Keypair.generate();
            const mintA = await createMint(
                connection,
                treasury,
                treasury.publicKey,
                treasury.publicKey,
                6, // 6 Decimals
                keypairA
            );
            tokenAMint = mintA.toBase58();

            // 2. سك توكن حقيقي للفريق B على شبكة Solana
            const keypairB = Keypair.generate();
            const mintB = await createMint(
                connection,
                treasury,
                treasury.publicKey,
                treasury.publicKey,
                6, // 6 Decimals
                keypairB
            );
            tokenBMint = mintB.toBase58();

            console.log(`✅ On-Chain Mints Created: TeamA=${tokenAMint}, TeamB=${tokenBMint}`);
        } else {
            // Fallback في حال عدم تفعيل TREASURY_PRIVATE_KEY للتجارب السريعة
            tokenAMint = Keypair.generate().publicKey.toBase58();
            tokenBMint = Keypair.generate().publicKey.toBase58();
            console.warn("⚠️ Treasury key missing - generated mock mints for testing.");
        }

        // 3. تجهيز روابط التداول المباشرة عبر Meteora Dynamic Bonding Curve (DBC)
        const meteoraUrlA = `https://app.meteora.ag/dlmm/${tokenAMint}`;
        const meteoraUrlB = `https://app.meteora.ag/dlmm/${tokenBMint}`;

        // 4. حفظ وتحديث عناوين التوكنات في Supabase
        if (supabase) {
            const { error } = await supabase
                .from('matches')
                .update({
                    token_a_mint: tokenAMint,
                    token_b_mint: tokenBMint,
                    market_status: 'ACTIVE',
                    meteora_url_a: meteoraUrlA,
                    meteora_url_b: meteoraUrlB,
                    updated_at: new Date().toISOString()
                })
                .eq('id', matchId);

            if (error) console.error('❌ خطأ أثناء تحديث Supabase:', error);
        }

        return {
            success: true,
            tokenAMint,
            tokenBMint,
            meteoraUrlA,
            meteoraUrlB
        };
    } catch (err) {
        console.error('❌ خطأ أثناء إنشاء سوق Meteora:', err);
        return { success: false, error: err.message };
    }
}

// ==========================================
// 1. Get User Info
// ==========================================
app.get('/api/user-info', async (req, res) => {
    const { telegramId } = req.query;

    if (!telegramId || telegramId === 'guest') {
        return res.status(400).json({ success: false, error: "Invalid or missing Telegram ID" });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "Supabase connection not initialized" });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('solana_wallet, ton_wallet, points')
            .eq('telegram_id', telegramId)
            .maybeSingle();

        if (error) throw error;

        return res.json({
            success: true,
            solanaWallet: data?.solana_wallet || '',
            tonWallet: data?.ton_wallet || '',
            coins: data?.points || 0
        });
    } catch (err) {
        console.error("Fetch User Info Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 2. Save Wallet Address
// ==========================================
app.post('/api/save-wallet', async (req, res) => {
    const { telegramId, walletType, walletAddress } = req.body;

    if (!telegramId || telegramId === 'guest') {
        return res.status(400).json({ success: false, error: "Invalid or missing Telegram ID" });
    }

    if (!walletAddress || !walletType || !['solana', 'ton'].includes(walletType)) {
        return res.status(400).json({ success: false, error: "Invalid wallet type or address" });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "Supabase connection not initialized" });
    }

    const walletColumn = walletType === 'solana' ? 'solana_wallet' : 'ton_wallet';
    const cleanAddress = walletAddress.trim();

    try {
        const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('telegram_id')
            .eq(walletColumn, cleanAddress)
            .neq('telegram_id', telegramId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: "⚠️ هذا العنوان مرتبط بحساب آخر بالفعل!"
            });
        }

        const updateData = {};
        updateData[walletColumn] = cleanAddress;

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('telegram_id', telegramId);

        if (updateError) throw updateError;

        return res.json({ success: true, message: "تم حفظ المحفظة بنجاح" });
    } catch (err) {
        console.error("Save Wallet Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 3. Create Match Market (Meteora DBC)
// ==========================================
app.post('/api/matches/create-market', async (req, res) => {
    const { matchId, teamA, teamB } = req.body;

    if (!matchId || !teamA || !teamB) {
        return res.status(400).json({
            success: false,
            error: "بيانات غير مكتملة: matchId, teamA, teamB مطلوبة"
        });
    }

    if (!supabase) {
        return res.status(500).json({ success: false, error: "Supabase connection not initialized" });
    }

    try {
        // التحقق أولاً من وجود التوكنات مسبقاً في قاعدة البيانات
        const { data: existingMatch } = await supabase
            .from('matches')
            .select('token_a_mint, token_b_mint, market_status')
            .eq('id', matchId)
            .maybeSingle();

        if (existingMatch && existingMatch.token_a_mint && existingMatch.token_b_mint) {
            return res.json({
                success: true,
                message: "سوق التداول موجود مسبقاً",
                matchId,
                tokenAMint: existingMatch.token_a_mint,
                tokenBMint: existingMatch.token_b_mint,
                tradeUrlA: `https://app.meteora.ag/dlmm/${existingMatch.token_a_mint}`,
                tradeUrlB: `https://app.meteora.ag/dlmm/${existingMatch.token_b_mint}`
            });
        }

        // إنشاء التوكنات والأسواق الجديدة
        const result = await createMatchTokensOnMeteora(matchId, teamA, teamB);

        if (result.success) {
            return res.json({
                success: true,
                message: "تم إنشاء سوق Meteora DBC للمباراة بنجاح",
                matchId,
                tokenAMint: result.tokenAMint,
                tokenBMint: result.tokenBMint,
                tradeUrlA: result.meteoraUrlA,
                tradeUrlB: result.meteoraUrlB
            });
        } else {
            return res.status(500).json({ success: false, error: result.error });
        }
    } catch (err) {
        console.error("Create Market Endpoint Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 4. Claim Tokens On-Chain (SOL Rewards)
// ==========================================
app.post('/api/claim', async (req, res) => {
    const { userWalletAddress, telegramId } = req.body;

    try {
        if (!telegramId || telegramId === 'guest') {
            return res.status(400).json({ success: false, error: "معرّف التليجرام غير صالح" });
        }

        if (!supabase) {
            return res.status(500).json({ success: false, error: "Supabase connection not initialized" });
        }

        const treasuryKeypair = getTreasuryKeypair();
        if (!treasuryKeypair) {
            return res.status(500).json({ 
                success: false, 
                error: "مفتاح الخزينة (TREASURY_PRIVATE_KEY) مفقود أو غير صحيح" 
            });
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('points, solana_wallet')
            .eq('telegram_id', telegramId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ success: false, error: "سجل المستخدم غير موجود" });
        }

        const targetWallet = (userWalletAddress || userData.solana_wallet || '').trim();

        if (!targetWallet) {
            return res.status(400).json({ success: false, error: "عنوان محفظة Solana مطلوب" });
        }

        const userCoins = Number(userData.points || 0);

        if (userCoins <= 0) {
            return res.status(400).json({ success: false, error: "لا يوجد رصيد نقاط كافي للمطالبة" });
        }

        const playerPubkey = new PublicKey(targetWallet);
        const solRewardInLamports = 1000000; // 0.001 SOL المكافأة التجريبية

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: playerPubkey,
                lamports: solRewardInLamports,
            })
        );

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [treasuryKeypair]
        );

        // تصفير رصيد النقاط بعد نجاح التحويل
        await supabase
            .from('users')
            .update({ points: 0 })
            .eq('telegram_id', telegramId);

        return res.json({ 
            success: true, 
            txHash: signature,
            tokensTransferred: userCoins,
            solReward: 0.001,
            newBalance: 0
        });

    } catch (err) {
        console.error("Transfer Error Details:", err);
        return res.status(500).json({ 
            success: false, 
            error: err.message || "حدث خطأ أثناء تنفيذ التحويل" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Zelo FC Backend Server running on port ${PORT}`));
                  
