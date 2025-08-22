import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import UnifiedAccessGuard from "./components/UnifiedAccessGuard";
import MobileApp from "./components/MobileApp";
import AdminRoute from "./components/AdminRoute";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { VideoManagement } from "./pages/admin/VideoManagement";
import { UserManagement } from "./pages/admin/UserManagement";
import { CollectionsManagement } from "./pages/admin/CollectionsManagement";
import { CategoriesManagement } from "./pages/admin/CategoriesManagement";
import { Analytics } from "./pages/admin/Analytics";
import { Settings } from "./pages/admin/Settings";
import VideoAccessibility from "./pages/admin/VideoAccessibility";
import SubscriptionPlansManagement from "./pages/admin/SubscriptionPlansManagement";
import PlanFeaturesManagement from "./pages/admin/PlanFeaturesManagement";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import VerificationPending from "./components/auth/VerificationPending";
import NotFound from "./pages/NotFound";
import Movies from "./pages/Movies";
import TVShows from "./pages/TVShows";
import MyList from "./pages/MyList";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import Subscribe from "./pages/Subscribe";
import Payment from "./pages/Payment";
import Premium from "./pages/Premium";
import Recommendations from "./pages/Recommendations";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MobileApp>
            <UnifiedAccessGuard>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/verify-email" element={<VerificationPending />} />
              <Route path="/movies" element={<Movies />} />
              <Route path="/tv-shows" element={<TVShows />} />
              <Route path="/my-list" element={<MyList />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />
              <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
              
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
              <Route path="/admin/video-accessibility" element={
                <AdminRoute>
                  <AdminLayout>
                    <VideoAccessibility />
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
                    <CollectionsManagement />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/categories" element={
                <AdminRoute>
                  <AdminLayout>
                    <CategoriesManagement />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/subscription-plans" element={
                <AdminRoute>
                  <AdminLayout>
                    <SubscriptionPlansManagement />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/plan-features" element={
                <AdminRoute>
                  <AdminLayout>
                    <PlanFeaturesManagement />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <AdminRoute>
                  <AdminLayout>
                    <Analytics />
                  </AdminLayout>
                </AdminRoute>
              } />
              <Route path="/admin/settings" element={
                <AdminRoute>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </AdminRoute>
              } />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </UnifiedAccessGuard>
          </MobileApp>
        </BrowserRouter>
      </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;