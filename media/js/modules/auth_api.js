// auth_api.js

export const AuthAPI = {
    async request(endpoint, data = {}) {
        const formData = new FormData();
        for (const k in data) formData.append(k, data[k]);

        const response = await fetch(endpoint, {
            method: "POST",
            credentials: "include" // важно для сессий
        });

        if (!response.ok) throw new Error("Сервер упал в обморок");

        const json = await response.json();
        return json;
    },

    logIn(login, password) {
        return AuthAPI.request("/api/auth/log-in", { login, password });
    },

    logOut() {
        return AuthAPI.request("/api/auth/log-out");
    },

    register(lastname, firstname, middlename, email, phone, login, password) {
        return AuthAPI.request("/api/auth/register", {
            lastname, firstname, middlename, email, phone, login, password
        });
    },

    getName() {
        return AuthAPI.request("/api/auth/get-name");
    },

    getCredentials() {
        return AuthAPI.request("/api/auth/get-credentials");
    },

    getLogInStatus() {
        return AuthAPI.request("/api/auth/get-log-in-status");
    }
};
