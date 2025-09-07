// next-auth.d.ts
// import NextAuth from "next-auth";

// declare module "next-auth" {
//     interface Session {
//         user: {
//             id: string;
//             role: string | null;
//             name?: string | null;
//             email?: string | null;
//             image?: string | null;
//         };
//     }

//     interface User {
//         id: string;
//         role: string | null;
//         phoneNumber?: string;
//     }
// }

// declare module "next-auth/jwt" {
//     interface JWT {
//         id: string;
//         role: string | null;
//     }
// }
// types/next-auth.d.ts
import "next-auth";
import { Role } from "@prisma/client";

declare module "next-auth" {
    interface User {
        id: string;
        email: string;
        name?: string | null;
        role?: Role;
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name?: string | null;
            role?: Role;
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role?: Role;
    }
}
