"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, FileX, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DrteamApplication, DrteamResponse } from "@/lib/db/drteam-service"

interface ApplicationsTableProps {
  className?: string
}

export function ApplicationsTable({ className }: ApplicationsTableProps) {
  const [applications, setApplications] = useState<DrteamApplication[]>([])
  const [sports, setSports] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de filtros
  const [search, setSearch] = useState("")
  const [selectedSport, setSelectedSport] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // Estados de paginación
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const fetchApplications = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        search: search.trim(),
        sport: selectedSport,
        page: page.toString(),
        pageSize: pageSize.toString()
      })

      const response = await fetch(`/api/applications?${params}`)
      
      if (!response.ok) {
        throw new Error("Error al cargar las aplicaciones")
      }

      const data: DrteamResponse = await response.json()
      
      setApplications(data.data)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  const fetchSports = async () => {
    try {
      const response = await fetch("/api/applications/sports")
      
      if (!response.ok) {
        throw new Error("Error al cargar deportes")
      }

      const data = await response.json()
      setSports(data.sports || [])
    } catch (err) {
      console.error("Error fetching sports:", err)
    }
  }

  useEffect(() => {
    fetchSports()
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [search, selectedSport, page, pageSize])

  const handleDownload = (application: DrteamApplication) => {
    if (!application.resume) return

    // Usar endpoint proxy para descarga segura
    const downloadUrl = `/api/resume?id=${application.id}`
    
    // Crear enlace temporal para descarga
    const link = document.createElement("a")
    link.href = downloadUrl
    link.download = `resume_${application.firstName}_${application.lastName}.pdf`
    link.target = "_blank"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset a primera página
  }

  const handleSportFilter = (sport: string) => {
    setSelectedSport(sport === "all" ? "" : sport)
    setPage(1) // Reset a primera página
  }

  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(parseInt(newPageSize))
    setPage(1) // Reset a primera página
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <Button onClick={fetchApplications} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>Applications (Drteam)</CardTitle>
          <CardDescription>
            Gestión de todas las aplicaciones del formulario Drteam
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por nombre, apellido, email o teléfono..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSport || "all"} onValueChange={handleSportFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por deporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los deportes</SelectItem>
                {sports.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Apellido</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Deporte</TableHead>
                  <TableHead className="w-64">Descripción</TableHead>
                  <TableHead className="w-32">Resume</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {loading ? (
                  // Skeleton loading
                  Array.from({ length: pageSize }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 9 }).map((_, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <FileX className="w-8 h-8 mb-2" />
                        <p>No hay aplicaciones disponibles</p>
                        {(search || selectedSport) && (
                          <p className="text-sm mt-1">
                            Intenta ajustar los filtros de búsqueda
                          </p>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">{application.id}</TableCell>
                      <TableCell>{application.firstName}</TableCell>
                      <TableCell>{application.lastName}</TableCell>
                      <TableCell>{application.email}</TableCell>
                      <TableCell>{application.number}</TableCell>
                      <TableCell>{application.currentAddre}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{application.sport}</Badge>
                      </TableCell>
                      <TableCell>
                        {application.description ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                {truncateText(application.description, 120)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <p>{application.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-gray-400">Sin descripción</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {application.resume ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(application)}
                                className="w-full"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Descargar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Descargar PDF del resume</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="w-full"
                              >
                                <FileX className="w-4 h-4 mr-1" />
                                Sin archivo
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>No hay resume disponible</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {!loading && applications.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Mostrar</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>de {total} registros</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Anterior
                </Button>
                
                <span className="text-sm text-gray-500">
                  Página {page} de {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
