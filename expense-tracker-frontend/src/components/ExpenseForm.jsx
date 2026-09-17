import { useEffect, useState } from "react";

import "../assets/css/components/expense_form.css";

const emptyExpense = {
    title: "",
    amount: "",
    category: "Food",
    expense_date: new Date().toISOString().split("T")[0],
    description: "",
};

function ExpenseForm({ expense, onSubmit, onCancel }) {
    const [form, setForm] = useState(emptyExpense);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (expense) {
            setForm({
                title: expense.title,
                amount: expense.amount,
                category: expense.category,
                expense_date: expense.expense_date,
                description: expense.description || "",
            });
        } else {
            setForm(emptyExpense);
        }
    }, [expense]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);

        try {
            await onSubmit(form);

            if (!expense) {
                setForm(emptyExpense);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            className="expense-form"
            onSubmit={handleSubmit}
        >
            <h2>
                {expense ? "Edit Expense" : "Add Expense"}
            </h2>

            <input
                name="title"
                placeholder="Expense title"
                value={form.title}
                onChange={handleChange}
                required
            />

            <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Amount"
                value={form.amount}
                onChange={handleChange}
                required
            />

            <select
                name="category"
                value={form.category}
                onChange={handleChange}
            >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Education</option>
                <option>Other</option>
            </select>

            <input
                name="expense_date"
                type="date"
                value={form.expense_date}
                onChange={handleChange}
                required
            />

            <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
            />

            <button
                type="submit"
                disabled={loading}
            >
                {loading
                    ? "Saving..."
                    : expense
                        ? "Update Expense"
                        : "Add Expense"}
            </button>

            {expense && (
                <button
                    type="button"
                    className="cancel-button"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            )}
        </form>
    );
}

export default ExpenseForm;