"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/trpc";
import {
  Mail,
  Users,
  UserCheck,
  Clock,
  ArrowLeft,
  Loader2,
  Send,
  Plus,
  Trash2,
  Edit,
  X,
  Save,
  Download,
  Eye,
} from "lucide-react";
import Link from "next/link";

type TabType = "subscribers" | "campaigns";

export default function NewsletterAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("subscribers");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<{ subject: string; content: string } | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    content: "",
  });

  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  const utils = api.useUtils();

  const { data: stats, isLoading: statsLoading } = api.newsletter.getStats.useQuery(undefined, {
    enabled: status === "authenticated" && isAdmin,
  });

  const { data: subscribersData, isLoading: subscribersLoading } = api.newsletter.getSubscribers.useQuery(
    { status: "ALL" },
    { enabled: status === "authenticated" && isAdmin }
  );

  const { data: campaignsData, isLoading: campaignsLoading } = api.newsletter.getCampaigns.useQuery(undefined, {
    enabled: status === "authenticated" && isAdmin,
  });

  const { data: exportData } = api.newsletter.exportSubscribers.useQuery(undefined, {
    enabled: false,
  });

  const createCampaignMutation = api.newsletter.createCampaign.useMutation({
    onSuccess: () => {
      utils.newsletter.getCampaigns.invalidate();
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateCampaignMutation = api.newsletter.updateCampaign.useMutation({
    onSuccess: () => {
      utils.newsletter.getCampaigns.invalidate();
      setIsModalOpen(false);
      setEditingId(null);
      resetForm();
    },
  });

  const deleteCampaignMutation = api.newsletter.deleteCampaign.useMutation({
    onSuccess: () => {
      utils.newsletter.getCampaigns.invalidate();
    },
  });

  const sendCampaignMutation = api.newsletter.sendCampaign.useMutation({
    onSuccess: (data) => {
      utils.newsletter.getCampaigns.invalidate();
      if (data.failedCount && data.failedCount > 0) {
        alert(`Nieuwsbrief verstuurd naar ${data.recipientCount} ontvangers (${data.failedCount} mislukt).`);
      } else {
        alert(`Nieuwsbrief succesvol verstuurd naar ${data.recipientCount} ontvangers!`);
      }
    },
    onError: (error) => {
      if (error.message === "no_recipients") {
        alert("Er zijn geen actieve abonnees om naar te versturen.");
      } else {
        alert(`Fout bij versturen: ${error.message}`);
      }
    },
  });

  const resetForm = () => {
    setFormData({ subject: "", content: "" });
    setEditingId(null);
  };

  const handleEditCampaign = (campaign: NonNullable<typeof campaignsData>["campaigns"][0]) => {
    setEditingId(campaign.id);
    setFormData({
      subject: campaign.subject,
      content: campaign.content,
    });
    setIsModalOpen(true);
  };

  const handleSaveCampaign = () => {
    if (editingId) {
      updateCampaignMutation.mutate({
        id: editingId,
        subject: formData.subject,
        content: formData.content,
      });
    } else {
      createCampaignMutation.mutate({
        subject: formData.subject,
        content: formData.content,
      });
    }
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Weet je zeker dat je deze campagne wilt verwijderen?")) {
      deleteCampaignMutation.mutate({ id });
    }
  };

  const handleSendCampaign = (id: string) => {
    if (confirm("Weet je zeker dat je deze nieuwsbrief wilt versturen naar alle abonnees?")) {
      sendCampaignMutation.mutate({ id });
    }
  };

  const handleExport = async () => {
    const data = await utils.newsletter.exportSubscribers.fetch();
    if (!data) return;

    const csv = [
      ["Email", "Naam", "Taal", "Toestemming datum", "Bron"].join(","),
      ...data.map((r) => [r.email, r.name, r.locale, r.consentAt, r.source].join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading") {
    return (
      <div className="section-padding">
        <div className="container-custom">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !isAdmin) {
    router.push("/");
    return null;
  }

  return (
    <div className="section-padding bg-muted/30">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="heading-2 flex items-center gap-3">
                <Mail className="h-7 w-7 text-tea-600" />
                Nieuwsbrief
              </h1>
              <p className="text-muted-foreground">
                Beheer abonnees en verstuur nieuwsbrieven
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="h-16 animate-pulse rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-tea-100 p-3">
                    <Users className="h-6 w-6 text-tea-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalActive}</p>
                    <p className="text-sm text-muted-foreground">Totaal actief</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-green-100 p-3">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.optedInUsers}</p>
                    <p className="text-sm text-muted-foreground">Geregistreerde users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-sm text-muted-foreground">Via footer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-amber-100 p-3">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">In afwachting</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={activeTab === "subscribers" ? "tea" : "outline"}
            onClick={() => setActiveTab("subscribers")}
          >
            <Users className="mr-2 h-4 w-4" />
            Abonnees
          </Button>
          <Button
            variant={activeTab === "campaigns" ? "tea" : "outline"}
            onClick={() => setActiveTab("campaigns")}
          >
            <Send className="mr-2 h-4 w-4" />
            Campagnes
          </Button>
        </div>

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Alle abonnees</CardTitle>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Exporteer CSV
              </Button>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
                </div>
              ) : subscribersData ? (
                <div className="space-y-6">
                  {/* Users with newsletter opt-in */}
                  {subscribersData.users.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-medium text-muted-foreground">
                        Geregistreerde gebruikers ({subscribersData.users.length})
                      </h3>
                      <div className="divide-y rounded-lg border">
                        {subscribersData.users.map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium">{user.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {user.name || "Geen naam"} - {user.locale.toUpperCase()}
                              </p>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800">Account</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Newsletter subscribers */}
                  {subscribersData.subscribers.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-medium text-muted-foreground">
                        Nieuwsbrief abonnees ({subscribersData.subscribers.length})
                      </h3>
                      <div className="divide-y rounded-lg border">
                        {subscribersData.subscribers.map((subscriber) => (
                          <div key={subscriber.id} className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-medium">{subscriber.email}</p>
                              <p className="text-sm text-muted-foreground">
                                {subscriber.name || "Geen naam"} - {subscriber.locale.toUpperCase()}
                                {subscriber.consentAt && (
                                  <> - Bevestigd op {new Date(subscriber.consentAt).toLocaleDateString("nl-BE")}</>
                                )}
                              </p>
                            </div>
                            <Badge
                              className={
                                subscriber.status === "ACTIVE"
                                  ? "bg-green-100 text-green-800"
                                  : subscriber.status === "PENDING"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {subscriber.status === "ACTIVE"
                                ? "Actief"
                                : subscriber.status === "PENDING"
                                ? "In afwachting"
                                : "Uitgeschreven"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {subscribersData.users.length === 0 && subscribersData.subscribers.length === 0 && (
                    <div className="py-12 text-center">
                      <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-4 text-lg font-medium">Geen abonnees</p>
                      <p className="text-muted-foreground">
                        Er zijn nog geen nieuwsbrief abonnees.
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nieuwsbrief campagnes</CardTitle>
              <Button variant="tea" onClick={() => { resetForm(); setIsModalOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe campagne
              </Button>
            </CardHeader>
            <CardContent>
              {campaignsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-tea-600" />
                </div>
              ) : campaignsData && campaignsData.campaigns.length > 0 ? (
                <div className="divide-y rounded-lg border">
                  {campaignsData.campaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4">
                      <div className="flex-1">
                        <p className="font-medium">{campaign.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.sentAt
                            ? `Verstuurd op ${new Date(campaign.sentAt).toLocaleDateString("nl-BE")} naar ${campaign.sentCount} ontvangers`
                            : `Aangemaakt op ${new Date(campaign.createdAt).toLocaleDateString("nl-BE")}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={campaign.sentAt ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}>
                          {campaign.sentAt ? "Verstuurd" : "Concept"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPreviewCampaign({ subject: campaign.subject, content: campaign.content })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!campaign.sentAt && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditCampaign(campaign)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendCampaign(campaign.id)}
                              className="text-tea-600 hover:bg-tea-50"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Send className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">Geen campagnes</p>
                  <p className="text-muted-foreground">
                    Maak je eerste nieuwsbrief campagne aan.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {editingId ? "Campagne Bewerken" : "Nieuwe Campagne"}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="subject">Onderwerp</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Nieuwe seizoensspecials bij Yibei Tea!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Inhoud (HTML toegestaan)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="<h1>Hallo!</h1><p>Ontdek onze nieuwe seizoensspecials...</p>"
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Annuleren
                </Button>
                <Button
                  variant="tea"
                  onClick={handleSaveCampaign}
                  disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending || !formData.subject || !formData.content}
                >
                  {(createCampaignMutation.isPending || updateCampaignMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Save className="mr-2 h-4 w-4" />
                  Opslaan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Preview Modal */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview: {previewCampaign.subject}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setPreviewCampaign(null)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: previewCampaign.content }}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
