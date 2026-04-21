// js/api.js - Módulo de conexión con Google Sheets API

// URL de la API proporcionada por el usuario
const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AWDtjMU01BR3NhHQW9KIWQTN_S_Yix62_Fxl9XTHER99ZTFVClUCeYlxNa3P___z1mDFvK3QvxDlDCoNaVLage4WOzkQBDClvU-pJlz-GPZOyb9F_mkyPCvPDN4toA_w4yu1RcVhM_bpAs1RqIgcSuyV-Znz-hQURfOLK-WsyTVAdBZvt9IKjDm28xqszfBep3gINSEn4NcjsLWS5dRhvi1ZtzsOCLRM27EaWqbXOK2jxGVrawHAYocFac56SyAVXR56aSYokvL5sfVEJyeeaEoJACx4rAUCGQ&lib=M11LhB5pWJBvIQuvDS7eV85y6mqVEV4US";

export const API = {
    /**
     * Obtiene datos mediante GET (Productos, Clientes, etc)
     */
    async get(route) {
        try {
            // Detectar si la URL ya tiene parámetros para usar ? o &
            const separator = API_URL.includes('?') ? '&' : '?';
            const finalUrl = `${API_URL}${separator}route=${route}&t=${Date.now()}`;

            const response = await fetch(finalUrl, {
                method: 'GET',
                redirect: 'follow'
            });

            if (!response.ok) throw new Error("Error en la respuesta de red");
            return await response.json();
        } catch (error) {
            console.error(`API GET Error (${route}):`, error);
            throw error;
        }
    },

    /**
     * Envía datos mediante POST (Ventas, Compras, CRUD)
     */
    async post(route, data) {
        try {
            // Para POST en Google Apps Script, si la URL tiene parámetros, 
            // es mejor usar la URL base sin los parámetros de ECHO si es posible,
            // pero manejamos la URL tal cual para asegurar el envío.
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                // Enviamos como text/plain para evitar problemas de CORS pre-flight
                // Google Apps Script recibirá el JSON en e.postData.contents
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({ route, ...data })
            });

            return { success: true, message: "Datos sincronizados con la nube" };
        } catch (error) {
            console.error(`API POST Error (${route}):`, error);
            throw error;
        }
    }
};

window.API = API; // Exponer globalmente para compatibilidad con el proyecto actual