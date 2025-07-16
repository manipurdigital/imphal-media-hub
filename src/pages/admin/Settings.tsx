import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Shield, Database, Mail, Bell } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your platform settings and preferences</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input id="platform-name" defaultValue="KANGLEIPAK" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-description">Description</Label>
              <Input id="platform-description" defaultValue="Premium OTT Streaming Platform" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              <Switch id="maintenance-mode" />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security & Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="require-verification">Require Email Verification</Label>
              <Switch id="require-verification" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="two-factor">Two-Factor Authentication</Label>
              <Switch id="two-factor" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password-strength">Strong Password Requirements</Label>
              <Switch id="password-strength" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-user-alerts">New User Alerts</Label>
              <Switch id="new-user-alerts" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="content-alerts">Content Upload Alerts</Label>
              <Switch id="content-alerts" />
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Version:</span>
              <span className="text-sm text-muted-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Database:</span>
              <span className="text-sm text-muted-foreground">PostgreSQL 15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Storage:</span>
              <span className="text-sm text-muted-foreground">Supabase Storage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Last Backup:</span>
              <span className="text-sm text-muted-foreground">2 hours ago</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button>Save Settings</Button>
      </div>
    </div>
  );
};