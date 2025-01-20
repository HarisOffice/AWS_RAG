import React, { useState,useEffect } from "react";
import MCQCards from "../Quiz/MCQCards";
import QuestionCards from "../Question/QuestionCards";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Typography,
  Grid,
  Box,
  Autocomplete,
  Chip,
} from "@mui/material";
// import {Autocomplete} from '@mui/material/Autocomplete';
import { formID } from "../../hooks/generateID";
import { getLocalTime } from "../../utils/time";
import { handleApiRequest } from "../../hooks/generateSubmit";
import { difficulty, grades, courses } from "../../utils/formData";
export default function Paper() {
  const [formData, setFormData] = useState({
    difficulty: "easy",
    grade: "9",
    course: "Physics",
    numberOfNumericals: 1,
  });
  const [contentA, setContentA] = useState([]);
  const [contentB, setContentB] = useState([]);
  const [contentC, setContentC] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generateID, setGenerateID] = useState();
  const staticid = 0
    useEffect(() => {
      const generateFormID = async () => {
        try {
          await formID({
            setGenerateID,
          });
        } catch (error) {
          console.error("Error generating ID:", error);
        }
      };
  
      generateFormID(); // Call the async function
    }, [setGenerateID, loading]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setContentA([]);
    setContentB([]);
    setContentC([]);
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const payload = {
    grade: parseInt(formData.grade, 10),
    course: formData.course,
    quantity: parseInt(formData.numberOfQuestions, 10),
    difficulty:
      formData.difficulty.charAt(0).toUpperCase() +
      formData.difficulty.slice(1),
    topic: formData.topic,
  };

  const handleSubmit = async (e) => {
    const method = "paper";
    
    e.preventDefault();
    const payload = {
      grade: parseInt(formData.grade, 10),
      course: formData.course,
      difficulty:
        formData.difficulty.charAt(0).toUpperCase() +
        formData.difficulty.slice(1),
      quantityNumericals: formData.numberOfNumericals,
    };

    const linkA = "http://127.0.0.1:8000/api/paperA";
    const linkB = "http://127.0.0.1:8000/api/paperB";
    const linkC = "http://127.0.0.1:8000/api/paperC";

    await handleApiRequest({
      link: linkA,
      payload,
      formData,
      setError,
      setContent: setContentA,
      setLoading,
      generateID,
      type:"mcqs",
      method,
    });

    await handleApiRequest({
      link: linkB,
      payload,
      formData,
      setError,
      setContent: setContentB,
      setLoading,
      generateID,
      type:"short",
      method,
    });

    await handleApiRequest({
      link: linkC,
      payload,
      formData,
      setError,
      setContent: setContentC,
      setLoading,
      generateID,
      type:"long",
      method,
    });
  };

  return (
    <Box p={4} sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <Grid container spacing={4}>
        {/* Form Section */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              p: 3,
              backgroundColor: "#fff",
              borderRadius: 2,
              boxShadow: 3,
            }}
          >
            <Typography variant="h4" gutterBottom>
              Paper Generator
            </Typography>
            <form onSubmit={handleSubmit}>
              {/* <form> */}
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="grade"
                    select
                    label="Grade"
                    value={formData.grade}
                    onChange={handleChange}
                  >
                    {grades.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="course"
                    select
                    label="Course"
                    value={formData.course}
                    onChange={handleChange}
                  >
                    {courses.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="difficulty"
                    select
                    label="Difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                  >
                    {difficulty.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    name="numberOfNumericals"
                    label="Number of Numericals"
                    type="number"
                    value={formData.numberOfNumericals}
                    onChange={handleChange}
                    inputProps={{ min: 1, max: 5 }}
                  />
                </Grid>
                {/* <Grid item xs={12} md={12}>
                </Grid> */}
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{ py: 1.5 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : "Generate"}
                  </Button>
                </Grid>
                <Grid item xs={12} md={12}>
                  <Typography color="info" className="py-3">
                    <b>
                      Note: The default chapter weights (out of 100) for Physics
                      are based on an analysis of the past five years' papers
                      and are being used for evaluation.
                    </b>
                  </Typography>
                </Grid>
                {error && (
                  <Grid item xs={12}>
                    <Typography color="error">{error}</Typography>
                  </Grid>
                )}
              </Grid>
            </form>
          </Box>
        </Grid>

        {/* MCQs Display Section */}
        <Grid item xs={12} md={6}>
          <Typography variant="h4" gutterBottom>
            Generated Paper
          </Typography>
          <Typography variant="h5" gutterBottom>
            Section A
          </Typography>
          <MCQCards content={contentA} />
          <Typography className="mt-4" variant="h5" gutterBottom>
            Section B
          </Typography>
          <QuestionCards content={contentB} />
          <Typography className="mt-4" variant="h5" gutterBottom>
            Section C
          </Typography>
          <QuestionCards content={contentC} />
        </Grid>
      </Grid>
    </Box>
  );
}
