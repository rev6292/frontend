import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // グローバルCSSをインポート

// コンテキストプロバイダーをインポート
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { PurchaseListProvider } from "@/contexts/PurchaseListContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Salon Stock Intelligence", // APP_TITLEを直接記述
  description: "AIを活用した在庫管理アプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {/* コンテキストプロバイダーでアプリケーション全体をラップ */}
        <AuthProvider>
          <StoreProvider>
            <PurchaseListProvider>
              {children}
            </PurchaseListProvider>
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}