"use client";

import React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus, Trash2, CalendarDays, RefreshCw } from "lucide-react";
import { SectionDialog } from "./section-dialog";
import { SectionDebug } from "./section-debug";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useSchoolsWithRefresh } from "@/hooks/use-schools-with-refresh";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Section } from "./types";

/**
 * Interface for the ServiceFormProps
 */
interface ServiceFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Service Form Component
 */
export function ServiceForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: ServiceFormProps) {
  const { toast } = useToast();
  const {
    schools,
    loading: schoolsLoading,
    error: schoolsError,
    refreshData: refreshSchools,
  } = useSchoolsWithRefresh();

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    price: initialData?.price || "",
    dateRange: "", // We're removing this functionality
    icon: "/placeholder.svg?height=40&width=40", // Default placeholder icon
    // Additional fields from the UI
    location: initialData?.location || "",
    participants: initialData?.participants || "",
    description: initialData?.description || "",
    status: initialData?.status || "active",
    schoolId: initialData?.schoolId || initialData?.schoolid || undefined, // New field for school selection
    sport: initialData?.sport || undefined,
    isongoing: initialData?.isongoing || false,
  });

  // State for sections (previously sessions)
  const [sections, setSections] = useState<Section[]>([]);
  const [showSectionDialog, setShowSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  const isEditing = !!initialData;

  // Load existing sessions when editing
  React.useEffect(() => {
    if (initialData?.sessions && Array.isArray(initialData.sessions)) {
      console.log("Loading existing sessions for editing:", initialData.sessions);
      
      // Convert database sessions to Section format
      const convertedSections = initialData.sessions.map((session: any) => ({
        id: session.sessionid?.toString() || Math.random().toString(36).substr(2, 9),
        startDate: new Date(session.startdate),
        endDate: session.enddate ? new Date(session.enddate) : undefined,
        startTime: session.starttime,
        endTime: session.endtime,
        daysOfWeek: session.daysofweek ? [session.daysofweek] : [],
        repeat: session.repeat || "none",
        duration: "1 hr", // Default duration
        staffId: session.coachid || "",
        recurringDates: [], // Would need to calculate this from repeat pattern
      }));
      
      setSections(convertedSections);
    }
  }, [initialData]);

  /**
   * Handles form input changes
   */
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Opens the section dialog for editing
   */
  const handleEditSection = (sectionId: string) => {
    console.log("Opening edit dialog for section:", sectionId);
    setEditingSectionId(sectionId);
    setShowSectionDialog(true);
  };

  const handleSaveSection = React.useCallback(
    (section: Section) => {
      console.log("=== handleSaveSection called ===");
      console.log("Section data received:", section);
      console.log("Current sections before save:", sections);
      console.log("Editing section ID:", editingSectionId);

      try {
        if (editingSectionId) {
          // Update existing section
          console.log("Updating existing section with ID:", editingSectionId);
          setSections((prevSections) => {
            const updatedSections = prevSections.map((s) =>
              s.id === editingSectionId ? section : s
            );
            console.log("Updated sections array:", updatedSections);
            return updatedSections;
          });
          setEditingSectionId(null);
        } else {
          // Add new section
          console.log("Adding new section");
          setSections((prevSections) => {
            const newSections = [...prevSections, section];
            console.log("New sections array:", newSections);
            return newSections;
          });
        }

        setShowSectionDialog(false);

        toast({
          title: "Sección guardada",
          description: editingSectionId
            ? "La sección ha sido actualizada"
            : "Nueva sección añadida al servicio",
        });

        console.log("Section save completed successfully");
      } catch (error) {
        console.error("Error in handleSaveSection:", error);
        toast({
          title: "Error",
          description: "Error saving section",
          variant: "destructive",
        });
      }
    },
    [editingSectionId, sections, toast]
  );

  /**
   * Handles deleting a section
   */
  const handleDeleteSection = (sectionId: string) => {
    console.log("Deleting section:", sectionId);
    setSections(sections.filter((s) => s.id !== sectionId));

    toast({
      title: "Sección eliminada",
      description: "La sección ha sido eliminada del servicio",
    });
  };

  /**
   * Gets the section being edited, if any
   */
  const getEditingSection = () => {
    if (!editingSectionId) return null;
    return sections.find((s) => s.id === editingSectionId) || null;
  };

  /**
   * Gets the selected school name
   */
  const getSelectedSchoolName = () => {
    if (!formData.schoolId) return "";
    const school = schools.find((s) => s.schoolid === formData.schoolId);
    return school ? school.name : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    console.log("Sections data:", sections);

    // Basic validation
    if (!formData.name) {
      toast({
        title: "Error",
        description: "El nombre del servicio es obligatorio",
        variant: "destructive",
      });
      return;
    }

    if (!formData.schoolId) {
      toast({
        title: "Error",
        description: "You must select a school",
        variant: "destructive",
      });
      return;
    }

    // Validate that there's at least one section
    if (sections.length === 0) {
      toast({
        title: "Error",
        description: "Debe añadir al menos una sección al servicio",
        variant: "destructive",
      });
      return;
    }

    // Convert price to float and prepare data for submission
    const dataToSubmit = {
      ...formData,
      price: Number.parseFloat(formData.price.toString()) || 0, // Ensure price is a float
      participants: Number.parseInt(formData.participants.toString()) || 20, // Ensure participants is a number
      sections: sections,
    };

    console.log("Final data to submit:", dataToSubmit);

    try {
      await onSubmit(dataToSubmit);
    } catch (error) {
      console.error("Error submitting form:", error);
      // Error handling is done in the parent component
    }
  };

  /**
   * Formats the repeat pattern for display
   */
  const formatRepeatPattern = (repeat: string) => {
    if (repeat === "none") return "No se repite";
    if (repeat === "weekly") return "Semanal";
    if (repeat === "biweekly") return "Cada 2 semanas";
    if (repeat === "monthly") return "Mensual";
    return repeat;
  };

  /**
   * Gets the total number of scheduled dates for all sections
   */
  const getTotalScheduledDates = () => {
    return sections.reduce((total, section) => {
      if (section.repeat === "none") return total + 1;
      return total + (section.recurringDates?.length || 1);
    }, 0);
  };

  return (
    <Card className="w-full border-0 shadow-none">
      <form onSubmit={handleSubmit}>
        <CardHeader className="px-0 pt-0">
          <div className="flex items-center justify-between">
            <CardTitle>
              {isEditing ? "Editar Servicio" : "Añadir Nuevo Servicio"}
            </CardTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? "Ocultar Debug" : "Mostrar Debug"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-0">
          {/* Overview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Servicio *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="VOLLEYBALL DEERWOOD"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Precio *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  placeholder="125.00"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="LATE WINTER SEASON&#10;EVERY MONDAY&#10;FOR SIX WEEKS"
                rows={3}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport Type</Label>
              <Select
                value={formData.sport || ""}
                onValueChange={(value) => handleChange("sport", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar deporte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Volleyball">Volleyball</SelectItem>
                  <SelectItem value="Tennis">Tennis</SelectItem>
                  <SelectItem value="Pickleball">Pickleball</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isactive">Active</Label>
                  <Switch
                    id="isactive"
                    checked={formData.status === "active"}
                    onCheckedChange={(checked) => handleChange("status", checked ? "active" : "inactive")}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  El servicio está activo y disponible para inscripciones
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="isongoing">In Progress</Label>
                  <Switch
                    id="isongoing"
                    checked={formData.isongoing}
                    onCheckedChange={(checked) => handleChange("isongoing", checked)}
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  El servicio está actualmente en curso
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* School Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">School</h3>
            <div className="space-y-2">
              <Label htmlFor="school">Seleccionar Escuela *</Label>
              
              {schoolsError && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription className="flex items-center justify-between">
                    <span>Error al cargar escuelas: {schoolsError}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={refreshSchools}
                      disabled={schoolsLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${schoolsLoading ? 'animate-spin' : ''}`} />
                      Reintentar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
              
              <Select
                value={formData.schoolId?.toString() || ""}
                onValueChange={(value) =>
                  handleChange("schoolId", Number.parseInt(value))
                }
                disabled={isLoading || (schoolsLoading && schools.length === 0) || !!schoolsError}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      schoolsLoading && schools.length === 0
                        ? "Cargando escuelas..."
                        : schoolsError
                        ? "Error cargando escuelas - Haz clic en Reintentar"
                        : schools.length === 0
                        ? "No hay escuelas disponibles"
                        : "Seleccionar escuela"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((school) => (
                    <SelectItem
                      key={school.schoolid}
                      value={school.schoolid.toString()}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{school.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {school.location}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.schoolId && !schoolsError && (
                <p className="text-sm text-muted-foreground">
                  Escuela seleccionada:{" "}
                  <strong>{getSelectedSchoolName()}</strong>
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Sections Management - This replaces the Schedule Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Secciones</h3>
              <div className="flex items-center gap-2">
                {sections.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>
                      {sections.length} section
                      {sections.length !== 1 ? "s" : ""} •{" "}
                      {getTotalScheduledDates()} scheduled date
                      {getTotalScheduledDates() !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  onClick={() => {
                    console.log("Opening new section dialog");
                    setEditingSectionId(null);
                    setShowSectionDialog(true);
                  }}
                  size="sm"
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Section
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-8 border border-dashed rounded-lg text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">No sections</h4>
                    <p className="text-sm text-muted-foreground">
                      Add sections to this service so customers can register.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-2 bg-transparent"
                    onClick={() => {
                      console.log(
                        "Opening new section dialog from empty state"
                      );
                      setEditingSectionId(null);
                      setShowSectionDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Añadir Sección
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((section) => (
                    <div
                      key={section.id}
                      className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Sesión {section.daysOfWeek.join(", ")}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {formatRepeatPattern(section.repeat)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Inicio:{" "}
                          {format(section.startDate, "EEE, d MMM yyyy", {
                            locale: es,
                          })}{" "}
                          • {section.startTime} - {section.endTime}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Instructor: {section.staffId}
                        </div>
                        {section.recurringDates &&
                          section.recurringDates.length > 1 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {section.recurringDates
                                .slice(0, 6)
                                .map((date, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {format(date, "MMM d", { locale: es })}
                                  </Badge>
                                ))}
                              {section.recurringDates.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{section.recurringDates.length - 6} más
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                      <div className="flex items-center gap-2 mt-3 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSection(section.id)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Debug Component */}
          {showDebug && (
            <SectionDebug sections={sections} onTestSave={handleSaveSection} />
          )}

          <Separator />

          {/* Participants Section - Updated description */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configuración General</h3>
            <div className="space-y-2">
              <Label htmlFor="participants">
                Número Máximo de Participantes por Defecto
              </Label>
              <Input
                id="participants"
                type="number"
                value={formData.participants}
                onChange={(e) => handleChange("participants", e.target.value)}
                placeholder="20"
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Este valor se usa como referencia general. La capacidad
                específica de cada sección se gestiona por separado.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between px-0 pb-0">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Guardando..."
              : isEditing
              ? "Actualizar Servicio"
              : "Crear Servicio"}
          </Button>
        </CardFooter>
      </form>

      {/* Section Dialog */}
      <SectionDialog
        open={showSectionDialog}
        onClose={() => {
          console.log("Closing section dialog");
          setShowSectionDialog(false);
          setEditingSectionId(null);
        }}
        onSave={handleSaveSection}
        initialData={getEditingSection()}
        serviceName={formData.name || "Nuevo Servicio"}
      />
    </Card>
  );
}
