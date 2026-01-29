import type { ReactNode } from "react";
import { Header } from "../components/sections/header";
import Footer from "../components/sections/footer";


type PageLayoutProps = {
  children: ReactNode;
};


export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pt-6">{children}</main>
      <Footer />
    </>
  );
}


