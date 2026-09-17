<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $expenses = $request->user()
            ->expenses()
            ->latest('expense_date')
            ->latest('id')
            ->get();

        return response()->json([
            'expenses' => $expenses,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'category' => ['required', 'string', 'max:100'],
            'expense_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $expense = $request->user()->expenses()->create([
            'title' => $request->title,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Expense created successfully.',
            'expense' => $expense,
        ], 201);
    }

    public function show(Request $request, Expense $expense): JsonResponse
    {
        $this->authorizeExpense($request, $expense);

        return response()->json([
            'expense' => $expense,
        ]);
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $this->authorizeExpense($request, $expense);

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'category' => ['required', 'string', 'max:100'],
            'expense_date' => ['required', 'date'],
            'description' => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $expense->update([
            'title' => $request->title,
            'amount' => $request->amount,
            'category' => $request->category,
            'expense_date' => $request->expense_date,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Expense updated successfully.',
            'expense' => $expense->fresh(),
        ]);
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->authorizeExpense($request, $expense);

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully.',
        ]);
    }

    private function authorizeExpense(
        Request $request,
        Expense $expense
    ): void {
        abort_unless(
            $expense->user_id === $request->user()->id,
            404
        );
    }
}