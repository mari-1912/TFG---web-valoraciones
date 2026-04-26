import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { RoutesComponent } from "./routes/app-router";
import { bootstrapAuth } from "./services/auth-service";
import { Header } from "./components/sections/header";
import { ScrollToTop } from "./components/scroll-to-top";

function App() {
  useEffect(() => {
    bootstrapAuth();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Header />
      <div className="app-main-offset">
        <RoutesComponent />
      </div>
    </Router>
  );
}

export default App;
