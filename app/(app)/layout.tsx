import BottomNav from '@/components/BottomNav';
import PushPrompt from '@/components/PushPrompt';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto bg-gray-50">
      <ServiceWorkerRegister />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
      <PushPrompt />
    </div>
  );
}
