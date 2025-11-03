import { BrowserRouter as Router } from "react-router-dom";
import { RoutesComponent } from "./routes/app-router";

function App() {
  return (
    <Router>
      <RoutesComponent />
    </Router>
  );
}

export default App;
