import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import Recommendation from './pages/Recommendation'
import PdfAnalysis from './pages/PdfAnalysis'
import StandardDetails from './pages/StandardDetails'
import SearchHistory from './pages/SearchHistory'
import SearchStandards from './pages/SearchStandards'
import ComplianceCheck from './pages/ComplianceCheck'
import BrowseStandards from './pages/BrowseStandards'
import CompareStandards from './pages/CompareStandards'
import Placeholder from './pages/Placeholder'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/recommendation" element={<Recommendation />} />
        <Route path="/pdf-analysis" element={<PdfAnalysis />} />
        <Route path="/search-standards" element={<SearchStandards />} />
        <Route path="/standards/:id" element={<StandardDetails />} />
        <Route path="/history" element={<SearchHistory />} />
        <Route path="/compliance" element={<ComplianceCheck />} />
        <Route path="/browse" element={<BrowseStandards />} />
        <Route path="/compare-standards" element={<CompareStandards />} />
        <Route path="/soon/:key" element={<Placeholder />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
