"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  User,
  Phone,
  Mail,
  GraduationCap,
  Heart,
  UserCheck,
  CalendarDays,
  Download,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EnrolledStudent {
  studentid: string;
  firstname: string;
  lastname: string;
  dob: string;
  grade: string;
  ecname: string;
  ecphone: string;
  ecrelationship: string;
  StudentDismissal?: string;
  teacher?: string;
  medcondition?: string;
  parent?: {
    parentid: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
}

interface ServiceDetailProps {
  service: any;
}

export function ServiceDetail({ service }: ServiceDetailProps) {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>(
    []
  );
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);

  const calculateAge = (dob: string): number => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const getGender = (firstname: string): string => {
    // Simple gender detection based on common names (this is basic, you might want to add a gender field to your database)
    const maleNames = [
      "carlos",
      "juan",
      "jose",
      "luis",
      "miguel",
      "david",
      "eduardo",
      "trevor",
      "carson",
    ];
    const femaleNames = [
      "maria",
      "ana",
      "sofia",
      "isabella",
      "quinn",
      "emma",
      "keeva",
      "lydia",
      "aria",
      "kennedy",
      "mia",
      "tatum",
    ];

    const name = firstname.toLowerCase();
    if (maleNames.some((maleName) => name.includes(maleName))) return "M";
    if (femaleNames.some((femaleName) => name.includes(femaleName))) return "F";
    return "N/A"; // Not available
  };

  const generateRosterPDF = async () => {
    if (enrolledStudents.length === 0) {
      alert("No enrolled students to generate roster");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF("landscape", "mm", "a4");

      // Add logo/header (you can customize this)
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("DISCIPLINE RIFT", 20, 25);

      // Service/Season title
      doc.setFontSize(16);
      doc.text(`${service.name || "Team Roster"}`, 20, 35);
      doc.text(`${service.school || "School"} Roster`, 20, 45);

      // Prepare table data
      const tableData = enrolledStudents.map((student) => [
        student.firstname || "N/A",
        student.lastname || "N/A",
        student.dob || "N/A",
        student.grade || "N/A",
        student.StudentDismissal || "N/A",
        student.teacher || "N/A",
        student.ecname || "N/A",
        student.ecphone || "N/A",
        student.medcondition || "N/A",
      ]);

      // Table headers
      const headers = [
        "firstname",
        "lastname",
        "dob",
        "grade",
        "StudentDismissal",
        "teacher",
        "ecname",
        "ecphone",
        "medcondition",
      ];

      // Create table using autoTable function
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 55,
        theme: "striped",
        headStyles: {
          fillColor: [41, 128, 185], // Blue color
          textColor: 255,
          fontStyle: "bold",
          fontSize: 10,
        },
        bodyStyles: {
          fontSize: 9,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Light gray for alternate rows
        },
        columnStyles: {
          0: { cellWidth: 30 }, // firstname
          1: { cellWidth: 30 }, // lastname
          2: { cellWidth: 25, halign: "center" }, // dob
          3: { cellWidth: 15, halign: "center" }, // grade
          4: { cellWidth: 25 }, // StudentDismissal
          5: { cellWidth: 25 }, // teacher
          6: { cellWidth: 30 }, // ecname
          7: { cellWidth: 30 }, // ecphone
          8: { cellWidth: 30 }, // medcondition
        },
        margin: { left: 20, right: 20 },
        tableWidth: "auto",
      });

      // Add footer with additional info
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(
        `Total Participants: ${enrolledStudents.length}`,
        20,
        finalY + 15
      );
      doc.text(
        `Generated on: ${new Date().toLocaleDateString("en-US")}`,
        20,
        finalY + 25
      );

      if (service.sessions && service.sessions.length > 0) {
        const session = service.sessions[0];
        doc.text(
          `Schedule: ${session.daysofweek} ${session.starttime} - ${session.endtime}`,
          20,
          finalY + 35
        );
      }

      // Generate filename
      const fileName = `roster_${
        service.name?.replace(/\s+/g, "_") || "team"
      }_${new Date().toISOString().split("T")[0]}.pdf`;

      // Save the PDF
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const fetchEnrolledStudents = async () => {
    if (!service?.teamid) {
      console.log(
        "ServiceDetail - No teamid available, skipping student fetch"
      );
      return;
    }

    const currentTeamId = service.teamid; // Store current teamid to check if it changed during fetch
    setIsLoadingStudents(true);
    setStudentLoadError(null);
    try {
      console.log(
        "ServiceDetail - Fetching students for teamid:",
        service.teamid
      );

      // Add timeout to prevent infinite loading (increased to 60 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timeout after 60 seconds")), 60000);
      });

      // Simplified query first - get enrollments only (with limit)
      const enrollmentPromise = supabase
        .from("enrollment")
        .select("enrollmentid, studentid, teamid, isactive")
        .eq("teamid", service.teamid)
        .eq("isactive", true)
        .limit(500);

      const { data: enrollments, error: enrollmentError } = await Promise.race([
        enrollmentPromise,
        timeoutPromise,
      ]) as any;

      if (enrollmentError) {
        console.error(
          "ServiceDetail - Error fetching enrollments:",
          enrollmentError
        );
        setEnrolledStudents([]);
        return;
      }

      console.log("ServiceDetail - Found enrollments:", enrollments?.length || 0);

      if (!enrollments || enrollments.length === 0) {
        console.log("ServiceDetail - No enrollments found");
        setEnrolledStudents([]);
        return;
      }

      // Get student IDs for separate query
      const studentIds = enrollments.map((e: any) => e.studentid);
      
      // Fetch students data separately for better performance
      // Try with all fields first, then fallback to basic fields if it fails
      let studentPromise = supabase
        .from("student")
        .select(`
          studentid,
          firstname,
          lastname,
          dob,
          grade,
          ecname,
          ecphone,
          ecrelationship,
          StudentDismissal,
          teacher,
          medcondition,
          parentid
        `)
        .in("studentid", studentIds)
        .limit(500);

      let { data: students, error: studentError } = await Promise.race([
        studentPromise,
        timeoutPromise,
      ]) as any;

      // If error (likely because new columns don't exist), try without them
      if (studentError) {
        console.warn("ServiceDetail - Error with extended query, trying basic fields:", studentError);
        const fallbackPromise = supabase
          .from("student")
          .select(`
            studentid,
            firstname,
            lastname,
            dob,
            grade,
            ecname,
            ecphone,
            ecrelationship,
            parentid
          `)
          .in("studentid", studentIds)
          .limit(500);

        const fallbackResult = await Promise.race([
          fallbackPromise,
          timeoutPromise,
        ]) as any;

        students = fallbackResult.data;
        studentError = fallbackResult.error;

        if (studentError) {
          console.error("ServiceDetail - Error fetching students (fallback):", studentError);
          setEnrolledStudents([]);
          return;
        }
      }

      console.log("ServiceDetail - Found students:", students?.length || 0);

      // Get parent IDs for those students that have them
      const parentIds = students
        ?.filter((s: any) => s.parentid)
        .map((s: any) => s.parentid) || [];

      let parents: any[] = [];
      if (parentIds.length > 0) {
        const parentPromise = supabase
          .from("parent")
          .select("parentid, firstname, lastname, email, phone")
          .in("parentid", parentIds)
          .limit(500);

        const { data: parentData, error: parentError } = await Promise.race([
          parentPromise,
          timeoutPromise,
        ]) as any;

        if (!parentError && parentData) {
          parents = parentData;
        }
      }

      console.log("ServiceDetail - Found parents:", parents?.length || 0);

      // Combine data
      const studentsData = students?.map((student: any) => {
        const parent = parents.find((p: any) => p.parentid === student.parentid);
        return {
          studentid: student.studentid,
          firstname: student.firstname,
          lastname: student.lastname,
          dob: student.dob,
          grade: student.grade,
          ecname: student.ecname,
          ecphone: student.ecphone,
          ecrelationship: student.ecrelationship,
          StudentDismissal: student.StudentDismissal || null,
          teacher: student.teacher || null,
          medcondition: student.medcondition || null,
          parent: parent || null,
        };
      }) || [];

      console.log("ServiceDetail - Final processed students data:", studentsData.length);
      
      // Only update state if we're still looking at the same team
      if (currentTeamId === service?.teamid) {
        setEnrolledStudents(studentsData);
      } else {
        console.log("ServiceDetail - Team changed during fetch, ignoring results");
      }

    } catch (error) {
      console.error("ServiceDetail - Error fetching students:", error);
      let errorMessage = "Error desconocido al cargar estudiantes";
      
      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          errorMessage = "La consulta tardó demasiado tiempo. Revisa tu conexión e intenta de nuevo.";
        } else {
          errorMessage = error.message;
        }
      }
      
      // Only update error state if we're still looking at the same team
      if (currentTeamId === service?.teamid) {
        setStudentLoadError(errorMessage);
        setEnrolledStudents([]);
      }
    } finally {
      // Only update loading state if we're still looking at the same team
      if (currentTeamId === service?.teamid) {
        setIsLoadingStudents(false);
      }
    }
  };

  useEffect(() => {
    // Clear previous state when service changes
    setEnrolledStudents([]);
    setStudentLoadError(null);
    setIsLoadingStudents(false);
    
    if (service?.teamid) {
      console.log("ServiceDetail - Service changed, fetching new students for:", service.teamid, "- Service name:", service.name);
      // Small delay to ensure state is cleared before starting new fetch
      setTimeout(() => {
        fetchEnrolledStudents();
      }, 100);
    } else {
      console.log("ServiceDetail - No teamid, clearing students");
    }
  }, [service?.teamid, service?.name]); // Also depend on service name to ensure full refresh

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0)?.toUpperCase() || "";
    const last = lastName?.charAt(0)?.toUpperCase() || "";
    return first + last;
  };

  // Early return if service is null or undefined
  if (!service) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 mb-2">
          Selecciona un servicio para ver sus detalles
        </p>
        <p className="text-sm text-gray-400">
          Haz clic en el botón "Ver" de cualquier servicio en la tabla
        </p>
      </div>
    );
  }

  // Validate service has required properties
  if (!service.teamid && !service.id) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-red-500 mb-2">Error en los datos del servicio</p>
        <p className="text-sm text-gray-400">
          El servicio no tiene un identificador válido
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
          {service.icon ? (
            <img
              src={service.icon || "/placeholder.svg"}
              alt={service.name}
              className="w-12 h-12 rounded"
            />
          ) : (
            <GraduationCap className="w-8 h-8" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            {service.name || "Sin nombre"}
          </h2>
          <p className="text-gray-600 mt-1">
            {service.description || service.serviceType || "Sin descripción"}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={service.isactive ? "default" : "secondary"}>
              {service.isactive ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Grid - Changed to 2x2 */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 truncate">Precio</p>
                <p className="text-lg font-bold truncate">
                  {formatCurrency(service.price || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 truncate">Estudiantes</p>
                <p className="text-xs text-gray-600 truncate">Matriculados</p>
                <p className="text-lg font-bold">{enrolledStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 truncate">Ubicación</p>
                <p
                  className="text-sm font-bold truncate"
                  title={service.school || "Sin ubicación"}
                >
                  {service.school || "Sin ubicación"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 truncate">Sesiones</p>
                <p className="text-lg font-bold">
                  {service.sessions?.length || 0}
                </p>
                <p className="text-xs text-gray-500 truncate">programadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Information */}
      {service.sessions && service.sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Sesiones Programadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {service.sessions.map((session: any, index: number) => (
                <div
                  key={session.sessionid || index}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {session.daysofweek || "Sin día especificado"} •{" "}
                        {session.starttime || "Sin hora"} -{" "}
                        {session.endtime || "Sin hora"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session.startdate && session.enddate
                          ? `${new Date(
                              session.startdate + "T00:00:00"
                            ).toLocaleDateString()} - ${new Date(
                              session.enddate + "T00:00:00"
                            ).toLocaleDateString()}`
                          : "Fechas no especificadas"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Repetición: {session.repeat || "No especificada"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{session.repeat || "Una vez"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Enrolled Students Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Estudiantes Matriculados
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {enrolledStudents.length} estudiantes matriculados en este
                servicio
              </p>
            </div>

            {/* PDF Download Button */}
            {enrolledStudents.length > 0 && (
              <Button
                onClick={generateRosterPDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingPdf ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Roster PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 mt-2">Cargando estudiantes...</span>
              <p className="text-xs text-gray-500 mt-2">
                Esto puede tomar unos segundos...
              </p>
            </div>
          ) : studentLoadError ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">
                {studentLoadError}
              </p>
              <Button 
                onClick={fetchEnrolledStudents}
                variant="outline"
                className="flex items-center gap-2"
              >
                🔄 Intentar de nuevo
              </Button>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                No hay estudiantes matriculados en este servicio
              </p>
              <Button 
                onClick={fetchEnrolledStudents}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                🔄 Recargar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 p-3 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Roster Preview
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          firstname
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          lastname
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          dob
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          grade
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          StudentDismissal
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          teacher
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          ecname
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          ecphone
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          medcondition
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledStudents.map((student, index) => (
                        <tr
                          key={student.studentid}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          <td className="px-3 py-2">
                            {student.firstname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.lastname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.dob || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.grade || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.StudentDismissal || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.teacher || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.ecname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.ecphone || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.medcondition || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Detailed Students List */}
              <div className="space-y-4 mt-6">
                <h4 className="font-semibold text-gray-900">
                  Información Detallada de Estudiantes
                </h4>
                {enrolledStudents.map((student) => (
                  <div
                    key={student.studentid}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold">
                        {getInitials(student.firstname, student.lastname)}
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Student Info */}
                        <div>
                          <h4 className="font-semibold text-lg">
                            {student.firstname} {student.lastname}
                          </h4>
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <GraduationCap className="w-4 h-4" />
                              <span>
                                Grado: {student.grade || "No especificado"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <User className="w-4 h-4" />
                              <span>
                                Edad: {calculateAge(student.dob)} años
                              </span>
                            </div>
                            {student.ecname && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Heart className="w-4 h-4" />
                                <span>
                                  Contacto de emergencia: {student.ecname}
                                </span>
                              </div>
                            )}
                            {student.ecphone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <span>{student.ecphone}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Parent Info */}
                        {student.parent && (
                          <div>
                            <h5 className="font-medium text-gray-900 mb-2">
                              Padre/Tutor
                            </h5>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>
                                  {student.parent.firstname}{" "}
                                  {student.parent.lastname}
                                </span>
                              </div>
                              {student.parent.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-4 h-4" />
                                  <span>{student.parent.email}</span>
                                </div>
                              )}
                              {student.parent.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  <span>{student.parent.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
