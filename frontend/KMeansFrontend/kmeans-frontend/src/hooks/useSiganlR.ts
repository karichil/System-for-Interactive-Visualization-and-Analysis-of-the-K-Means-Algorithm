import { useEffect, useRef } from 'react';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';

export const useSignalR = (hubUrl: string, onMessageReceived:
                           (data: any) => void, onFinished: (finished: boolean) => void) => {
    const connectionRef = useRef<HubConnection | null>(null);

    useEffect(() => {
        const newConnection = new HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .build();

        newConnection.on("ReceiveResult", (result) => {
            onMessageReceived(result);
        });

        newConnection.on("ReceiveFinished", (finished) => {
            onFinished(finished);
        });

        newConnection.start()
            .then(() => console.log("SignalR Connected!"))
            .catch(err => console.error("SignalR Connection Error: ", err));

        connectionRef.current = newConnection;

        return () => {
            if (connectionRef.current) {
                connectionRef.current.stop();
                connectionRef.current = null;
            }
        };
    }, []);

    return connectionRef.current;
};