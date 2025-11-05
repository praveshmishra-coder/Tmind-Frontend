import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="space-y-6">
    <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Real-time monitoring of manufacturing Assets and Devices</p>
    </div>
    
    <div className="grid grid-cols-4 gap-6">

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Total Departments</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">18</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">18</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold">12</p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Signal Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-red-500">3</p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
