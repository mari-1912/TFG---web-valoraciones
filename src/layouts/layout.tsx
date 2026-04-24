import type { ReactNode } from "react";
import Footer from "../components/sections/footer";


type PageLayoutProps = {
  children: ReactNode;
};


export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <main className="min-h-screen bg-gray-50">{children}</main>
      <Footer />
    </>
  );
}

