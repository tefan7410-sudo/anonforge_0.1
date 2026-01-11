import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Plus,
  Wrench,
  Power,
  Trash2,
  Check
} from "lucide-react";
import { 
  useServiceStatus, 
  useActiveIncidents, 
  useIncidentHistory,
  useMaintenanceMode,
  type ServiceStatus 
} from "@/hooks/use-status";
import {
  useCreateIncident,
  useResolveIncident,
  useUpdateServiceStatus,
  useToggleMaintenanceMode,
  useDeleteIncident,
  useTriggerHealthCheck,
} from "@/hooks/use-admin-status";
import { format } from "date-fns";

const statusConfig = {
  operational: { icon: CheckCircle2, color: "text-success", label: "Operational" },
  degraded: { icon: AlertTriangle, color: "text-warning", label: "Degraded" },
  partial_outage: { icon: AlertCircle, color: "text-warning", label: "Partial Outage" },
  major_outage: { icon: XCircle, color: "text-destructive", label: "Major Outage" },
};

function ServiceStatusRow({ service }: { service: ServiceStatus }) {
  const updateStatus = useUpdateServiceStatus();
  const config = statusConfig[service.status];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${config.color}`} />
        <div>
          <p className="font-medium">{service.display_name}</p>
          <p className="text-xs text-muted-foreground">
            {service.last_check_at 
              ? `Last check: ${format(new Date(service.last_check_at), "MMM d, h:mm a")}`
              : "Not checked"
            }
          </p>
        </div>
      </div>
      <Select
        value={service.status}
        onValueChange={(value) => 
          updateStatus.mutate({ 
            service_name: service.service_name, 
            status: value as ServiceStatus['status'] 
          })
        }
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="operational">Operational</SelectItem>
          <SelectItem value="degraded">Degraded</SelectItem>
          <SelectItem value="partial_outage">Partial Outage</SelectItem>
          <SelectItem value="major_outage">Major Outage</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function CreateIncidentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [severity, setSeverity] = useState<"info" | "warning" | "critical" | "maintenance">("info");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceEnd, setMaintenanceEnd] = useState("");
  
  const { data: services = [] } = useServiceStatus();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  
  const createIncident = useCreateIncident();

  const handleSubmit = () => {
    createIncident.mutate({
      title,
      message,
      severity: isMaintenance ? 'maintenance' : severity,
      is_maintenance: isMaintenance,
      maintenance_end: maintenanceEnd || undefined,
      affected_services: selectedServices,
    }, {
      onSuccess: () => {
        setOpen(false);
        setTitle("");
        setMessage("");
        setSeverity("info");
        setIsMaintenance(false);
        setMaintenanceEnd("");
        setSelectedServices([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Incident
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Incident</DialogTitle>
          <DialogDescription>
            Create a new incident or maintenance announcement.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief incident title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the incident or maintenance..."
              rows={3}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="maintenance"
              checked={isMaintenance}
              onCheckedChange={setIsMaintenance}
            />
            <Label htmlFor="maintenance">This is a maintenance window</Label>
          </div>
          {isMaintenance && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceEnd">Expected End Time</Label>
              <Input
                id="maintenanceEnd"
                type="datetime-local"
                value={maintenanceEnd}
                onChange={(e) => setMaintenanceEnd(e.target.value)}
              />
            </div>
          )}
          {!isMaintenance && (
            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Affected Services</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <Badge
                  key={service.service_name}
                  variant={selectedServices.includes(service.service_name) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedServices(prev => 
                      prev.includes(service.service_name)
                        ? prev.filter(s => s !== service.service_name)
                        : [...prev, service.service_name]
                    );
                  }}
                >
                  {service.display_name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!title || !message || createIncident.isPending}>
            {createIncident.isPending ? "Creating..." : "Create Incident"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SystemStatusTab() {
  const { data: services = [], isLoading: servicesLoading } = useServiceStatus();
  const { data: activeIncidents = [] } = useActiveIncidents();
  const { data: incidentHistory = [] } = useIncidentHistory(30);
  const { data: maintenanceMode } = useMaintenanceMode();
  
  const resolveIncident = useResolveIncident();
  const deleteIncident = useDeleteIncident();
  const toggleMaintenance = useToggleMaintenanceMode();
  const triggerHealthCheck = useTriggerHealthCheck();

  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4">
        <Button
          variant="outline"
          onClick={() => triggerHealthCheck.mutate()}
          disabled={triggerHealthCheck.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${triggerHealthCheck.isPending ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
        <CreateIncidentDialog />
      </div>

      {/* Maintenance Mode Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Maintenance Mode
          </CardTitle>
          <CardDescription>
            Enable maintenance mode to redirect all users to the status page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Power className={`h-5 w-5 ${maintenanceMode?.enabled ? 'text-red-500' : 'text-muted-foreground'}`} />
              <span className="font-medium">
                {maintenanceMode?.enabled ? "Maintenance Mode Active" : "Maintenance Mode Disabled"}
              </span>
            </div>
            <Switch
              checked={maintenanceMode?.enabled || false}
              onCheckedChange={(enabled) => 
                toggleMaintenance.mutate({ 
                  enabled, 
                  message: enabled ? maintenanceMessage || undefined : undefined 
                })
              }
            />
          </div>
          {!maintenanceMode?.enabled && (
            <div className="space-y-2">
              <Label htmlFor="maintenanceMsg">Maintenance Message (optional)</Label>
              <Input
                id="maintenanceMsg"
                value={maintenanceMessage}
                onChange={(e) => setMaintenanceMessage(e.target.value)}
                placeholder="Custom message to show during maintenance..."
              />
            </div>
          )}
          {maintenanceMode?.enabled && maintenanceMode.message && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              Current message: "{maintenanceMode.message}"
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle>Service Status</CardTitle>
          <CardDescription>
            Manually override service status. Automated checks run hourly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {servicesLoading ? (
            <p className="text-muted-foreground">Loading services...</p>
          ) : (
            <div className="divide-y">
              {services.map((service) => (
                <ServiceStatusRow key={service.id} service={service} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Active Incidents ({activeIncidents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeIncidents.length === 0 ? (
            <p className="text-muted-foreground">No active incidents</p>
          ) : (
            <div className="space-y-3">
              {activeIncidents.map((incident) => (
                <div key={incident.id} className="flex items-start justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{incident.title}</p>
                      <Badge variant="outline">{incident.severity}</Badge>
                      {incident.is_maintenance && (
                        <Badge variant="secondary">Maintenance</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{incident.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created: {format(new Date(incident.created_at), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveIncident.mutate(incident.id)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteIncident.mutate(incident.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident History */}
      <Card>
        <CardHeader>
          <CardTitle>Incident History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {incidentHistory.length === 0 ? (
            <p className="text-muted-foreground">No past incidents</p>
          ) : (
            <div className="space-y-2">
              {incidentHistory.map((incident) => (
                <div key={incident.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{incident.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(incident.created_at), "MMM d, yyyy")} - 
                      Resolved {incident.resolved_at && format(new Date(incident.resolved_at), "MMM d, yyyy")}
                    </p>
                  </div>
                  <Badge variant="outline">{incident.severity}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
