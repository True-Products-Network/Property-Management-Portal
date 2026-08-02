import * as React from "react"
import { cn } from "@/lib/utils"

const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto">
    <table className={cn("w-full caption-bottom text-sm", className)}>
      {children}
    </table>
  </div>
)

const TableHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <thead className={cn("border-b", className)}>
    {children}
  </thead>
)

const TableBody = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tbody className={cn("", className)}>
    {children}
  </tbody>
)

const TableRow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <tr className={cn("border-b transition-colors hover:bg-gray-50", className)}>
    {children}
  </tr>
)

const TableHead = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <th className={cn("h-12 px-4 text-left align-middle font-medium text-[var(--secondary-text)]", className)}>
    {children}
  </th>
)

const TableCell = ({ children, className, colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) => (
  <td className={cn("p-4 align-middle", className)} colSpan={colSpan}>
    {children}
  </td>
)

export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
}
