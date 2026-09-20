import { useState } from "react";
import { Menu } from "lucide-react";

import Sidebar from "./Sidebar";

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-w-0 flex-1">
        {/* Mobile Header */}
        <header className="flex items-center border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Open sidebar"
          >
            <Menu size={24} />
          </button>

          <h2 className="ml-3 text-lg font-bold text-indigo-600">
            SpendMate
          </h2>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}

export default AppLayout;