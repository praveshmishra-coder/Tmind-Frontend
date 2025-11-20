import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from "@/context/authContext";

createRoot(document.getElementById('root')!).render(

    <AuthProvider>
    <Toaster/>
    <App />
    </AuthProvider>

)
