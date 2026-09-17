import api from "../api";

export const getExpenses = async () => {
    const response = await api.get("/expenses");

    return response.data.expenses;
};

export const createExpense = async (expense) => {
    const response = await api.post("/expenses", expense);

    return response.data.expense;
};

export const updateExpense = async (id, expense) => {
    const response = await api.put(`/expenses/${id}`, expense);

    return response.data.expense;
};

export const deleteExpense = async (id) => {
    const response = await api.delete(`/expenses/${id}`);

    return response.data;
};