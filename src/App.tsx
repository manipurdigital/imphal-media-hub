import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AdminRoute from "./components/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { VideoManagement } from "./pages/admin/VideoManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerificationPending from "./components/auth/VerificationPending";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/verify-email" element={<VerificationPending />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/videos" element={
              <AdminRoute>
                <AdminLayout>
                  <VideoManagement />
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/users" element={
              <AdminRoute>
                <AdminLayout>
                  <UserManagement />
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/collections" element={
              <AdminRoute>
                <AdminLayout>
                  <div>Collections Management - Coming Soon</div>
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/categories" element={
              <AdminRoute>
                <AdminLayout>
                  <div>Categories Management - Coming Soon</div>
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/analytics" element={
              <AdminRoute>
                <AdminLayout>
                  <div>Analytics - Coming Soon</div>
                </AdminLayout>
              </AdminRoute>
            } />
            <Route path="/admin/settings" element={
              <AdminRoute>
                <AdminLayout>
                  <div>Settings - Coming Soon</div>
                </AdminLayout>
              </AdminRoute>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
