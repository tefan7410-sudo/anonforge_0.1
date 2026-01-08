import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Wrench,
  Info,
  AlertCircle,
  Zap
} from "lucide-react";
import { 
  useServiceStatus, 
  useActiveIncidents, 
  useIncidentHistory,
  useMaintenanceMode,
  getOverallStatus,
  type ServiceStatus,
  type StatusIncident 
} from "@/hooks/use-status";
import { formatDistanceToNow, format } from "date-fns";

const statusConfig = {
  operational: { 
    icon: CheckCircle2, 
    color: "text-green-500", 
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    label: "Operational" 
  },
  degraded: { 
    icon: AlertTriangle, 
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    label: "Degraded" 
  },
  partial_outage: { 
    icon: AlertCircle, 
    color: "text-orange-500", 
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    label: "Partial Outage" 
  },
  major_outage: { 
    icon: XCircle, 
    color: "text-red-500", 
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    label: "Major Outage" 
  },
};

const severityConfig = {
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  critical: { icon: XCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  maintenance: { icon: Wrench, color: "text-purple-500", bgColor: "bg-purple-500/10" },
};

function ServiceCard({ service }: { service: ServiceStatus }) {
  const config = statusConfig[service.status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <div>
              <p className="font-medium">{service.display_name}</p>
              <p className="text-xs text-muted-foreground">
                {service.last_check_at 
                  ? `Checked ${formatDistanceToNow(new Date(service.last_check_at), { addSuffix: true })}`
                  : "Not checked yet"
                }
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="outline" className={config.color}>
              {config.label}
            </Badge>
            {service.response_time_ms && (
              <p className="text-xs text-muted-foreground mt-1">
                {service.response_time_ms}ms
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentCard({ incident }: { incident: StatusIncident }) {
  const config = severityConfig[incident.severity];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} border-l-4`} style={{ borderLeftColor: `var(--${incident.severity === 'critical' ? 'destructive' : incident.severity === 'maintenance' ? 'primary' : 'warning'})` }}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 ${config.color} mt-0.5`} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold">{incident.title}</h4>
              <Badge variant="outline" className="text-xs">
                {incident.severity}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{incident.message}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(incident.created_at), "MMM d, yyyy 'at' h:mm a")}
              </span>
              {incident.maintenance_end && (
                <span>
                  Expected end: {format(new Date(incident.maintenance_end), "MMM d, h:mm a")}
                </span>
              )}
              {incident.resolved_at && (
                <span className="text-green-500">
                  Resolved {formatDistanceToNow(new Date(incident.resolved_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverallStatusBanner({ services, maintenanceMode }: { 
  services: ServiceStatus[]; 
  maintenanceMode: { enabled: boolean; message: string | null } | null;
}) {
  if (maintenanceMode?.enabled) {
    return (
      <Card className="bg-purple-500/10 border-purple-500/20">
        <CardContent className="py-6">
          <div className="flex items-center justify-center gap-3">
            <Wrench className="h-8 w-8 text-purple-500" />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-purple-500">Maintenance Mode</h2>
              <p className="text-muted-foreground">
                {maintenanceMode.message || "The site is currently undergoing maintenance."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const overall = getOverallStatus(services);
  const config = statusConfig[overall.status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} ${config.borderColor} border`}>
      <CardContent className="py-6">
        <div className="flex items-center justify-center gap-3">
          <Icon className={`h-8 w-8 ${config.color}`} />
          <div className="text-center">
            <h2 className={`text-2xl font-bold ${config.color}`}>{overall.message}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {services[0]?.last_check_at 
                ? formatDistanceToNow(new Date(services[0].last_check_at), { addSuffix: true })
                : "recently"
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Status() {
  const [historyOpen, setHistoryOpen] = useState(false);
  
  const { data: services = [], isLoading: servicesLoading, refetch } = useServiceStatus();
  const { data: activeIncidents = [], isLoading: incidentsLoading } = useActiveIncidents();
  const { data: incidentHistory = [] } = useIncidentHistory();
  const { data: maintenanceMode } = useMaintenanceMode();

  const isLoading = servicesLoading || incidentsLoading;

  return (
    <>
      <SEOHead
        title="System Status | AnonForge"
        description="Check the current status of AnonForge services including NMKR API, Blockfrost API, and our infrastructure."
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="md" />
              <span className="font-bold text-xl">AnonForge</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container py-8 max-w-4xl">
          <div className="space-y-8">
            {/* Title */}
            <div className="text-center">
              <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
                <Zap className="h-8 w-8 text-primary" />
                System Status
              </h1>
              <p className="text-muted-foreground mt-2">
                Real-time status of AnonForge services and dependencies
              </p>
            </div>

            {/* Overall Status */}
            <OverallStatusBanner services={services} maintenanceMode={maintenanceMode || null} />

            {/* Active Incidents */}
            {activeIncidents.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Active Incidents
                </h3>
                <div className="space-y-3">
                  {activeIncidents.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </div>
              </section>
            )}

            {/* Services Grid */}
            <section>
              <h3 className="text-lg font-semibold mb-4">Services</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="pt-6">
                        <div className="h-12 bg-muted rounded" />
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))
                )}
              </div>
            </section>

            {/* Incident History */}
            {incidentHistory.length > 0 && (
              <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Past Incidents (last 7 days)
                    </span>
                    {historyOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4 space-y-3">
                  {incidentHistory.map((incident) => (
                    <IncidentCard key={incident.id} incident={incident} />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Footer Info */}
            <div className="text-center text-sm text-muted-foreground pt-8 border-t">
              <p>
                Status updates every minute automatically. For urgent issues, contact us on{" "}
                <a 
                  href="https://twitter.com/AnonForge" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Twitter/X
                </a>
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
