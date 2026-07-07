import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useUIStore } from '@/store/uiStore';
import clsx from 'clsx';

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string; path?: string }[];
}

export function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-bg-base">
      <Sidebar />
      <Navbar title={title} breadcrumbs={breadcrumbs} />

      <main
        className="min-h-screen transition-all duration-300"
        style={{
          paddingTop: 'var(--navbar-height)',
          paddingLeft: sidebarOpen ? 'var(--sidebar-width)' : '0',
        }}
      >
        <div className="p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AppLayout;
