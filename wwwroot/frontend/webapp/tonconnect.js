let tonConnectUI = null;

export function initTonConnect() {
    if (typeof window.TON_CONNECT_UI === 'undefined') {
        console.warn("TON_CONNECT_UI is not defined. TON Connect SDK might have failed to load.");
        return null;
    }
    if (!tonConnectUI) {
        // Sanitize localStorage to fix legacy capitalized "Tonkeeper" references
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (key.startsWith('ton-connect') || key.startsWith('tonconnect'))) {
                    let val = localStorage.getItem(key);
                    if (val && val.includes('Tonkeeper')) {
                        val = val.replace(/Tonkeeper/g, 'tonkeeper');
                        localStorage.setItem(key, val);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to sanitize localStorage for TonConnect:", e);
        }

        tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json'
        });
    }
    return tonConnectUI;
}

export function generateCommentBoc(commentStr) {
    const strBytes = [];
    for (let i = 0; i < commentStr.length; i++) {
        strBytes.push(commentStr.charCodeAt(i));
    }
    const N = strBytes.length;
    const cellDataSize = 1 + 1 + 4 + N; // d1 + d2 + opcode + N
    
    const header = [
        0xb5, 0xee, 0x9c, 0x72, // magic
        0x01,                   // flags (size_of_size = 1)
        0x01,                   // cells_num
        0x01,                   // roots_num
        0x01,                   // complete_lists
        0x00,                   // size_of_cells_data high byte
        cellDataSize            // size_of_cells_data low byte
    ];
    
    const cellData = [
        0x00,                   // d1
        2 * (4 + N),            // d2
        0x00, 0x00, 0x00, 0x00  // 32-bit zero opcode
    ];
    
    const allBytes = header.concat(cellData).concat(strBytes);
    
    let binary = '';
    for (let i = 0; i < allBytes.length; i++) {
        binary += String.fromCharCode(allBytes[i]);
    }
    return btoa(binary);
}

export async function sendDeposit(depositAddress, amountTon, userId) {
    const ui = initTonConnect();
    if (!ui) {
        throw new Error("TON Connect library is not loaded.");
    }
    
    if (!ui.connected) {
        await ui.openModal();
        // Wait until connection is established or modal closed
        while (!ui.connected) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    
    const nanotons = Math.round(parseFloat(amountTon) * 1000000000).toString();
    const commentPayload = generateCommentBoc(userId.toString());
    
    const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 120, // 2 minutes
        messages: [
            {
                address: depositAddress,
                amount: nanotons,
                payload: commentPayload
            }
        ]
    };
    
    return await ui.sendTransaction(transaction);
}

export function getWalletAddress() {
    const ui = initTonConnect();
    if (ui && ui.connected && ui.wallet) {
        const rawAddress = ui.wallet.account.address;
        try {
            return TON_CONNECT_UI.toUserFriendlyAddress(rawAddress);
        } catch {
            return rawAddress;
        }
    }
    return null;
}

export async function disconnectWallet() {
    const ui = initTonConnect();
    if (ui && ui.connected) {
        await ui.disconnect();
    }
}
