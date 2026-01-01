import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FolderOpen, Users, Clock, Loader2, LogOut, Layers } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  last_modified: string;
  created_at: string;
  owner_id: string;
}

interface Invitation {
  id: string;
  project_id: string;
  role: string;
  created_at: string;
  projects: {
    name: string;
    description: string | null;
  };
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [ownedProjects, setOwnedProjects] = useState<Project[]>([]);
  const [sharedProjects, setSharedProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProjects();
    }
  }, [user]);

  const loadProjects = async () => {
    setLoading(true);

    // Load owned projects
    const { data: owned } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user!.id)
      .order('last_modified', { ascending: false });

    // Load shared projects (where user is a member)
    const { data: memberOf } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user!.id);

    if (memberOf && memberOf.length > 0) {
      const projectIds = memberOf.map(m => m.project_id);
      const { data: shared } = await supabase
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .order('last_modified', { ascending: false });
      setSharedProjects(shared || []);
    }

    // Load pending invitations
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user!.id)
      .single();

    if (profile) {
      const { data: invites } = await supabase
        .from('project_invitations')
        .select('id, project_id, role, created_at, projects:project_id(name, description)')
        .eq('email', profile.email)
        .eq('status', 'pending');
      setInvitations(invites as unknown as Invitation[] || []);
    }

    setOwnedProjects(owned || []);
    setLoading(false);
  };

  const ProjectCard = ({ project, isOwner = true }: { project: Project; isOwner?: boolean }) => (
    <Link to={`/project/${project.id}`}>
      <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="font-display text-lg group-hover:text-primary transition-colors">
              {project.name}
            </CardTitle>
            <Badge variant={project.is_public ? 'secondary' : 'outline'} className="text-xs">
              {project.is_public ? 'Public' : 'Private'}
            </Badge>
          </div>
          <CardDescription className="line-clamp-2">
            {project.description || 'No description'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(project.last_modified), { addSuffix: true })}
            </span>
            {!isOwner && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                Shared
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/50 py-12">
      <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground/50" />
      <h3 className="mb-1 font-display text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Layers className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">LayerForge</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your layer generation projects</p>
          </div>
          <Button asChild>
            <Link to="/project/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>

        {invitations.length > 0 && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 font-display text-lg">
                <Users className="h-5 w-5 text-primary" />
                Pending Invitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-4"
                  >
                    <div>
                      <p className="font-medium">{invite.projects.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as {invite.role}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Decline
                      </Button>
                      <Button size="sm">Accept</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="owned" className="space-y-6">
          <TabsList>
            <TabsTrigger value="owned">
              My Projects
              {ownedProjects.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {ownedProjects.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared with me
              {sharedProjects.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {sharedProjects.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : ownedProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ownedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} isOwner />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No projects yet"
                description="Create your first project to start generating unique profile pictures"
              />
            )}
          </TabsContent>

          <TabsContent value="shared">
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2].map((i) => (
                  <Card key={i} className="border-border/50">
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sharedProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sharedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} isOwner={false} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No shared projects"
                description="Projects shared with you will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
