// frontend/src/api/robotWebSocket.js

let socket;

function normalizeTableId(rawTableId) {
    if (rawTableId == null) return null;
    if (typeof rawTableId === 'number') {
        return Number.isInteger(rawTableId) && rawTableId > 0 ? rawTableId : null;
    }

    const text = String(rawTableId).trim();
    const digits = text.replaceAll(/\D/g, '');
    if (!digits) return null;

    const parsed = Number.parseInt(digits, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export const connectToRobot = () => {
    // Raspberry Pi එකේ IP ලිපිනය මෙතනට ලබා දෙන්න.
    // උදා: 'ws://192.168.1.100:8765'
    socket = new WebSocket('ws://localhost:8765');

    socket.onopen = () => {
        console.log("Connected to AURA Robot Controller");
    };

    socket.onmessage = (event) => {
        console.log("Message from Robot:", event.data);
    };

    socket.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
};

export const sendOrderToRobot = (tableId, items) => {
    if (socket?.readyState === WebSocket.OPEN) {
        const numericTableId = normalizeTableId(tableId);
        if (!numericTableId) {
            console.error('Cannot send order: invalid tableId', tableId);
            return;
        }

        // Backend එක බලාපොරොත්තු වන පරිදි Items සකස් කිරීම
        const mappedItems = items.map(item => ({
            menuItemId: item.id, // Frontend එකේ 'id' යනු Backend එකේ 'menuItemId' ය
            quantity: item.quantity
        })).filter(item => Number.isInteger(item.menuItemId) && item.quantity > 0);

        if (!mappedItems.length) {
            console.error('Cannot send order: no valid order items');
            return;
        }

        const payload = {
            type: 'PLACE_ORDER',
            tableId: numericTableId,
            items: mappedItems
        };

        socket.send(JSON.stringify(payload));
        console.log("Mapped Order sent to Robot:", payload);
    } else {
        console.error("WebSocket is not connected!");
    }
};

