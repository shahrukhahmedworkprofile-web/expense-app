import { useState } from "react";
import api from "./api";

function App() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState(null);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (event) => {
        event.preventDefault();

        setLoading(true);
        setMessage("");
        setUser(null);

        try {
            const response = await api.post("/auth/login", {
                email,
                password,
            });

            setMessage(response.data.message);
        } catch (error) {
            setMessage(
                error.response?.data?.message || "Login failed."
            );
        } finally {
            setLoading(false);
        }
    };

    const checkUser = async () => {
        setMessage("");
        setUser(null);

        try {
            const response = await api.get("/auth/me");

            setUser(response.data.user);
            setMessage("Access token is working.");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                "Access token authentication failed."
            );
        }
    };

    return (
        <div style={{ maxWidth: "500px", margin: "100px auto" }}>
            <h1>Expense Tracker</h1>

            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: "15px" }}>
                    <label>Email</label>
                    <br />
                    <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>Password</label>
                    <br />
                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <hr style={{ margin: "30px 0" }} />

            <button onClick={checkUser}>
                Check Access Token
            </button>

            {message && (
                <p>{message}</p>
            )}

            {user && (
                <div>
                    <h3>User Information</h3>
                    <p>ID: {user.id}</p>
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                </div>
            )}
        </div>
    );
}

export default App;