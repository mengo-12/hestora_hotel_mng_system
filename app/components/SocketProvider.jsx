// 'use client';
// import { io } from "socket.io-client";
// import { createContext, useContext, useEffect, useState } from "react";

// const SocketContext = createContext(null);

// export const SocketProvider = ({ children }) => {
//     const [socket, setSocket] = useState(null);

//     useEffect(() => {
//         const socketInstance = io("http://localhost:3001", {
//             path: "/api/socket",
//         });

//         socketInstance.on("connect", () => {
//             console.log("✅ Connected to socket:", socketInstance.id);
//         });

//         setSocket(socketInstance);

//         return () => {
//             socketInstance.disconnect();
//         };
//     }, []);

//     return (
//         <SocketContext.Provider value={socket}>
//             {children}
//         </SocketContext.Provider>
//     );
// };

// export const useSocket = () => useContext(SocketContext);


'use client';
import { io } from "socket.io-client";
import { createContext, useContext, useEffect, useState } from "react";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = io("http://localhost:3001", {
            path: "/api/socket",
        });

        socketInstance.on("connect", () => {
            console.log("✅ Connected to socket:", socketInstance.id);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
