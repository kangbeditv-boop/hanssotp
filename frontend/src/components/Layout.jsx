import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({ children, showSidebar = false }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${showSidebar ? 'max-w-6xl' : 'max-w-7xl'} mx-auto w-full`}>
          {children}
        </main>
      </div>
    </div>
  );
}
