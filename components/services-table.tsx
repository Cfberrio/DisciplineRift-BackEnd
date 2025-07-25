import { MoreHorizontal, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface Service {
  id: number
  name: string
  price: string
  dateRange: string
  icon: string
}

interface ServicesTableProps {
  services: Service[]
}

export function ServicesTable({ services }: ServicesTableProps) {
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
        <div className="col-span-1 flex justify-center">
          <Checkbox />
        </div>
        <div className="col-span-5">Servicio</div>
        <div className="col-span-2">Precio</div>
        <div className="col-span-3">Horario</div>
        <div className="col-span-1"></div>
      </div>

      {services.map((service, index) => (
        <div
          key={service.id}
          className={`grid grid-cols-12 items-center border-t p-3 hover:bg-muted/20 transition-colors ${
            index % 2 === 0 ? "bg-white" : "bg-muted/10"
          }`}
        >
          <div className="col-span-1 flex justify-center">
            <Checkbox />
          </div>
          <div className="col-span-5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                {service.name.substring(0, 2)}
              </div>
            </div>
            <span className="font-medium">{service.name}</span>
          </div>
          <div className="col-span-2">{service.price}</div>
          <div className="col-span-3">
            <div>{service.dateRange}</div>
            <div className="text-sm text-blue-600 flex items-center gap-1 cursor-pointer mt-1">
              <Eye className="h-3 w-3" />
              Mostrar Horario
            </div>
          </div>
          <div className="col-span-1 flex justify-end">
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
