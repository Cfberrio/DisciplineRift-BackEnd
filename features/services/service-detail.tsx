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
      alert("No enrolled students to generate the roster");
      return;
    }

    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF("landscape", "mm", "a4");

      // Add logo/header (you can customize this)
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Discipline Rift", 20, 25);

      // Service/Season title
      doc.setFontSize(16);
      doc.text(`${service.name || "Team Roster"}`, 20, 35);
      doc.text(`${service.school || "School"} Roster`, 20, 45);

      // Prepare table data
      const tableData = enrolledStudents.map((student, index) => [
        `${student.firstname} ${student.lastname}`,
        calculateAge(student.dob).toString(),
        student.grade || "N/A",
        getGender(student.firstname),
        student.parent
          ? `${student.parent.firstname} ${student.parent.lastname}`
          : student.ecname || "N/A",
        student.parent?.phone || student.ecphone || "N/A",
        student.ecphone || "N/A",
        student.parent?.email || "N/A",
      ]);

      // Table headers
      const headers = [
        "Participant Name",
        "Age",
        "Grade",
        "Gender",
        "Guardian Name",
        "Phone Number",
        "Emergency #",
        "Email",
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
          0: { cellWidth: 40 }, // Participant Name
          1: { cellWidth: 15, halign: "center" }, // Age
          2: { cellWidth: 15, halign: "center" }, // Grade
          3: { cellWidth: 15, halign: "center" }, // Gender
          4: { cellWidth: 40 }, // Guardian Name
          5: { cellWidth: 35 }, // Phone Number
          6: { cellWidth: 35 }, // Emergency #
          7: { cellWidth: 50 }, // Email
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

    setIsLoadingStudents(true);
    try {
      console.log(
        "ServiceDetail - Fetching students for teamid:",
        service.teamid
      );

      // Query enrollments for this team
      const { data: enrollments, error: enrollmentError } = await supabase
        .from("enrollment")
        .select(
          `
          enrollmentid,
          studentid,
          isactive,
          student!inner (
            studentid,
            firstname,
            lastname,
            dob,
            grade,
            ecname,
            ecphone,
            ecrelationship,
            parentid,
            parent (
              parentid,
              firstname,
              lastname,
              email,
              phone
            )
          )
        `
        )
        .eq("teamid", service.teamid)
        .eq("isactive", true);

      if (enrollmentError) {
        console.error(
          "ServiceDetail - Error fetching students:",
          enrollmentError
        );
        return;
      }

      console.log("ServiceDetail - Raw enrollment data:", enrollments);

      if (enrollments && enrollments.length > 0) {
        const studentsData = enrollments.map((enrollment: any) => ({
          studentid: enrollment.student.studentid,
          firstname: enrollment.student.firstname,
          lastname: enrollment.student.lastname,
          dob: enrollment.student.dob,
          grade: enrollment.student.grade,
          ecname: enrollment.student.ecname,
          ecphone: enrollment.student.ecphone,
          ecrelationship: enrollment.student.ecrelationship,
          parent: enrollment.student.parent,
        }));

        console.log("ServiceDetail - Processed students data:", studentsData);
        setEnrolledStudents(studentsData);
      } else {
        console.log("ServiceDetail - No enrollments found");
        setEnrolledStudents([]);
      }
    } catch (error) {
      console.error("ServiceDetail - Error fetching students:", error);
      setEnrolledStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (service?.teamid) {
      fetchEnrolledStudents();
    }
  }, [service?.teamid]);

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
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Descargar Roster PDF
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Cargando estudiantes...</span>
            </div>
          ) : enrolledStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No hay estudiantes matriculados en este servicio
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-blue-50 p-3 border-b">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Vista Previa del Roster
                    </span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Participant Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Age
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Grade
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Gender
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Guardian Name
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Phone Number
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Emergency #
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">
                          Email
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
                          <td className="px-3 py-2 font-medium">
                            {student.firstname} {student.lastname}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {calculateAge(student.dob)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {student.grade || "N/A"}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {getGender(student.firstname)}
                          </td>
                          <td className="px-3 py-2">
                            {student.parent
                              ? `${student.parent.firstname} ${student.parent.lastname}`
                              : student.ecname || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.parent?.phone || student.ecphone || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.ecphone || "N/A"}
                          </td>
                          <td className="px-3 py-2">
                            {student.parent?.email || "N/A"}
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
