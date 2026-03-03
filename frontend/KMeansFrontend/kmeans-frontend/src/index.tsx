import React from 'react';
import ReactDOM from 'react-dom/client';
import { ChakraProvider, defineConfig, createSystem, defaultConfig } from '@chakra-ui/react';
import App from './App';
import './index.css';

const system = createSystem(defaultConfig)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    /*<React.StrictMode>*/
        <ChakraProvider value={system}>
            <App />
        </ChakraProvider>
    /*</React.StrictMode>*/
);