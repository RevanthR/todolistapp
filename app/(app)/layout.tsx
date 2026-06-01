import BottomNav from '@/components/BottomNav';
import PushPrompt from '@/components/PushPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50">
      <ServiceWorkerRegister />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <PushPrompt />
    </div>
  );
}
