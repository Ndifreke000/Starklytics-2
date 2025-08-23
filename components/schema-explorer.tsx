"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronRight, Table, Columns, Database } from "lucide-react"

const mockSchema = {
  blocks: {
    columns: [
      { name: "block_number", type: "BIGINT", description: "Sequential block number" },
      { name: "block_hash", type: "VARCHAR", description: "Unique block hash" },
      { name: "parent_hash", type: "VARCHAR", description: "Hash of parent block" },
      { name: "timestamp", type: "TIMESTAMP", description: "Block creation time" },
      { name: "transaction_count", type: "INTEGER", description: "Number of transactions" },
    ],
  },
  transactions: {
    columns: [
      { name: "transaction_hash", type: "VARCHAR", description: "Unique transaction hash" },
      { name: "block_number", type: "BIGINT", description: "Block containing transaction" },
      { name: "from_address", type: "VARCHAR", description: "Sender address" },
      { name: "to_address", type: "VARCHAR", description: "Recipient address" },
      { name: "value", type: "DECIMAL", description: "Transaction value" },
      { name: "gas_used", type: "BIGINT", description: "Gas consumed" },
    ],
  },
  contracts: {
    columns: [
      { name: "contract_address", type: "VARCHAR", description: "Contract address" },
      { name: "creator_address", type: "VARCHAR", description: "Contract creator" },
      { name: "creation_block", type: "BIGINT", description: "Block when created" },
      { name: "contract_type", type: "VARCHAR", description: "Type of contract" },
    ],
  },
}

export function SchemaExplorer() {
  const [openTables, setOpenTables] = useState<string[]>(["blocks"])

  const toggleTable = (tableName: string) => {
    setOpenTables((prev) => (prev.includes(tableName) ? prev.filter((t) => t !== tableName) : [...prev, tableName]))
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Schema Explorer
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-2">
            {Object.entries(mockSchema).map(([tableName, tableInfo]) => (
              <Collapsible
                key={tableName}
                open={openTables.includes(tableName)}
                onOpenChange={() => toggleTable(tableName)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 hover:bg-muted/50 rounded-md transition-colors">
                  {openTables.includes(tableName) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Table className="h-4 w-4" />
                  <span className="font-medium">{tableName}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {tableInfo.columns.length}
                  </Badge>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 mt-2">
                  <div className="space-y-1">
                    {tableInfo.columns.map((column) => (
                      <div
                        key={column.name}
                        className="flex items-center gap-2 p-2 text-sm hover:bg-muted/30 rounded-sm cursor-pointer"
                        title={column.description}
                      >
                        <Columns className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono">{column.name}</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {column.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
