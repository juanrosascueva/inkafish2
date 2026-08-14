import { z } from "zod";
import { NextResponse } from "next/server";

// 1. Esquema de Orden de Compra
export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "El proveedor es obligatorio"),
  siteId: z.string().min(1, "La sede de destino es obligatoria"),
  warehouseId: z.string().min(1, "El almacén de destino es obligatorio"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  currency: z.string().default("PEN"),
  items: z.array(
    z.object({
      productId: z.string().min(1, "El producto es obligatorio"),
      unitId: z.string().min(1, "La unidad es obligatoria"),
      quantity: z.number().positive("La cantidad debe ser mayor a 0"),
      unitPrice: z.number().min(0, "El precio unitario no puede ser negativo"),
    })
  ).min(1, "Debe incluir al menos un insumo en la orden"),
});

// 2. Esquema de Solicitud de Pedido
export const requestOrderSchema = z.object({
  siteId: z.string().min(1, "La sede es obligatoria"),
  areaId: z.string().min(1, "El área es obligatoria"),
  requiredDate: z.string().min(1, "La fecha requerida es obligatoria"),
  shift: z.string().optional(),
  priority: z.enum(["NORMAL", "URGENT"]).default("NORMAL"),
  type: z.enum(["REGULAR", "EXTRAORDINARY", "URGENT"]).default("REGULAR"),
  urgentReason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().or(z.string()).optional(),
      productNameTemp: z.string().optional(),
      requestedQuantity: z.number().positive("La cantidad solicitada debe ser mayor a 0"),
      unitId: z.number().or(z.string()).optional(),
      notes: z.string().optional(),
    })
  ).min(1, "Debe agregar al menos un ítem a la solicitud"),
});

// 3. Esquema de Orden de Producción
export const productionOrderSchema = z.object({
  siteId: z.number().or(z.string()),
  productionAreaId: z.number().or(z.string()).optional(),
  plannedDate: z.string().min(1, "La fecha planificada es obligatoria"),
  shift: z.string().optional(),
  notes: z.string().optional(),
  inputs: z.array(
    z.object({
      productId: z.number().or(z.string()),
      unitId: z.number().or(z.string()),
      plannedQuantity: z.number().positive("La cantidad del insumo debe ser mayor a 0"),
      warehouseId: z.number().or(z.string()).optional(),
    })
  ).min(1, "Debe ingresar al menos un insumo de entrada"),
  outputs: z.array(
    z.object({
      outputProductId: z.number().or(z.string()),
      unitId: z.number().or(z.string()),
      quantity: z.number().positive("La cantidad del producto resultante debe ser mayor a 0"),
      destinationWarehouseId: z.number().or(z.string()).optional(),
    })
  ).min(1, "Debe ingresar al menos un producto resultante de salida"),
});

// 4. Esquema de Registro de Merma
export const wasteRecordSchema = z.object({
  productId: z.number().or(z.string()),
  unitId: z.number().or(z.string()),
  quantity: z.number().positive("La cantidad de merma debe ser mayor a 0"),
  stage: z.string().min(1, "La etapa es obligatoria"),
  cause: z.string().min(1, "La causa de la merma es obligatoria"),
  siteId: z.number().or(z.string()),
  areaId: z.number().or(z.string()).optional(),
  warehouseId: z.number().or(z.string()).optional(),
  occurredAt: z.string().min(1, "La fecha y hora son obligatorias"),
  notes: z.string().optional(),
});

// 5. Esquema de Movimiento de Inventario
export const inventoryMovementSchema = z.object({
  productId: z.string().min(1, "El producto es obligatorio"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitId: z.string().min(1, "La unidad es obligatoria"),
  siteId: z.string().min(1, "La sede es obligatoria"),
  warehouseId: z.string().optional(),
  locationId: z.string().optional(),
  movementType: z.string().min(1, "El tipo de movimiento es obligatorio"),
  reason: z.string().optional(),
  lotNumber: z.string().optional(),
  expiresAt: z.string().optional(),
  supplierId: z.string().optional(),
});

// 6. Esquema de Transferencia entre Sedes
export const transferOrderSchema = z.object({
  originSiteId: z.number().or(z.string()),
  destinationSiteId: z.number().or(z.string()),
  originWarehouseId: z.number().or(z.string()).optional(),
  destinationWarehouseId: z.number().or(z.string()).optional(),
  plannedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productId: z.number().or(z.string()),
      unitId: z.number().or(z.string()),
      requestedQuantity: z.number().positive("La cantidad a transferir debe ser mayor a 0"),
      notes: z.string().optional(),
    })
  ).min(1, "Debe agregar al menos un ítem a transferir"),
});

/**
 * Helper genérico para validar body con Zod
 */
export function validatePayload<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const errorMessage = issue ? `${issue.path.join(".")}: ${issue.message}` : "Datos de solicitud inválidos";
    return {
      success: false,
      response: NextResponse.json({ error: errorMessage }, { status: 400 }),
    };
  }
  return { success: true, data: result.data };
}
