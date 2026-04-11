import FinanceTabs from "./FinanceTabs";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FinanceTabs />
      {children}
    </>
  );
}
