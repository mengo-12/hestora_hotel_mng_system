// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import prisma from "../../../../lib/prisma"; // تأكد مسار الاستيراد
// import bcrypt from "bcryptjs";

// export const authOptions = {
//     providers: [
//         CredentialsProvider({
//             name: "Credentials",
//             credentials: {
//                 email: { label: "البريد الإلكتروني", type: "email", placeholder: "example@example.com" },
//                 password: { label: "كلمة المرور", type: "password" },
//             },
//             async authorize(credentials) {
//                 const user = await prisma.user.findUnique({
//                     where: { email: credentials.email },
//                 });

//                 if (!user) {
//                     throw new Error("البريد الإلكتروني غير موجود");
//                 }

//                 const isValid = await bcrypt.compare(credentials.password, user.password);
//                 if (!isValid) {
//                     throw new Error("كلمة المرور غير صحيحة");
//                 }

//                 return { id: user.id, name: user.name, email: user.email };
//             },
//         }),
//     ],
//     session: {
//         strategy: "jwt",
//     },
//     jwt: {
//         secret: process.env.NEXTAUTH_SECRET,
//     },
//     pages: {
//         signIn: "/login",
//     },
//     callbacks: {
//         async jwt({ token, user }) {
//             if (user) {
//                 token.id = user.id;
//             }
//             return token;
//         },
//         async session({ session, token }) {
//             if (token) {
//                 session.user.id = token.id;
//             }
//             return session;
//         },
//     },
//     secret: process.env.NEXTAUTH_SECRET,
// };

// export default NextAuth(authOptions);


import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../../../../lib/prisma"; // تأكد مسار الاستيراد
import bcrypt from "bcryptjs";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "البريد الإلكتروني", type: "email", placeholder: "example@example.com" },
                password: { label: "كلمة المرور", type: "password" },
            },
            async authorize(credentials) {
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                });

                if (!user) {
                    // بدل رمي الخطأ، ارجع null ليظهر رسالة خطأ مناسبة في الواجهة
                    return null;
                }

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    return null;
                }

                return { id: user.id, name: user.name, email: user.email };
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    jwt: {
        secret: process.env.NEXTAUTH_SECRET,
    },
    pages: {
        signIn: "/login",
        error: "/login",  // توجيه أخطاء الدخول لصفحة تسجيل الدخول نفسها
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// تصدير دوال HTTP متوافقة مع App Router
export { handler as GET, handler as POST };
