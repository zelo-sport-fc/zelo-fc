const express = require('express');
const cors = require('cors');
const { Connection, Keypair, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// 2. Solana RPC (Devnet)
const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

app.get('/', (req, res) => {
    res.send('Zelo FC Backend Server is running smoothly 🚀');
});

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
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

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
                error: "⚠️ This wallet address is already linked to another account!"
            });
        }

        const updateData = {};
        updateData[walletColumn] = cleanAddress;

        const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('telegram_id', telegramId);

        if (updateError) throw updateError;

        return res.json({ success: true, message: "Wallet saved successfully" });
    } catch (err) {
        console.error("Save Wallet Error:", err);
        return res.status(500).json({ success: false, error: err.message });
    }
});

// ==========================================
// 3. Claim Tokens On-Chain (Direct SOL Transfer Mode for Hackathon Demo)
// ==========================================
app.post('/api/claim', async (req, res) => {
    const { userWalletAddress, telegramId } = req.body;

    try {
        if (!telegramId || telegramId === 'guest') {
            return res.status(400).json({ success: false, error: "Invalid or missing Telegram ID" });
        }

        if (!supabase) {
            return res.status(500).json({ success: false, error: "Supabase connection not initialized" });
        }

        if (!process.env.TREASURY_PRIVATE_KEY) {
            return res.status(500).json({ 
                success: false, 
                error: "Environment variable TREASURY_PRIVATE_KEY is missing" 
            });
        }

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('points, solana_wallet')
            .eq('telegram_id', telegramId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ success: false, error: "User record not found" });
        }

        const targetWallet = (userWalletAddress || userData.solana_wallet || '').trim();

        if (!targetWallet) {
            return res.status(400).json({ success: false, error: "Solana wallet address is required" });
        }

        const userCoins = Number(userData.points || 0);

        if (userCoins <= 0) {
            return res.status(400).json({ success: false, error: "Insufficient point balance for claim" });
        }

        // 1. تجهيز المفاتيح والعناوين
        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(process.env.TREASURY_PRIVATE_KEY.trim()));
        const playerPubkey = new PublicKey(targetWallet);

        // 2. إنشاء معاملة تحويل SOL مباشرة (إرسال 0.001 SOL كمكافأة تجريبية)
        const solRewardInLamports = 1000000; // 0.001 SOL

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: playerPubkey,
                lamports: solRewardInLamports,
            })
        );

        // 3. التوقيع وإرسال المعاملة على Devnet
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [treasuryKeypair]
        );

        // 4. تصفير نقاط المستخدم بعد نجاح المعاملة
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
            error: err.message || "An error occurred during on-chain transfer" 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
                
