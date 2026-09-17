import "../assets/css/components/expense_list.css";

function ExpenseList({ expenses, onEdit, onDelete }) {
    if (expenses.length === 0) {
        return (
            <div className="no-expenses">
                <p>No expenses found.</p>
            </div>
        );
    }

    return (
        <div className="expense-list">
            <div className="expense-list-header">
                <h2>Expenses</h2>
            </div>
            
            <div className="expense-list-body">
                {expenses.map((expense) => (
                    <div
                        key={expense.id}
                        className="expense-card"
                    >
                        <h3>{expense.title}</h3>

                        <p className="expense-amount">
                            ${Number(expense.amount).toFixed(2)}
                        </p>

                        <p>
                            Category:{" "}
                            <span className="expense-category">
                                {expense.category}
                            </span>
                        </p>

                        <p>
                            Date: {expense.expense_date}
                        </p>

                        {expense.description && (
                            <p className="expense-description">
                                {expense.description}
                            </p>
                        )}

                        <button
                            className="edit-button"
                            onClick={() => onEdit(expense)}
                        >
                            Edit
                        </button>

                        <button
                            className="delete-button"
                            onClick={() =>
                                onDelete(expense.id)
                            }
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
            
        </div>
    );
}

export default ExpenseList;