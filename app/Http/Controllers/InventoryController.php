<?php

namespace App\Http\Controllers;

use App\Models\InventoryItem;
use App\Models\InventoryCategory;
use App\Models\InventoryTransaction;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index()
    {
        $institutionId = auth()->user()->institution_id;

        $items = InventoryItem::where('institution_id', $institutionId)
            ->with('category')
            ->orderBy('name')
            ->get()
            ->map(fn($i) => [
                'id' => $i->id,
                'name' => $i->name,
                'sku' => $i->sku,
                'category_name' => $i->category?->name ?? 'Uncategorized',
                'category_id' => $i->category_id,
                'quantity_in_stock' => $i->quantity_in_stock,
                'reorder_level' => $i->reorder_level,
                'unit_price' => (float)$i->unit_price,
                'unit' => $i->unit,
                'is_active' => $i->is_active,
                'is_low_stock' => $i->isLowStock(),
                'description' => $i->description,
            ]);

        $categories = InventoryCategory::where('institution_id', $institutionId)
            ->orderBy('name')
            ->get();

        $students = Student::where('institution_id', $institutionId)
            ->where('payment_status', '!=', 'inactive')
            ->with('schoolClass')
            ->get()
            ->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'class_name' => $s->schoolClass?->name ?? 'N/A',
                'admission_number' => $s->admission_number,
            ]);

        // Recent transactions
        $recentTransactions = InventoryTransaction::where('institution_id', $institutionId)
            ->with(['item', 'student', 'createdBy'])
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn($t) => [
                'id' => $t->id,
                'item_name' => $t->item->name ?? 'Deleted Item',
                'type' => $t->type,
                'quantity' => $t->quantity,
                'unit_price' => (float)($t->unit_price ?? 0),
                'total_amount' => (float)($t->total_amount ?? 0),
                'student_name' => $t->student?->name ?? $t->issued_to_name ?? '—',
                'notes' => $t->notes,
                'created_by' => $t->createdBy?->name ?? 'System',
                'created_at' => $t->created_at->format('M d, Y h:i A'),
            ]);

        $stats = [
            'total_items' => $items->count(),
            'low_stock_count' => $items->where('is_low_stock', true)->count(),
            'total_value' => $items->sum(fn($i) => $i['quantity_in_stock'] * $i['unit_price']),
            'active_items' => $items->where('is_active', true)->count(),
        ];

        return Inertia::render('Inventory', [
            'items' => $items,
            'categories' => $categories,
            'students' => $students,
            'recentTransactions' => $recentTransactions,
            'stats' => $stats,
        ]);
    }

    // ---- Categories ----

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        InventoryCategory::create([
            'institution_id' => auth()->user()->institution_id,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Category created.');
    }

    public function deleteCategory($id)
    {
        $category = InventoryCategory::where('institution_id', auth()->user()->institution_id)
            ->findOrFail($id);
        $category->delete();
        return redirect()->back()->with('success', 'Category deleted.');
    }

    // ---- Items ----

    public function storeItem(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'nullable|exists:inventory_categories,id',
            'name' => 'required|string|max:200',
            'sku' => 'nullable|string|max:50|unique:inventory_items,sku',
            'description' => 'nullable|string|max:500',
            'quantity_in_stock' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
        ]);

        InventoryItem::create(array_merge($validated, [
            'institution_id' => auth()->user()->institution_id,
            'is_active' => true,
        ]));

        return redirect()->back()->with('success', 'Item added to inventory.');
    }

    public function updateItem(Request $request, $id)
    {
        $item = InventoryItem::where('institution_id', auth()->user()->institution_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'category_id' => 'nullable|exists:inventory_categories,id',
            'name' => 'required|string|max:200',
            'sku' => 'nullable|string|max:50|unique:inventory_items,sku,' . $id,
            'description' => 'nullable|string|max:500',
            'reorder_level' => 'required|integer|min:0',
            'unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string|max:20',
            'is_active' => 'boolean',
        ]);

        $item->update($validated);

        return redirect()->back()->with('success', 'Item updated.');
    }

    // ---- Stock Operations ----

    public function addStock(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $item = InventoryItem::where('institution_id', auth()->user()->institution_id)
            ->findOrFail($validated['item_id']);

        $unitPrice = $validated['unit_price'] ?? $item->unit_price;

        DB::transaction(function () use ($item, $validated, $unitPrice) {
            $item->increment('quantity_in_stock', $validated['quantity']);

            InventoryTransaction::create([
                'institution_id' => $item->institution_id,
                'item_id' => $item->id,
                'type' => 'in',
                'quantity' => $validated['quantity'],
                'unit_price' => $unitPrice,
                'total_amount' => $unitPrice * $validated['quantity'],
                'notes' => $validated['notes'] ?? 'Stock added',
                'created_by' => Auth::id(),
            ]);
        });

        return redirect()->back()->with('success', 'Stock added successfully.');
    }

    public function issueItem(Request $request)
    {
        $validated = $request->validate([
            'item_id' => 'required|exists:inventory_items,id',
            'quantity' => 'required|integer|min:1',
            'student_id' => 'nullable|exists:students,id',
            'issued_to_name' => 'required_without:student_id|string|max:200',
            'notes' => 'nullable|string|max:500',
        ]);

        $item = InventoryItem::where('institution_id', auth()->user()->institution_id)
            ->findOrFail($validated['item_id']);

        if ($item->quantity_in_stock < $validated['quantity']) {
            return redirect()->back()->with('error', "Insufficient stock. Only {$item->quantity_in_stock} {$item->unit}(s) available.");
        }

        DB::transaction(function () use ($item, $validated) {
            $item->decrement('quantity_in_stock', $validated['quantity']);

            InventoryTransaction::create([
                'institution_id' => $item->institution_id,
                'item_id' => $item->id,
                'type' => 'out',
                'quantity' => $validated['quantity'],
                'unit_price' => $item->unit_price,
                'total_amount' => $item->unit_price * $validated['quantity'],
                'student_id' => $validated['student_id'] ?? null,
                'issued_to_name' => $validated['issued_to_name'] ?? null,
                'notes' => $validated['notes'] ?? 'Issued to student',
                'created_by' => Auth::id(),
            ]);
        });

        return redirect()->back()->with('success', 'Item issued successfully.');
    }
}
