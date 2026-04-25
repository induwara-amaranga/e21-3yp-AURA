// frontend/src/api/robotWebSocket.js

let socket;

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
    if (socket && socket.readyState === WebSocket.OPEN) {
        // 1. "T1" -> 1 ලෙස අංකයක් බවට පත් කිරීම
        const numericTableId = parseInt(tableId.replace(/\D/g, ""), 10);

        // 2. Backend එක බලාපොරොත්තු වන පරිදි Items සකස් කිරීම
        const mappedItems = items.map(item => ({
            menuItemId: item.id, // Frontend එකේ 'id' යනු Backend එකේ 'menuItemId' ය
            quantity: item.quantity
        }));

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