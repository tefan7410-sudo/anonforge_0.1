import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import type { OperationalCost } from "@/hooks/use-admin-costs";
import {
  useAddOperationalCost,
  useUpdateOperationalCost,
  useDeleteOperationalCost,
  COST_CATEGORIES,
  calculateMonthlyEquivalent,
} from "@/hooks/use-admin-costs";

interface OperationalCostsTableProps {
  costs: OperationalCost[];
}

interface CostFormData {
  name: string;
  category: string;
  amount_usd: string;
  billing_period: "monthly" | "yearly" | "one-time";
  start_date: string;
  end_date: string;
  notes: string;
}

const defaultFormData: CostFormData = {
  name: "",
  category: "infrastructure",
  amount_usd: "",
  billing_period: "monthly",
  start_date: new Date().toISOString().split("T")[0],
  end_date: "",
  notes: "",
};

export function OperationalCostsTable({ costs }: OperationalCostsTableProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<OperationalCost | null>(null);
  const [deletingCostId, setDeletingCostId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CostFormData>(defaultFormData);

  const addCost = useAddOperationalCost();
  const updateCost = useUpdateOperationalCost();
  const deleteCost = useDeleteOperationalCost();

  const handleOpenAdd = () => {
    setFormData(defaultFormData);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (cost: OperationalCost) => {
    setFormData({
      name: cost.name,
      category: cost.category,
      amount_usd: cost.amount_usd.toString(),
      billing_period: cost.billing_period as CostFormData["billing_period"],
      start_date: cost.start_date,
      end_date: cost.end_date || "",
      notes: cost.notes || "",
    });
    setEditingCost(cost);
  };

  const handleSubmit = async () => {
    const costData = {
      name: formData.name,
      category: formData.category,
      amount_usd: parseFloat(formData.amount_usd),
      billing_period: formData.billing_period,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      notes: formData.notes || null,
    };

    if (editingCost) {
      await updateCost.mutateAsync({ id: editingCost.id, ...costData });
      setEditingCost(null);
    } else {
      await addCost.mutateAsync(costData);
      setIsAddDialogOpen(false);
    }
    setFormData(defaultFormData);
  };

  const handleDelete = async () => {
    if (deletingCostId) {
      await deleteCost.mutateAsync(deletingCostId);
      setDeletingCostId(null);
    }
  };

  const CostForm = () => (
    <div className="grid gap-4 py-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Supabase Pro"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COST_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="billing_period">Billing Period</Label>
          <Select
            value={formData.billing_period}
            onValueChange={(value) =>
              setFormData({ ...formData, billing_period: value as CostFormData["billing_period"] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="one-time">One-time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount_usd">Amount (USD)</Label>
        <Input
          id="amount_usd"
          type="number"
          step="0.01"
          value={formData.amount_usd}
          onChange={(e) => setFormData({ ...formData, amount_usd: e.target.value })}
          placeholder="25.00"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="end_date">End Date (optional)</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional details..."
        />
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>💸</span> Operational Costs
          </CardTitle>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Cost
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Operational Cost</DialogTitle>
              </DialogHeader>
              <CostForm />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={addCost.isPending}>
                  {addCost.isPending ? "Adding..." : "Add Cost"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No operational costs added yet
            </p>
          ) : (
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((cost) => (
                    <TableRow key={cost.id}>
                      <TableCell className="font-medium">{cost.name}</TableCell>
                      <TableCell className="text-sm capitalize">{cost.category}</TableCell>
                      <TableCell className="text-right">${cost.amount_usd.toFixed(2)}</TableCell>
                      <TableCell className="text-sm capitalize">{cost.billing_period}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${calculateMonthlyEquivalent(cost).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleOpenEdit(cost)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingCostId(cost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingCost} onOpenChange={(open) => !open && setEditingCost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Operational Cost</DialogTitle>
          </DialogHeader>
          <CostForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCost(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateCost.isPending}>
              {updateCost.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCostId} onOpenChange={(open) => !open && setDeletingCostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Cost</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this operational cost? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
