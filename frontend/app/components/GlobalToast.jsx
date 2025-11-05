// frontend/app/components/GlobalToast.jsx
'use client';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function GlobalToast() {
    return (
        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnHover
            draggable
            theme="dark"
            className="z-[9999]"
            containerId="dashboard-toast"
        />
    );
}
