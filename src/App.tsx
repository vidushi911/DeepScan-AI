import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { UploadPage } from './pages/UploadPage';
import { ResultsPage } from './pages/ResultsPage';
import { MapPage } from './pages/MapPage';
import { ReportsPage } from './pages/ReportsPage';
import { BenchmarksPage } from './pages/BenchmarksPage';
import { AppDataProvider } from './context/AppDataContext';

export function App() {
  return (
    <AppDataProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#F4F7FC] text-slate-800 font-sans selection:bg-[#305CDE] selection:text-white">
          <Navbar />

          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/map" element={<MapPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/benchmarks" element={<BenchmarksPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </Router>
    </AppDataProvider>
  );
}

export default App;
