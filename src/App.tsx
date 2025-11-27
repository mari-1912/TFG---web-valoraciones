import { useEffect, useRef } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { RoutesComponent } from "./routes/app-router";
import { fetchBackendMovies } from "./services/omdbService";

function App() {
  const fetchedOnce = useRef(false);

  useEffect(() => {
    if (fetchedOnce.current) return;
    fetchedOnce.current = true;

    fetchBackendMovies().catch((err) => {
      console.error("Error al consultar el backend:", err);
    });
  }, []);

  return (
    <Router>
      <RoutesComponent />
    </Router>
  );
}

export default App;
