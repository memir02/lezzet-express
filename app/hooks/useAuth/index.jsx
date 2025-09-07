import React from "react";
import Cookies from "universal-cookie";
import { useRouter } from "next/navigation";

// Sunucu tarafı doğrulama
const fromServer = async () => {
    const cookies = require("next/headers").cookies;
    const cookieList = cookies();
    const { value: token } = cookieList.get("token") ?? { value: null };

    if (!token) return null;

    try {
        // Sunucu tarafı doğrulama
        const response = await fetch("/api/verify-token", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.user;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

// Kullanıcı doğrulama hook'u
export function useAuth() {
    const [auth, setAuth] = React.useState(null);
    const router = useRouter();

    const getVerifiedtoken = async () => {
        const cookies = new Cookies();
        const token = cookies.get("token");

        if (!token) {
            setAuth(null);
            return;
        }

        try {
            const response = await fetch("/api/verify-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token }),
            });

            if (response.ok) {
                const data = await response.json();
                setAuth(data.user); // Kullanıcı verilerini ayarla
            } else {
                setAuth(null);
                cookies.remove("token"); // Geçersiz token olduğunda çıkış yap
                router.push("/login"); // Kullanıcıyı login sayfasına yönlendir
            }
        } catch (error) {
            setAuth(null);
            cookies.remove("token"); // Hata oluşursa token'ı sil
            router.push("/login");
        }
    };

    React.useEffect(() => {
        getVerifiedtoken();
    }, []);

    return auth;
}

useAuth.fromServer = fromServer;
