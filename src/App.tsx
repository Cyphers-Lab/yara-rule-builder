import { Routes, Route } from 'react-router-dom';
import { Container } from '@mui/material';
import HomePage from './pages/HomePage';
import BuilderPage from './pages/BuilderPage';
import RepositoryPage from './pages/RepositoryPage';
import Navbar from './components/Navbar';

const App: React.FC = () => {
  return (
    <>
      <Navbar />
      <Container component="main" sx={{ mt: 4, mb: 4 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/repository" element={<RepositoryPage />} />
        </Routes>
      </Container>
    </>
  );
};

export default App;
