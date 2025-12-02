import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from "@/context/AuthContext.tsx";
import "intro.js/minified/introjs.min.css";

createRoot(document.getElementById('root')!).render(

    <AuthProvider>
    <App />
    </AuthProvider>

)
