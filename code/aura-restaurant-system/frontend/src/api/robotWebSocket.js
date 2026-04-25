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
        const payload = {
            type: 'PLACE_ORDER',
            tableId: tableId,
            items: items
        };
        socket.send(JSON.stringify(payload));
        console.log("Order sent to Robot");
    } else {
        console.error("WebSocket is not connected!");
    }
};

