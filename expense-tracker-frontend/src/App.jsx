import { useEffect, useState } from "react";
import api from "./api";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";

import {
    getExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
} from "./services/expenseService";

import "./App.css";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState(null);

    // Tracks whether authentication is still being checked
    const [authChecking, setAuthChecking] = useState(true);

    const [expenses, setExpenses] = useState([]);
    const [editingExpense, setEditingExpense] = useState(null);

    const [view, setView] = useState("list");

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const loadExpenses = async () => {
        const data = await getExpenses();
        setExpenses(data);
    };

    const handleLogin = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            await api.post("/auth/login", {
                email,
                password,
            });

            const response = await api.get("/auth/me");

            setUser(response.data.user);

            await loadExpenses();

            setMessage("Login successful.");
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");

            setUser(null);
            setExpenses([]);
            setEditingExpense(null);
            setView("list");
            setMessage("Logout successful.");
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Logout failed."
            );
        }
    };

    const handleCreateExpense = async (expense) => {
        try {
            await createExpense(expense);

            await loadExpenses();

            setMessage("Expense added successfully.");

            setView("list");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to create expense."
            );

            throw error;
        }
    };

    const handleUpdateExpense = async (expense) => {
        try {
            await updateExpense(editingExpense.id, expense);

            await loadExpenses();

            setEditingExpense(null);
            setView("list");

            setMessage("Expense updated successfully.");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to update expense."
            );

            throw error;
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Delete this expense?")) {
            return;
        }

        try {
            await deleteExpense(id);

            await loadExpenses();

            setMessage("Expense deleted successfully.");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Failed to delete expense."
            );
        }
    };

    const handleCreateClick = () => {
        setEditingExpense(null);
        setMessage("");
        setView("create");
    };

    const handleEditClick = (expense) => {
        setEditingExpense(expense);
        setMessage("");
        setView("edit");
    };

    const handleCancel = () => {
        setEditingExpense(null);
        setMessage("");
        setView("list");
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Get CSRF token cookie first
                await api.get("/csrf-token");

                // Check whether the user is authenticated.
                // If access token is expired, the Axios interceptor
                // will attempt to refresh it.
                const response = await api.get("/auth/me");

                setUser(response.data.user);

                await loadExpenses();
            } catch {
                // Access token and refresh token are not valid.
                setUser(null);
            } finally {
                // Authentication check is finished.
                setAuthChecking(false);
            }
        };

        initializeApp();
    }, []);

    // --------------------------------------------------
    // AUTHENTICATION CHECKING
    // --------------------------------------------------

    // Do not show login page or application page
    // while authentication is being checked.
    if (authChecking) {
        return null;
    }

    // --------------------------------------------------
    // LOGIN PAGE
    // --------------------------------------------------

    if (!user) {
        return (
            <div className="login-container">
                <h1>Expense Tracker</h1>

                <h2>Login</h2>

                <form onSubmit={handleLogin}>
                    <div>
                        <label>Email</label>

                        <input
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            required
                        />
                    </div>

                    <div>
                        <label>Password</label>

                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>
                </form>

                {message && (
                    <p className="message">{message}</p>
                )}
            </div>
        );
    }

    // --------------------------------------------------
    // AUTHENTICATED APPLICATION
    // --------------------------------------------------

    return (
        <div className="app-container">
            <header className="app-header">
                <div>
                    <h1>Expense Tracker</h1>

                    <p>
                        Welcome, <strong>{user.name}</strong>
                    </p>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </header>

            {message && (
                <p className="message">{message}</p>
            )}

            {/* LIST VIEW */}
            {view === "list" && (
                <>
                    <div className="page-header">
                        <div>
                            <h2>My Expenses</h2>
                            <p>
                                Manage and track your expenses.
                            </p>
                        </div>

                        <button
                            className="create-button"
                            onClick={handleCreateClick}
                        >
                            + Create Expense
                        </button>
                    </div>

                    <ExpenseList
                        expenses={expenses}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteExpense}
                    />
                </>
            )}

            {/* CREATE VIEW */}
            {view === "create" && (
                <>
                    <div className="page-header">
                        <div>
                            <h2>Create Expense</h2>
                            <p>
                                Add a new expense to your account.
                            </p>
                        </div>

                        <button
                            className="back-button"
                            onClick={handleCancel}
                        >
                            ← Back to Expenses
                        </button>
                    </div>

                    <ExpenseForm
                        expense={null}
                        onSubmit={handleCreateExpense}
                        onCancel={handleCancel}
                    />
                </>
            )}

            {/* EDIT VIEW */}
            {view === "edit" && (
                <>
                    <div className="page-header">
                        <div>
                            <h2>Edit Expense</h2>
                            <p>
                                Update your expense details.
                            </p>
                        </div>

                        <button
                            className="back-button"
                            onClick={handleCancel}
                        >
                            ← Back to Expenses
                        </button>
                    </div>

                    <ExpenseForm
                        expense={editingExpense}
                        onSubmit={handleUpdateExpense}
                        onCancel={handleCancel}
                    />
                </>
            )}
        </div>
    );
}

export default App;
