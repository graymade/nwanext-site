// Pages render their own shell (lib/render/shell.ts), so this group layout only passes them through.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return children;
}
