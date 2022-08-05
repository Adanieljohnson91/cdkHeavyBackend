import "./App.css";
import CalculationInputForm from "./components/CalculationInputForm";

function App() {

  return (
    <div className="bg-slate-800 h-screen">
      <header className="text-white sticky top-0 z-50 font-mono">Find Lower Hash</header>
      <main className=" grid h-screen place-items-center">
        <section>
          <div>
            <CalculationInputForm />
          </div>
        </section>
      </main>
      <footer></footer>
    </div>
  );
}

export default App;
