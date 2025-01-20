import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Home from './components/Home/Home';
import Quiz from './components/Quiz/Quiz';
import Question from './components/Question/Question';
import Paper from './components/Paper/Paper';
import Signin from './components/Signin/Signin';
import Analytics from './components/Analytics/Analytics';
import Asistant from './components/Assistant/Assistant';
import History from './components/History/History';
import ExportPaper from './components/Export/ExportPaper';
// Helper function to check authentication
import {MathJaxContext} from "better-react-mathjax";

const mathJaxConfig = {
  loader: { load: ["input/tex", "output/chtml"] },
  tex: {
    inlineMath: [
      ["$", "$"], // Inline math using single $ delimiters
      ["\\(", "\\)"], // Inline math using \( ... \)
    ],
    displayMath: [
      ["$$", "$$"], // Block math using double $$ delimiters
      ["\\[", "\\]"], // Block math using \[ ... \]
    ],
    processEscapes: true,
    processEnvironments: true,
  },
  options: {
    skipHtmlTags: ["script", "noscript", "style", "textarea", "pre"],
    ignoreHtmlClass: "no-mathjax",
  },
};

const isAuthenticated = () => !!localStorage.getItem('user');

// PrivateRoute component to protect routes and include Header
const PrivateRoute = ({ element }) => {
  return isAuthenticated() ? (
    <>
      <Header />
      {element}
    </>
  ) : (
    <Navigate to="/signin" />
  );
};

export default function App() {
  return (
    <MathJaxContext config={mathJaxConfig}>
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/signin" element={<Signin />} />

        {/* Protected Routes */}
        <Route path="/" element={<PrivateRoute element={<Home />} />} />
        <Route path="/quiz" element={<PrivateRoute element={<Quiz />} />} />
        <Route path="/question" element={<PrivateRoute element={<Question />} />} />
        <Route path="/paper" element={<PrivateRoute element={<Paper />} />} />
        <Route path="/analytics" element={<PrivateRoute element={<Analytics />} />} />
        <Route path="/assistant" element={<PrivateRoute element={<Asistant />} />} />
        <Route path="/history" element={<PrivateRoute element={<History />} />} />
        <Route path="/export" element={<PrivateRoute element={<ExportPaper />} />} />
      </Routes>
    </Router>
    </MathJaxContext>
  );
}
